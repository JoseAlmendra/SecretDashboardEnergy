require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');
const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.json({
        mensaje: 'NodeJs RUN'
    });
});

app.get('/api/mes', async (req, res) => {
    try {
        // Consultamos todas las columnas de la tabla 'lecturas_medidor'
        // y las ordenamos por 'fecha_id' ascendentemente (del día 1 al 26, etc.)
        const { data: lecturas, error } = await supabase
            .from('lecturas_medidor')
            .select('*')
            .order('fecha_id', { ascending: true })
            .order('num_chequeo', { ascending: true }); // Sub-ordenado por turno (1, 2, 3)

        if (error) {
            console.error("--> Error de Supabase al traer lecturas:", error.message);
            return res.status(500).json({ error: 'Error al consultar las lecturas en la base de datos.' });
        }

        // Si no hay datos, devolvemos un arreglo vacío de forma segura
        return res.json(lecturas || []);

    } catch (err) {
        console.error("Error en el servidor durante la obtención de lecturas:", err);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
});

app.post('/login', async (req, res) => {
    console.log("=== ¡PROBANDO EL NUEVO ssCÓDIGO CON ILIKE! ===");
    const { username, password } = req.body; 

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    try {
        
        const usuarioLimpio = username.trim();

        // 1. Buscamos por correo
        const { data: usuarios, error } = await supabase
            .from('usuarios') 
            .select('id, correo, password, nombre, rol')
            .eq('nombre', usuarioLimpio); 

        if (error) {
            console.log("--> Error de Supabase:", error.message);
            return res.status(500).json({ error: 'Error al consultar la base de datos.' });
        }

        if (!usuarios || usuarios.length === 0) {
            console.log(`--> El usuario con credencial [${usuarioLimpio}] no fue encontrado.`);
            // CAMBIO AQUÍ: Mensaje genérico y seguro
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        const usuario = usuarios[0];

        // 4. Verificación de contraseña (texto plano)
        if (usuario.password !== password) {
            console.log(`--> Contraseña incorrecta para el usuario: ${usuarioLimpio}`);
            // CAMBIO AQUÍ: Mismo mensaje para ambos casos
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }


        if (usuario.password !== password) {
            console.log(`--> Contraseña incorrecta para el usuario: ${usuarioLimpio}`);
            return res.status(401).json({ error: 'La contraseña es incorrecta.' });
        }

        console.log(`--> ¡Login exitoso para!: ${usuario.correo} (Rol: ${usuario.rol})`);

        return res.json({
            mensaje: '¡Acceso concedido!',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol 
            }
        });

    } catch (err) {
        console.error("Error en el servidor durante el login:", err);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend en puerto ${PORT}`);
});