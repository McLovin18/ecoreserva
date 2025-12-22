const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../db');

const router = express.Router();

// Helpers
function mapRoleToNombreRol(role) {
  // roles frontend: admin | owner | client
  // roles BD: Administrador | Anfitrión | Turista
  if (role === 'admin') return 'Administrador';
  if (role === 'owner') return 'Anfitrión';
  return 'Turista';
}

function mapNombreRolToRole(nombreRol) {
  if (nombreRol === 'Administrador') return 'admin';
  if (nombreRol === 'Anfitrión') return 'owner';
  return 'client';
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

// Analizando el login actual del proyecto:
// - Validación de email y password (min 6 chars)
// - Mensajes específicos si email no existe o password incorrecta
// - Bloqueo futuro/rate limit en el frontend (SecureLogin)
// - Rol se resuelve después del login

// Registro de usuario (turista o anfitrión)
router.post('/register', async (req, res) => {
  const { nombre, apellido, correo, password, telefono, role } = req.body;

  // apellido ahora es opcional para alinearse con el formulario del frontend
  if (!nombre || !correo || !password) {
    return res.status(400).json({ code: 'auth/invalid-data', message: 'Nombre, correo y contraseña son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ code: 'auth/weak-password', message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const normalizedEmail = String(correo).toLowerCase();
  const desiredRole = mapRoleToNombreRol(role === 'owner' ? 'owner' : 'client');

  try {
    const pool = await getPool();

    // Verificar si el correo ya existe
    const existing = await pool
      .request()
      .input('correo', sql.NVarChar(150), normalizedEmail)
      .query('SELECT id_usuario FROM dbo.Usuario WHERE correo = @correo');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ code: 'auth/email-already-in-use', message: 'Este correo electrónico ya está en uso.' });
    }

    // Obtener id_rol según nombre_rol
    const roleResult = await pool
      .request()
      .input('nombreRol', sql.NVarChar(50), desiredRole)
      .query('SELECT id_rol FROM dbo.Rol WHERE nombre_rol = @nombreRol');

    if (roleResult.recordset.length === 0) {
      return res.status(500).json({ code: 'auth/role-not-found', message: 'Rol no configurado en la base de datos.' });
    }

    const idRol = roleResult.recordset[0].id_rol;

    const hashed = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input('nombre', sql.NVarChar(80), nombre)
      .input('apellido', sql.NVarChar(80), apellido || '')
      .input('correo', sql.NVarChar(150), normalizedEmail)
      .input('contrasena', sql.NVarChar(255), hashed)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .input('idRol', sql.Int, idRol)
      .query(`
        INSERT INTO dbo.Usuario (nombre, apellido, correo, contrasena, telefono, id_rol)
        VALUES (@nombre, @apellido, @correo, @contrasena, @telefono, @idRol)
      `);

    // Alineado con el frontend actual: tras registrar, se pide verificar correo y luego iniciar sesión.
    // Aquí dejamos que el frontend redirija a una pantalla de "verifica tu correo" o similar si quieres.

    return res.status(201).json({ message: 'Usuario registrado correctamente.' });
  } catch (err) {
    console.error('Error en /auth/register:', err);
    return res.status(500).json({ code: 'auth/internal-error', message: 'Error interno al registrar usuario.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ code: 'auth/invalid-data', message: 'Debes ingresar correo y contraseña.' });
  }
  if (password.length < 6) {
    // Igual que en SecureLogin, se exige mínimo 6 caracteres
    return res.status(400).json({ code: 'auth/weak-password', message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const normalizedEmail = String(correo).toLowerCase();

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('correo', sql.NVarChar(150), normalizedEmail)
      .query(`
        SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.contrasena, r.nombre_rol
        FROM dbo.Usuario u
        JOIN dbo.Rol r ON u.id_rol = r.id_rol
        WHERE u.correo = @correo
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ code: 'auth/user-not-found', message: 'No existe una cuenta con este email.' });
    }

    const user = result.recordset[0];

    const passwordOk = await bcrypt.compare(password, user.contrasena);
    if (!passwordOk) {
      return res.status(401).json({ code: 'auth/wrong-password', message: 'Contraseña incorrecta.' });
    }

    const role = mapNombreRolToRole(user.nombre_rol);

    // Firmar token con info mínima
    const token = signToken({
      sub: user.id_usuario,
      email: user.correo,
      role,
    });

    return res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.correo,
        role,
      },
    });
  } catch (err) {
    console.error('Error en /auth/login:', err);
    return res.status(500).json({ code: 'auth/internal-error', message: 'Error interno al iniciar sesión.' });
  }
});

// Endpoint para obtener el usuario actual desde el token (similar a AuthContext + RoleProvider)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idUsuario', sql.Int, decoded.sub)
      .query(`
        SELECT u.id_usuario, u.nombre, u.apellido, u.correo, r.nombre_rol
        FROM dbo.Usuario u
        JOIN dbo.Rol r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = @idUsuario
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = result.recordset[0];
    const role = mapNombreRolToRole(user.nombre_rol);

    return res.json({
      id: user.id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.correo,
      role,
    });
  } catch (err) {
    console.error('Error en /auth/me:', err);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
});

module.exports = router;
