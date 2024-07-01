// index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://aquatic-frontend.onrender.com', 'https://aquatic-backend.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
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

app.post('/api/sensores', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
