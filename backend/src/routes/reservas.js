const express = require('express');
const { getPool, sql } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Crear reserva (y, opcionalmente, el pago asociado)
router.post('/', requireAuth, requireRole('client'), async (req, res) => {
  const {
    propertyId,
    total,
    startDate,
    endDate,
    guests,
    paymentMethod,
  } = req.body;

  if (!propertyId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Datos incompletos para crear la reserva.' });
  }

  try {
    const pool = await getPool();

    // Verificar solapamiento básico de reservas para el mismo hospedaje
    const overlapResult = await pool
      .request()
      .input('idHospedaje', sql.Int, propertyId)
      .input('startDate', sql.Date, new Date(startDate))
      .input('endDate', sql.Date, new Date(endDate))
      .query(`
        SELECT 1
        FROM dbo.Reserva r
        JOIN dbo.EstadoReserva er ON r.id_estado_reserva = er.id_estado_reserva
        WHERE r.id_hospedaje = @idHospedaje
          AND er.nombre_estado IN (N'Pendiente', N'Confirmada')
          AND @startDate < r.fecha_salida
          AND @endDate   > r.fecha_ingreso
      `);

    if (overlapResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Las fechas seleccionadas ya están reservadas para este hospedaje.' });
    }

    // Resolver estado "Pendiente"
    const estadoResult = await pool
      .request()
      .input('nombreEstado', sql.NVarChar(30), 'Pendiente')
      .query('SELECT id_estado_reserva FROM dbo.EstadoReserva WHERE nombre_estado = @nombreEstado');

    const idEstado = estadoResult.recordset[0]?.id_estado_reserva;
    if (!idEstado) {
      return res.status(500).json({ message: 'Estado de reserva "Pendiente" no configurado en la base de datos.' });
    }

    // Crear reserva
    const reservaResult = await pool
      .request()
      .input('idHospedaje', sql.Int, propertyId)
      .input('idUsuario', sql.Int, req.user.sub)
      .input('fechaIngreso', sql.Date, new Date(startDate))
      .input('fechaSalida', sql.Date, new Date(endDate))
      .input('numPersonas', sql.SmallInt, guests || 1)
      .input('idEstado', sql.Int, idEstado)
      .query(`
        INSERT INTO dbo.Reserva (
          fecha_ingreso, fecha_salida, num_personas,
          id_usuario_turista, id_hospedaje, id_estado_reserva
        )
        OUTPUT INSERTED.id_reserva
        VALUES (
          @fechaIngreso, @fechaSalida, @numPersonas,
          @idUsuario, @idHospedaje, @idEstado
        )
      `);

    const inserted = reservaResult.recordset && reservaResult.recordset[0];
    const idReserva = inserted?.id_reserva;

    // Si viene total y método de pago, registrar el pago
    if (idReserva && total && paymentMethod) {
      const metodoResult = await pool
        .request()
        .input('nombreMetodo', sql.NVarChar(40), paymentMethod)
        .query('SELECT id_metodo_pago FROM dbo.MetodoPago WHERE nombre_metodo = @nombreMetodo');

      const idMetodo = metodoResult.recordset[0]?.id_metodo_pago;
      if (idMetodo) {
        await pool
          .request()
          .input('monto', sql.Decimal(10, 2), total)
          .input('idReserva', sql.Int, idReserva)
          .input('idMetodo', sql.Int, idMetodo)
          .input('idUsuario', sql.Int, req.user.sub)
          .query(`
            INSERT INTO dbo.Pago (monto, id_reserva, id_metodo_pago, id_usuario_turista)
            VALUES (@monto, @idReserva, @idMetodo, @idUsuario)
          `);
      }
    }

    res.status(201).json({ id: idReserva });
  } catch (err) {
    console.error('Error en POST /api/reservas:', err);
    res.status(500).json({ message: 'Error al crear reserva.' });
  }
});

