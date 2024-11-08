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

// Ruta para obtener datos de sensores
app.get('/api/sensores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sensores');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).send('Server Error');
  }
});

// Ruta para insertar nuevos datos de sensores y resultados de análisis
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
    const { tds, ph, oxigeno, prediccion_calidad } = req.body;

    // Insertar en la tabla sensores
    const newSensor = await pool.query(
      'INSERT INTO sensores (tds, ph, oxigeno) VALUES($1, $2, $3) RETURNING *',
      [tds, ph, oxigeno]
    );

    // Insertar los resultados del análisis si se proporciona el valor `prediccion_calidad`
    if (prediccion_calidad) {
      await pool.query(
        'INSERT INTO resultados_analisis (tds, ph, oxigeno, prediccion_calidad) VALUES ($1, $2, $3, $4)',
        [tds, ph, oxigeno, prediccion_calidad]
      );
    }

    res.json(newSensor.rows[0]);
  } catch (err) {
    console.error('Error inserting sensor data:', err);
    res.status(500).send('Server Error');
  }
});

// Ruta para eliminar todos los registros de la tabla sensores
app.delete('/api/sensores', async (req, res) => {
  try {
    await pool.query('DELETE FROM sensores');
    res.status(200).send('All sensor records deleted');
  } catch (err) {
    console.error('Error deleting sensor data:', err);
    res.status(500).send('Server Error');
  }
});

// Ruta para obtener resultados del análisis
app.get('/api/resultados_analisis', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resultados_analisis');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching analysis results:', err);
    res.status(500).send('Server Error');
  }
});

// Ruta para eliminar todos los registros de la tabla resultados_analisis
app.delete('/api/resultados_analisis', async (req, res) => {
  try {
    await pool.query('DELETE FROM resultados_analisis');
    res.status(200).send('All analysis records deleted');
  } catch (err) {
    console.error('Error deleting analysis results:', err);
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

// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
