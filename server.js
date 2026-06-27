const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración explícita de CORS para desbloquear todos los métodos
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 1. Configuración de la conexión dinámica (Aiven en la nube / XAMPP local)
const connectionString = process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'control_escolar'
};

const db = mysql.createConnection(connectionString);

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        return;
    }
    console.log('⚡ ¡Conectado con éxito a la base de datos MySQL!');
});

// 2. Ruta para el Login
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ error: 'Por favor, llena todos los campos.' });
    }

    const query = 'SELECT id, usuario, rol, nombre_completo FROM usuarios WHERE usuario = ? AND password = ?';
    
    db.query(query, [usuario, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error interno en el servidor.' });
        }

        if (results.length > 0) {
            res.json({
                success: true,
                usuario: results[0].usuario,
                rol: results[0].rol,
                nombre: results[0].nombre_completo
            });
        } else {
            res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
        }
    });
});

// Ruta para registrar un nuevo docente
app.post('/api/docentes', (req, res) => {
    const { usuario, password, nombre_completo } = req.body;

    if (!usuario || !password || !nombre_completo) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const query = 'INSERT INTO usuarios (usuario, password, rol, nombre_completo) VALUES (?, ?, "docente", ?)';
    db.query(query, [usuario, password, nombre_completo], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
            }
            return res.status(500).json({ error: 'Error al registrar en la base de datos.' });
        }
        res.json({ success: true, message: '¡Docente registrado con éxito!' });
    });
});

// Ruta para listar todos los usuarios con rol docente
app.get('/api/docentes', (req, res) => {
    const query = 'SELECT nombre_completo, usuario, rol FROM usuarios WHERE rol = "docente"';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los docentes.' });
        }
        res.json(results);
    });
});

// Ruta para registrar un estudiante (CON BLINDAJE DE TIPOS Y DEPURACIÓN)
app.post('/api/estudiantes', (req, res) => {
    const { nombre, edad, grado, observaciones, registrado_por } = req.body;

    // Validación rigurosa de presencia de datos
    if (!nombre || edad === undefined || edad === null || !grado) {
        return res.status(400).json({ success: false, error: 'Nombre, edad y grado son obligatorios.' });
    }

    // Forzar conversión limpia a número por seguridad
    const edadEntero = parseInt(edad, 10);

    // Ajustamos la query para asegurar compatibilidad si la columna registrado_por no existiera o fallara
    const query = 'INSERT INTO estudiantes (nombre, edad, grado, observaciones, registrado_por) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [nombre, edadEntero, grado, observaciones || '', registrado_por || 'Docente'], (err, result) => {
        if (err) {
            // Muestra el error exacto de SQL en la terminal de VS Code para que sepas qué columna está fallando
            console.error('❌ Error de MySQL al insertar estudiante:', err.message);
            return res.status(500).json({ 
                success: false, 
                error: 'Error al registrar al estudiante en la base de datos.',
                sqlMessage: err.message 
            });
        }
        res.json({ success: true, message: '¡Expediente guardado correctamente!' });
    });
});

// Ruta para listar todos los estudiantes
app.get('/api/estudiantes', (req, res) => {
    // Si tu tabla no tiene 'fecha_registro', puedes cambiarlo a ORDER BY nombre o id
    const query = 'SELECT nombre, edad, grado, observaciones FROM estudiantes ORDER BY nombre ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error de MySQL al listar:', err.message);
            return res.status(500).json({ error: 'Error al obtener los expedientes.' });
        }
        res.json(results);
    });
});

// Ruta de eliminación para docentes
app.post('/api/docentes/eliminar', (req, res) => {
    const { usuario } = req.body; 

    if (usuario === 'admin') {
        return res.status(400).json({ error: 'No se puede eliminar al administrador principal del sistema.' });
    }

    const query = 'DELETE FROM usuarios WHERE usuario = ? AND rol = "docente"';
    db.query(query, [usuario], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al intentar eliminar al docente en la base de datos.' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No se encontró ningún docente con ese usuario.' });
        }

        res.json({ success: true, message: '¡Acceso revocado y docente eliminado con éxito!' });
    });
});

// 3. Levantar el servidor local
const PORT = 8080; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend corriendo en red local: http://192.168.123.43:${PORT}`);
});
