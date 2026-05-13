const express = require('express');
const { Pool } = require('pg');

require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Esta opción es clave para evitar el error de red inalcanzable (IPv6)
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Forzamos a Node.js a preferir IPv4 globalmente
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Fallo crítico al conectar con Supabase:', err.stack);
  }
  console.log('Conexión con Supabase establecida exitosamente.');
  release();
});

app.post('/login', async (req, res) => {
  // Ahora recibimos 'nombre' y 'password' desde el cuerpo de la petición
  const { nombre, password } = req.body;

  try {
    // Cambiamos la consulta para buscar por la columna 'nombre' en lugar de 'correo'
    const query = 'SELECT * FROM usuarios WHERE nombre = $1 AND password = $2';
    const result = await pool.query(query, [nombre, password]);

    if (result.rows.length > 0) {
      res.json({ 
        mensaje: "Bienvenido", 
        usuario: result.rows[0].nombre,
        rol: result.rows[0].rol 
      });
    } else {
      res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    console.error("Error en el login:", err);
    res.status(500).send("Error en el servidor");
  }
});

app.get('/api/test', (req, res) => {
    res.json({ message: "API funcionando" });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});