require('dotenv').config();
const dns = require('dns');

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// 2. Middlewares
app.use(express.json());
app.use(express.static('public'));

// 3. Configuración de la Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// 4. Verificación de Conexión Inicial
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Fallo crítico al conectar con Supabase:', err.stack);
  }
  console.log('Conexión con Supabase establecida exitosamente.');
  release();
});

// 5. Rutas
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
      res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    console.error("Error en el login:", err);
    // Enviamos JSON para evitar errores de sintaxis en el frontend
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

app.get('/api/test', (req, res) => {
    res.json({ message: "API funcionando" });
});

// 6. Inicio del Servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});