require('dotenv').config();
const dns = require('dns');
const express = require('express');
const { Pool } = require('pg');

// 1. Configuración de Red (Solo una vez)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

// 2. Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 3. Verificación de Conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Fallo de conexión:', err.stack);
  }
  console.log('Conexión con Supabase exitosa.');
  release();
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