require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

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


app.get('/', (req, res) => {
    res.send('Servidor funcionando');
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});