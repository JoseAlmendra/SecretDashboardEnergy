require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Fallo de conexión:', err.stack);
    }

    console.log('Conexión con Supabase exitosa.');
    release();
});
console.log(process.env.DATABASE_URL);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// 4. Ruta de Login
app.post('/login', async (req, res) => {
  const { nombre, password } = req.body;
  try {
    const query = 'SELECT * FROM usuarios WHERE nombre = $1 AND password = $2';
    const result = await pool.query(query, [nombre, password]);

    if (result.rows.length > 0) {
      res.json({ 
        mensaje: "Bienvenido", 
        usuario: result.rows[0].nombre,
        rol: result.rows[0].rol 
      });
    } else {
      res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});