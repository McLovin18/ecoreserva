const express = require('express');
const { getPool, sql } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Crear actividad para un hospedaje (owner)
router.post('/', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const {
    propertyId,
    name,
    description,
    price,
    typeName,
    tipoActividadId,
    ubicacionId,
  } = req.body;

  if (!propertyId || !name) {
    return res.status(400).json({ message: 'Faltan datos de la actividad.' });
  }

  try {
    const pool = await getPool();
    // Resolver tipo de actividad por defecto si no viene en el body
    let idTipo = tipoActividadId;
    if (!idTipo) {
      const nombreTipo = typeName || 'Aventura';
      const tipoResult = await pool
        .request()
        .input('nombreTipo', sql.NVarChar(60), nombreTipo)
        .query('SELECT id_tipo_actividad FROM dbo.TipoActividad WHERE nombre_tipo = @nombreTipo');
      idTipo = tipoResult.recordset[0]?.id_tipo_actividad || 1;
    }

    // Resolver ubicación por defecto si no viene en el body (usar la del hospedaje)
    let idUbicacion = ubicacionId;
    if (!idUbicacion) {
      const ubResult = await pool
        .request()
        .input('idHospedaje', sql.Int, propertyId)
        .query('SELECT id_ubicacion FROM dbo.Hospedaje WHERE id_hospedaje = @idHospedaje');
      idUbicacion = ubResult.recordset[0]?.id_ubicacion || null;
    }

    if (!idUbicacion) {
      return res.status(400).json({ message: 'No se pudo determinar una ubicación válida para la actividad.' });
    }

    const result = await pool
      .request()
      .input('idHospedaje', sql.Int, propertyId)
      .input('nombre', sql.NVarChar(120), name)
      .input('descripcion', sql.NVarChar(600), description || '')
      .input('precio', sql.Decimal(10, 2), price || 0)
      .input('idTipo', sql.Int, idTipo)
      .input('idUbicacion', sql.Int, idUbicacion)
      .query(`
        INSERT INTO dbo.Actividad (
          nombre, descripcion, precio, id_hospedaje, id_tipo_actividad, id_ubicacion
        )
        OUTPUT INSERTED.id_actividad
        VALUES (
          @nombre, @descripcion, @precio, @idHospedaje, @idTipo, @idUbicacion
        )
      `);

    const inserted = result.recordset && result.recordset[0];
    res.status(201).json({ id: inserted?.id_actividad });
  } catch (err) {
    console.error('Error en POST /api/actividades:', err);
    res.status(500).json({ message: 'Error al crear actividad.' });
  }
});

// Actualizar actividad existente
router.put('/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const { id } = req.params;
  const {
    propertyId,
    name,
    description,
    price,
    typeName,
    tipoActividadId,
  } = req.body;

  const idActividad = parseInt(id, 10);
  if (!idActividad || Number.isNaN(idActividad)) {
    return res.status(400).json({ message: 'ID de actividad no válido.' });
  }

  if (!propertyId || !name) {
    return res.status(400).json({ message: 'Faltan datos de la actividad.' });
  }

  try {
    const pool = await getPool();

    // Resolver tipo de actividad (por nombre o id)
    let idTipo = tipoActividadId;
    if (!idTipo && typeName) {
      const tipoResult = await pool
        .request()
        .input('nombreTipo', sql.NVarChar(60), typeName)
        .query('SELECT id_tipo_actividad FROM dbo.TipoActividad WHERE nombre_tipo = @nombreTipo');
      idTipo = tipoResult.recordset[0]?.id_tipo_actividad || null;
    }

    if (!idTipo) {
      const tipoResult = await pool
        .request()
        .input('nombreTipo', sql.NVarChar(60), 'Aventura')
        .query('SELECT id_tipo_actividad FROM dbo.TipoActividad WHERE nombre_tipo = @nombreTipo');
      idTipo = tipoResult.recordset[0]?.id_tipo_actividad || 1;
    }

    await pool
      .request()
      .input('idActividad', sql.Int, idActividad)
      .input('idHospedaje', sql.Int, propertyId)
      .input('nombre', sql.NVarChar(120), name)
      .input('descripcion', sql.NVarChar(600), description || '')
      .input('precio', sql.Decimal(10, 2), price || 0)
      .input('idTipo', sql.Int, idTipo)
      .query(`
        UPDATE dbo.Actividad
        SET
          nombre = @nombre,
          descripcion = @descripcion,
          precio = @precio,
          id_hospedaje = @idHospedaje,
          id_tipo_actividad = @idTipo
        WHERE id_actividad = @idActividad
      `);

    res.json({ message: 'Actividad actualizada correctamente.' });
  } catch (err) {
    console.error('Error en PUT /api/actividades/:id:', err);
    res.status(500).json({ message: 'Error al actualizar actividad.' });
  }
});

// Listar actividades del owner
router.get('/owner/me', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idUsuario', sql.Int, req.user.sub)
      .query(`
        SELECT 
          a.id_actividad,
          a.id_hospedaje,
          a.nombre,
          a.descripcion,
          a.precio,
          ta.nombre_tipo    AS tipo_actividad
        FROM dbo.Actividad a
        JOIN dbo.Hospedaje h    ON a.id_hospedaje = h.id_hospedaje
        JOIN dbo.TipoActividad ta ON a.id_tipo_actividad = ta.id_tipo_actividad
        WHERE h.id_usuario_anfitrion = @idUsuario
      `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_actividad,
      propertyId: row.id_hospedaje,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio,
      type: row.tipo_actividad,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/actividades/owner/me:', err);
    res.status(500).json({ message: 'Error al obtener actividades.' });
  }
});

// Listar actividades de un hospedaje (para cualquier usuario autenticado)
router.get('/hospedaje/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const idHospedaje = parseInt(id, 10);
  if (!idHospedaje || Number.isNaN(idHospedaje)) {
    return res.status(400).json({ message: 'ID de hospedaje no válido.' });
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idHospedaje', sql.Int, idHospedaje)
      .query(`
        SELECT 
          a.id_actividad,
          a.id_hospedaje,
          a.nombre,
          a.descripcion,
          a.precio,
          ta.nombre_tipo    AS tipo_actividad
        FROM dbo.Actividad a
        JOIN dbo.TipoActividad ta ON a.id_tipo_actividad = ta.id_tipo_actividad
        WHERE a.id_hospedaje = @idHospedaje
      `);

    const rows = result.recordset || [];
    const data = rows.map((row) => ({
      id: row.id_actividad,
      propertyId: row.id_hospedaje,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio,
      type: row.tipo_actividad,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/actividades/hospedaje/:id:', err);
    res.status(500).json({ message: 'Error al obtener actividades para el hospedaje.' });
  }
});

// Eliminar actividad
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const { id } = req.params;
  const idActividad = parseInt(id, 10);

  if (!idActividad || Number.isNaN(idActividad)) {
    return res.status(400).json({ message: 'ID de actividad no válido.' });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input('idActividad', sql.Int, idActividad)
      .query('DELETE FROM dbo.Actividad WHERE id_actividad = @idActividad');

    return res.status(204).send();
  } catch (err) {
    console.error('Error en DELETE /api/actividades/:id:', err);
    res.status(500).json({ message: 'Error al eliminar actividad.' });
  }
});

module.exports = router;
