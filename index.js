// index.js en tu servidor backend
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Permitir solicitudes desde cualquier origen
app.use(cors());
app.use(bodyParser.json());

// Rutas de tu API
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
