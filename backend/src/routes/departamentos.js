const express = require('express');
const { getPool, sql } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Crear nuevo departamento dentro de un hotel
router.post('/', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const { hotelId, name, description, price, capacity } = req.body;

  if (!hotelId || !name || price == null) {
    return res.status(400).json({ message: 'Faltan datos obligatorios del departamento (hotel, nombre, precio).' });
  }

  try {
    const pool = await getPool();

    // Verificar que el hotel exista y, si es owner, que le pertenezca
    const hotelResult = await pool
      .request()
      .input('idHospedaje', sql.Int, hotelId)
      .query(`
        SELECT id_hospedaje, id_usuario_anfitrion, nombre
        FROM dbo.Hospedaje
        WHERE id_hospedaje = @idHospedaje
      `);

    if (hotelResult.recordset.length === 0) {
      return res.status(400).json({ message: 'No se encontró el hotel especificado.' });
    }

    const hotel = hotelResult.recordset[0];

    if (req.user.role === 'owner' && hotel.id_usuario_anfitrion !== req.user.sub) {
      return res.status(403).json({ message: 'No puedes crear departamentos en un hotel que no es tuyo.' });
    }

    const insertResult = await pool
      .request()
      .input('idHospedaje', sql.Int, hotelId)
      .input('nombre', sql.NVarChar(120), name)
      .input('descripcion', sql.NVarChar(600), description || '')
      .input('precioNoche', sql.Decimal(10, 2), price)
      .input('capacidad', sql.Int, capacity || null)
      .query(`
        INSERT INTO dbo.Departamento (
          id_hospedaje, nombre, descripcion, precio_noche, capacidad, estado
        )
        OUTPUT INSERTED.id_departamento
        VALUES (
          @idHospedaje, @nombre, @descripcion, @precioNoche, @capacidad, N'Pendiente'
        )
      `);

    const inserted = insertResult.recordset && insertResult.recordset[0];
    res.status(201).json({ id: inserted?.id_departamento });
  } catch (err) {
    console.error('Error en POST /api/departamentos:', err);
    res.status(500).json({ message: 'Error al crear departamento.' });
  }
});

// Listar departamentos de los hoteles del owner actual
router.get('/owner/me', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idUsuario', sql.Int, req.user.sub)
      .query(`
        SELECT 
          d.id_departamento,
          d.id_hospedaje,
          d.nombre,
          d.descripcion,
          d.precio_noche,
          d.capacidad,
          d.estado,
          h.nombre AS hotel_nombre
        FROM dbo.Departamento d
        JOIN dbo.Hospedaje h ON d.id_hospedaje = h.id_hospedaje
        WHERE h.id_usuario_anfitrion = @idUsuario
      `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_departamento,
      hotelId: row.id_hospedaje,
      hotelName: row.hotel_nombre,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio_noche,
      capacity: row.capacidad,
      status: row.estado,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/departamentos/owner/me:', err);
    res.status(500).json({ message: 'Error al obtener departamentos.' });
  }
});

// Listar departamentos pendientes para revisión del admin
router.get('/pending', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        d.id_departamento,
        d.id_hospedaje,
        d.nombre,
        d.descripcion,
        d.precio_noche,
        d.capacidad,
        d.estado,
        h.nombre  AS hotel_nombre,
        u.correo  AS owner_correo
      FROM dbo.Departamento d
      JOIN dbo.Hospedaje h ON d.id_hospedaje = h.id_hospedaje
      JOIN dbo.Usuario   u ON h.id_usuario_anfitrion = u.id_usuario
      WHERE d.estado = N'Pendiente'
      ORDER BY d.id_departamento DESC
    `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_departamento,
      hotelId: row.id_hospedaje,
      hotelName: row.hotel_nombre,
      ownerEmail: row.owner_correo,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio_noche,
      capacity: row.capacidad,
      status: row.estado,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/departamentos/pending:', err);
    res.status(500).json({ message: 'Error al obtener departamentos pendientes.' });
  }
});

// Listar departamentos aprobados de un hotel (público para turistas)
router.get('/by-hotel/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idHospedaje', sql.Int, Number(id))
      .query(`
        SELECT 
          d.id_departamento,
          d.id_hospedaje,
          d.nombre,
          d.descripcion,
          d.precio_noche,
          d.capacidad,
          d.estado,
          h.nombre AS hotel_nombre
        FROM dbo.Departamento d
        JOIN dbo.Hospedaje h ON d.id_hospedaje = h.id_hospedaje
        WHERE d.id_hospedaje = @idHospedaje
          AND d.estado = N'Aprobado'
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.Reserva r
            JOIN dbo.EstadoReserva er ON r.id_estado_reserva = er.id_estado_reserva
            WHERE r.id_departamento = d.id_departamento
              AND er.nombre_estado IN (N'Pendiente', N'Confirmada')
              AND CAST(GETDATE() AS DATE) < r.fecha_salida
              AND CAST(GETDATE() AS DATE) >= r.fecha_ingreso
          )
        ORDER BY d.id_departamento ASC
      `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_departamento,
      hotelId: row.id_hospedaje,
      hotelName: row.hotel_nombre,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio_noche,
      capacity: row.capacidad,
      status: row.estado,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/departamentos/by-hotel/:id:', err);
    res.status(500).json({ message: 'Error al obtener departamentos del hotel.' });
  }
});

// Actualizar estado de departamento (aprobado / rechazado) por admin
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Aprobado' | 'Rechazado'

  if (!status || !['Aprobado', 'Rechazado'].includes(status)) {
    return res.status(400).json({ message: 'Estado de departamento no válido.' });
  }

  try {
    const pool = await getPool();

    await pool
      .request()
      .input('idDepartamento', sql.Int, Number(id))
      .input('estado', sql.NVarChar(30), status)
      .query(`
        UPDATE dbo.Departamento
        SET estado = @estado
        WHERE id_departamento = @idDepartamento
      `);

    res.json({ message: 'Estado de departamento actualizado.' });
  } catch (err) {
    console.error('Error en PATCH /api/departamentos/:id/status:', err);
    res.status(500).json({ message: 'Error al actualizar estado del departamento.' });
  }
});

module.exports = router;
