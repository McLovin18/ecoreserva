const express = require('express');
const { getPool, sql } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Listar hospedajes disponibles para clientes
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        h.id_hospedaje,
        h.nombre,
        h.descripcion,
        h.precio_base,
        th.nombre_tipo       AS tipo_hospedaje,
        eh.nombre_estado     AS estado
      FROM dbo.Hospedaje h
      JOIN dbo.TipoHospedaje  th ON h.id_tipo_hospedaje   = th.id_tipo_hospedaje
      JOIN dbo.EstadoHospedaje eh ON h.id_estado_hospedaje = eh.id_estado_hospedaje
      WHERE eh.nombre_estado = N'Activo'
    `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_hospedaje,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio_base,
      type: row.tipo_hospedaje,
      status: row.estado,
      isActive: row.estado === 'Activo',
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/hospedajes:', err);
    res.status(500).json({ message: 'Error al obtener hospedajes.' });
  }
});

// Hospedajes del propietario autenticado
router.get('/owner/me', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idUsuario', sql.Int, req.user.sub)
      .query(`
        SELECT 
          h.id_hospedaje,
          h.nombre,
          h.descripcion,
          h.precio_base,
          th.nombre_tipo       AS tipo_hospedaje,
          eh.nombre_estado     AS estado
        FROM dbo.Hospedaje h
        JOIN dbo.TipoHospedaje  th ON h.id_tipo_hospedaje   = th.id_tipo_hospedaje
        JOIN dbo.EstadoHospedaje eh ON h.id_estado_hospedaje = eh.id_estado_hospedaje
        WHERE h.id_usuario_anfitrion = @idUsuario
      `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_hospedaje,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio_base,
      type: row.tipo_hospedaje,
      status: row.estado,
      isActive: row.estado === 'Activo',
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/hospedajes/owner/me:', err);
    res.status(500).json({ message: 'Error al obtener hospedajes del propietario.' });
  }
});

// Listado completo de hospedajes para el administrador
router.get('/admin', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        h.id_hospedaje,
        h.nombre,
        h.descripcion,
        h.precio_base,
        th.nombre_tipo       AS tipo_hospedaje,
        eh.nombre_estado     AS estado,
        u.correo             AS owner_email
      FROM dbo.Hospedaje h
      JOIN dbo.TipoHospedaje  th ON h.id_tipo_hospedaje   = th.id_tipo_hospedaje
      JOIN dbo.EstadoHospedaje eh ON h.id_estado_hospedaje = eh.id_estado_hospedaje
      JOIN dbo.Usuario u ON h.id_usuario_anfitrion = u.id_usuario
    `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_hospedaje,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio_base,
      type: row.tipo_hospedaje,
      status: row.estado,
      isActive: row.estado === 'Activo',
      ownerEmail: row.owner_email,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/hospedajes/admin:', err);
    res.status(500).json({ message: 'Error al obtener hospedajes para administrador.' });
  }
});

