require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

app.use(express.json());

// DB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

pool.connect((err) => {
    if (err) {
        return console.error('Fallo de conexión:', err.stack);
    }
    console.log('Conexión con Supabase exitosa.');
});

console.log("DATABASE_URL =", process.env.DATABASE_URL);

// frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// login
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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});