// Actualizar estado de reserva (owner o admin) usando EstadoReserva
router.patch('/:id/status', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // nombre de estado, ej: 'Confirmada', 'Cancelada'

  if (!status) {
    return res.status(400).json({ message: 'Debe especificar un estado.' });
  }

  try {
    const pool = await getPool();

    const estadoResult = await pool
      .request()
      .input('nombreEstado', sql.NVarChar(30), status)
      .query('SELECT id_estado_reserva FROM dbo.EstadoReserva WHERE nombre_estado = @nombreEstado');

    if (estadoResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Estado de reserva no válido.' });
    }

    const idEstado = estadoResult.recordset[0].id_estado_reserva;

    await pool
      .request()
      .input('idReserva', sql.Int, Number(id))
      .input('idEstado', sql.Int, idEstado)
      .query(`
        UPDATE dbo.Reserva
        SET id_estado_reserva = @idEstado
        WHERE id_reserva = @idReserva
      `);

    res.json({ message: 'Estado de reserva actualizado.' });
  } catch (err) {
    console.error('Error en PATCH /api/reservas/:id/status:', err);
    res.status(500).json({ message: 'Error al actualizar reserva.' });
  }
});

// Nota: el modelo físico maneja pagos en la tabla Pago sin estado explícito,
// por lo que el endpoint /:id/payment-status se deja sin efecto (stub).
router.patch('/:id/payment-status', requireAuth, requireRole('admin'), async (req, res) => {
  return res.json({ message: 'El estado de pago se gestiona a través de la tabla Pago. No hay cambios que aplicar.' });
});

// Reservas del usuario (turista)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idUsuario', sql.Int, req.user.sub)
      .query(`
        SELECT 
          r.id_reserva,
          r.id_hospedaje,
          r.fecha_ingreso     AS fecha_inicio,
          r.fecha_salida      AS fecha_fin,
          r.num_personas      AS huespedes,
          p.monto             AS monto_total,
          mp.nombre_metodo    AS metodo_pago,
          er.nombre_estado    AS estado
        FROM dbo.Reserva r
        JOIN dbo.EstadoReserva er ON r.id_estado_reserva = er.id_estado_reserva
        LEFT JOIN dbo.Pago p       ON p.id_reserva       = r.id_reserva
        LEFT JOIN dbo.MetodoPago mp ON p.id_metodo_pago  = mp.id_metodo_pago
        WHERE r.id_usuario_turista = @idUsuario
        ORDER BY r.fecha_ingreso DESC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error('Error en GET /api/reservas/me:', err);
    res.status(500).json({ message: 'Error al obtener reservas del usuario.' });
  }
});

// Reservas por propietario (owner)
router.get('/owner/me', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('idUsuario', sql.Int, req.user.sub)
      .query(`
        SELECT 
          r.id_reserva,
          r.id_hospedaje,
          r.fecha_ingreso     AS fecha_inicio,
          r.fecha_salida      AS fecha_fin,
          r.num_personas      AS huespedes,
          p.monto             AS monto_total,
          mp.nombre_metodo    AS metodo_pago,
          er.nombre_estado    AS estado
        FROM dbo.Reserva r
        JOIN dbo.Hospedaje h   ON r.id_hospedaje = h.id_hospedaje
        JOIN dbo.EstadoReserva er ON r.id_estado_reserva = er.id_estado_reserva
        LEFT JOIN dbo.Pago p       ON p.id_reserva       = r.id_reserva
        LEFT JOIN dbo.MetodoPago mp ON p.id_metodo_pago  = mp.id_metodo_pago
        WHERE h.id_usuario_anfitrion = @idUsuario
        ORDER BY r.fecha_ingreso DESC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error('Error en GET /api/reservas/owner/me:', err);
    res.status(500).json({ message: 'Error al obtener reservas del propietario.' });
  }
});

// Todas las reservas (admin)
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        r.id_reserva,
        r.id_hospedaje,
        r.fecha_ingreso     AS fecha_inicio,
        r.fecha_salida      AS fecha_fin,
        r.num_personas      AS huespedes,
        p.monto             AS monto_total,
        mp.nombre_metodo    AS metodo_pago,
        er.nombre_estado    AS estado
      FROM dbo.Reserva r
      JOIN dbo.EstadoReserva er ON r.id_estado_reserva = er.id_estado_reserva
      LEFT JOIN dbo.Pago p       ON p.id_reserva       = r.id_reserva
      LEFT JOIN dbo.MetodoPago mp ON p.id_metodo_pago  = mp.id_metodo_pago
      ORDER BY r.fecha_ingreso DESC
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error('Error en GET /api/reservas:', err);
    res.status(500).json({ message: 'Error al obtener reservas.' });
  }
});

module.exports = router;
