const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getPool } = require('./db');

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospedajes', require('./routes/hospedajes'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/actividades', require('./routes/actividades'));
app.use('/api/departamentos', require('./routes/departamentos'));
// TODO: agregar /api/pagos, /api/resenas, /api/reportes, /api/admin/usuarios

app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});

module.exports = app;
