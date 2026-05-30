require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

let sectoresConectados = {
    operador: [],
    administrador: [],
    gerencia: []
};

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

app.get('/api/alertas/stream', (req, res) => {
    const rolUsuario = req.query.rol || 'operador'; // Detecta qué sector es

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Validar que el sector exista en nuestro mapa y añadir al cliente
    if (sectoresConectados[rolUsuario]) {
        sectoresConectados[rolUsuario].push(res);
        console.log(`--> Nuevo dispositivo conectado al sector: [${rolUsuario}]`);
    }

    req.on('close', () => {
        if (sectoresConectados[rolUsuario]) {
            sectoresConectados[rolUsuario] = sectoresConectados[rolUsuario].filter(c => c !== res);
            console.log(`--> Dispositivo desconectado del sector: [${rolUsuario}]`);
        }
    });
});

// 🚀 2. Endpoint POST unificado para disparar y escoger el tipo y el sector destino
app.post('/api/alertas/disparar', (req, res) => {
    try {
        const { tipo, mensaje, sectorDestino } = req.body;

        // Validaciones básicas de los estados que definimos en el operador
        if (!tipo || !mensaje || !sectorDestino) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: tipo, mensaje o sectorDestino.' });
        }

        // Estructura del evento a transmitir
        const payloadAlerta = { tipo, mensaje };

        if (sectorDestino === 'todos') {
            // Enviar a absolutamente todos los sectores del hotel
            Object.keys(sectoresConectados).forEach(sector => {
                sectoresConectados[sector].forEach(cliente => {
                    cliente.write(`data: ${JSON.stringify(payloadAlerta)}\n\n`);
                });
            });
            return res.json({ mensaje: 'Notificación global enviada a todos los sectores.' });
        } 
        
        if (sectoresConectados[sectorDestino]) {
            // Enviar únicamente al sector específico seleccionado
            sectoresConectados[sectorDestino].forEach(cliente => {
                cliente.write(`data: ${JSON.stringify(payloadAlerta)}\n\n`);
            });
            return res.json({ mensaje: `Notificación enviada exclusivamente al sector: ${sectorDestino}` });
        }

        return res.status(400).json({ error: 'El sector especificado no es válido.' });

    } catch (err) {
        console.error("Error al disparar alerta global:", err);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/api/registrar', async (req, res) => {
    try {
        const { kwh, kvarh, kw, fecha_id, operador_id, foto_b64 } = req.body;

        // 1. Validar que vengan los datos obligatorios
        if (!kwh || !kvarh || !kw || !fecha_id) {
            return res.status(400).json({ error: 'Todos los campos numéricos y la fecha son obligatorios.' });
        }

        // 2. Consultar cuántos chequeos ya existen hoy para calcular el 'num_chequeo' correlativo (turno 1, 2 o 3)
        const { data: existentes, error: errorConteo } = await supabase
            .from('lecturas_medidor')
            .select('id')
            .eq('fecha_id', fecha_id);

        if (errorConteo) throw errorConteo;
        
        const siguienteChequeo = (existentes ? existentes.length : 0) + 1;

        if (siguienteChequeo > 3) {
            return res.status(400).json({ error: 'Ya se han completado los 3 chequeos máximos para el día de hoy.' });
        }

        // 3. Insertar el nuevo registro en Supabase
        const { data: nuevaLectura, error: errorInsert } = await supabase
            .from('lecturas_medidor')
            .insert([
                {
                    fecha_id: fecha_id,
                    num_chequeo: siguienteChequeo,
                    kwh: parseFloat(kwh),
                    kvarh: parseFloat(kvarh),
                    kw: parseFloat(kw),
                    operador_id: operador_id ? parseInt(operador_id) : null,
                    foto_url: foto_b64 || null // 💾 Almacena los bits en formato texto listo para el Front
                }
            ])
            .select();

        if (errorInsert) {
            console.error("--> Error de Supabase al insertar lectura:", errorInsert.message);
            return res.status(500).json({ error: 'Error al insertar el registro en la base de datos.' });
        }

        return res.json({
            mensaje: '¡Lectura guardada con éxito!',
            registro: nuevaLectura[0]
        });

    } catch (err) {
        console.error("Error en el servidor durante el registro de lectura:", err);
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