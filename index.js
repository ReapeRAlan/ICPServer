const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const pool = require('./db');
const { check, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://aquatic-frontend.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Configurar Helmet para establecer la cabecera CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://aquatic-backend.onrender.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));

app.use(bodyParser.json());

app.get('/api/sensores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sensores');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/sensores', [
  check('tds').isFloat({ min: 0 }).withMessage('TDS must be a positive number'),
  check('ph').isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),
  check('oxigeno').isFloat({ min: 0 }).withMessage('Oxygen must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tds, ph, oxigeno } = req.body;
    const newSensor = await pool.query(
      'INSERT INTO sensores (tds, ph, oxigeno) VALUES($1, $2, $3) RETURNING *',
      [tds, ph, oxigeno]
    );
    res.json(newSensor.rows[0]);
  } catch (err) {
    console.error('Error inserting sensor data:', err);
    res.status(500).send('Server Error');
  }
});

// Ruta para eliminar todos los registros
app.delete('/api/sensores', async (req, res) => {
  try {
    await pool.query('DELETE FROM sensores');
    res.status(200).send('All sensor records deleted');
  } catch (err) {
    console.error('Error deleting sensor data:', err);
    res.status(500).send('Server Error');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