// Crear nuevo hospedaje (propietario)
router.post('/', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const {
    name,
    price,
    description,
    tipoHospedajeId,
    ubicacionId,
    estadoHospedajeId,
    ownerEmail,
    comunidad,
    canton,
    provincia,
  } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ message: 'Faltan datos obligatorios del hospedaje (nombre, precio).' });
  }

  try {
    const pool = await getPool();

    // Resolver anfitrión: si es admin y viene ownerEmail, usamos ese usuario; si no, usamos el usuario autenticado
    let anfitrionId = req.user.sub;
    if (req.user.role === 'admin' && ownerEmail) {
      const ownerResult = await pool
        .request()
        .input('correo', sql.NVarChar(150), String(ownerEmail).toLowerCase())
        .query('SELECT id_usuario FROM dbo.Usuario WHERE correo = @correo');

      if (ownerResult.recordset.length === 0) {
        return res.status(400).json({ message: 'No se encontró un usuario anfitrión con ese correo.' });
      }
      anfitrionId = ownerResult.recordset[0].id_usuario;
    }

    // Resolver tipo de hospedaje por defecto si no viene en el body
    let idTipo = tipoHospedajeId;
    if (!idTipo) {
      const tipoResult = await pool
        .request()
        .input('nombreTipo', sql.NVarChar(60), 'Cabaña')
        .query('SELECT id_tipo_hospedaje FROM dbo.TipoHospedaje WHERE nombre_tipo = @nombreTipo');
      idTipo = tipoResult.recordset[0]?.id_tipo_hospedaje || 1;
    }

    // Resolver ubicación por defecto si no viene en el body
    let idUbicacion = ubicacionId;
    if (!idUbicacion) {
      // Si viene una ubicación textual desde el frontend, siempre creamos una nueva Ubicacion
      // usando esa información (reutilizando la primera región disponible).
      if (comunidad || canton || provincia) {
        const regionResult = await pool
          .request()
          .query('SELECT TOP 1 id_region FROM dbo.Region ORDER BY id_region');

        const idRegion = regionResult.recordset[0]?.id_region || 1;

        const insertUbic = await pool
          .request()
          .input('comunidad', sql.NVarChar(80), comunidad || canton || provincia || 'General')
          .input('canton', sql.NVarChar(80), canton || comunidad || provincia || 'General')
          .input('provincia', sql.NVarChar(80), provincia || comunidad || canton || 'General')
          .input('idRegion', sql.Int, idRegion)
          .query(`
            INSERT INTO dbo.Ubicacion (comunidad, canton, provincia, id_region)
            OUTPUT INSERTED.id_ubicacion
            VALUES (@comunidad, @canton, @provincia, @idRegion)
          `);

        idUbicacion = insertUbic.recordset[0].id_ubicacion;
      } else {
        // Comportamiento anterior: reutilizar una ubicación existente o crear genérica
        const ubicResult = await pool
          .request()
          .query('SELECT TOP 1 id_ubicacion FROM dbo.Ubicacion ORDER BY id_ubicacion');

        if (ubicResult.recordset.length === 0) {
          // Si no hay ubicaciones, creamos una genérica usando la primera región disponible
          const regionResult = await pool
            .request()
            .query('SELECT TOP 1 id_region FROM dbo.Region ORDER BY id_region');

          const idRegion = regionResult.recordset[0]?.id_region || 1;

          const insertUbic = await pool
            .request()
            .input('comunidad', sql.NVarChar(80), 'General')
            .input('canton', sql.NVarChar(80), 'General')
            .input('provincia', sql.NVarChar(80), 'General')
            .input('idRegion', sql.Int, idRegion)
            .query(`
              INSERT INTO dbo.Ubicacion (comunidad, canton, provincia, id_region)
              OUTPUT INSERTED.id_ubicacion
              VALUES (@comunidad, @canton, @provincia, @idRegion)
            `);

          idUbicacion = insertUbic.recordset[0].id_ubicacion;
        } else {
          idUbicacion = ubicResult.recordset[0].id_ubicacion;
        }
      }
    }

    // Resolver estado de hospedaje (por defecto Activo)
    let idEstado = estadoHospedajeId;
    if (!idEstado) {
      const estadoResult = await pool
        .request()
        .input('nombreEstado', sql.NVarChar(30), 'Activo')
        .query('SELECT id_estado_hospedaje FROM dbo.EstadoHospedaje WHERE nombre_estado = @nombreEstado');
      idEstado = estadoResult.recordset[0]?.id_estado_hospedaje || 1;
    }

    const result = await pool
      .request()
      .input('nombre', sql.NVarChar(120), name)
      .input('descripcion', sql.NVarChar(600), description || '')
      .input('precioBase', sql.Decimal(10, 2), price)
      .input('idUsuario', sql.Int, anfitrionId)
      .input('idTipo', sql.Int, idTipo)
      .input('idUbicacion', sql.Int, idUbicacion)
      .input('idEstado', sql.Int, idEstado)
      .query(`
        INSERT INTO dbo.Hospedaje (
          nombre, descripcion, precio_base, id_usuario_anfitrion,
          id_tipo_hospedaje, id_ubicacion, id_estado_hospedaje
        )
        OUTPUT INSERTED.id_hospedaje
        VALUES (
          @nombre, @descripcion, @precioBase, @idUsuario,
          @idTipo, @idUbicacion, @idEstado
        )
      `);

    const inserted = result.recordset && result.recordset[0];
    res.status(201).json({
      id: inserted?.id_hospedaje,
      message: 'Hospedaje creado correctamente.',
    });
  } catch (err) {
    console.error('Error en POST /api/hospedajes:', err);
    res.status(500).json({ message: 'Error al crear hospedaje.' });
  }
});

// Actualizar estado del hospedaje (admin) usando tabla EstadoHospedaje
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // nombre del estado, ej: 'Activo' | 'Inactivo'

  if (!status) {
    return res.status(400).json({ message: 'Debe especificar un estado.' });
  }

  try {
    const pool = await getPool();

    const estadoResult = await pool
      .request()
      .input('nombreEstado', sql.NVarChar(30), status)
      .query('SELECT id_estado_hospedaje FROM dbo.EstadoHospedaje WHERE nombre_estado = @nombreEstado');

    if (estadoResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Estado de hospedaje no válido.' });
    }

    const idEstado = estadoResult.recordset[0].id_estado_hospedaje;

    await pool
      .request()
      .input('idHospedaje', sql.Int, Number(id))
      .input('idEstado', sql.Int, idEstado)
      .query(`
        UPDATE dbo.Hospedaje
        SET id_estado_hospedaje = @idEstado
        WHERE id_hospedaje = @idHospedaje
      `);

    res.json({ message: 'Estado de hospedaje actualizado.' });
  } catch (err) {
    console.error('Error en PATCH /api/hospedajes/:id/status:', err);
    res.status(500).json({ message: 'Error al actualizar estado de hospedaje.' });
  }
});

module.exports = router;
