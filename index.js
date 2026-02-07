require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { google } = require('googleapis');
const cron = require('node-cron');
const cors = require('cors');
const path = require('path'); // Agregamos esto para local

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const FOLDER_ID = process.env.FOLDER_ID;

// --- 🏊‍♂️ BASE DE DATOS: POOL DE CONEXIONES (Gestión Automática) ---
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false }, 
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// --- 🔐 AUTENTICACIÓN GOOGLE (HÍBRIDA: NUBE + LOCAL) ---
let auth;
try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        // OPCIÓN A: Estamos en Render (Leemos variable de entorno)
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        console.log("☁️  Modo Nube: Auth cargada desde Variable.");
    } else {
        // OPCIÓN B: Estamos en Local (Leemos archivo)
        const CREDENTIALS_PATH = path.join(__dirname, 'credenciales_drive.json');
        auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        console.log("💻 Modo Local: Auth cargada desde Archivo.");
    }
} catch (error) {
    console.error("❌ Error Fatal en Auth Google:", error.message);
}

// --- 🧠 CEREBRO DE ALIAS ---
async function obtenerMapaDeAlias() {
    try {
        const [rows] = await pool.query('SELECT alias_detectado, nombre_oficial FROM predicador_alias');
        return rows.sort((a, b) => b.alias_detectado.length - a.alias_detectado.length);
    } catch (error) {
        console.error("⚠️ Error cargando alias (Checkear DB):", error.message);
        return [];
    }
}

// --- 🤖 PROCESAMIENTO DE NOMBRES ---
function procesarNombreConAlias(nombreArchivo, listaAlias) {
    let nombreLimpio = nombreArchivo.replace(/\.mp3$/i, '').replace(/_/g, '-');
    const nombreLower = nombreLimpio.toLowerCase();
    const regexFecha = /[-_](\d{1,2}[-_]\d{1,2}[-_]\d{2,4})$/;
    const match = nombreLimpio.match(regexFecha);

    let fechaSQL = new Date();
    let titulo = "Mensaje";
    let textoParaAnalizar = nombreLower;

    if (match) {
        const fechaRaw = match[1].replace(/_/g, '-');
        const partesFecha = fechaRaw.split('-');
        let [dia, mes, anio] = partesFecha;
        if (anio.length === 2) anio = '20' + anio;
        fechaSQL = `${anio}-${mes}-${dia}`;
        titulo = `Mensaje del ${dia}/${mes}/${anio}`;
        textoParaAnalizar = nombreLower.substring(0, match.index);
    } else {
        titulo = nombreLimpio.replace(/-/g, ' ');
    }

    let predicadorOficial = "Predicador Invitado"; 
    let encontrado = false;

    for (const item of listaAlias) {
        if (textoParaAnalizar.includes(item.alias_detectado.toLowerCase())) {
            predicadorOficial = item.nombre_oficial;
            encontrado = true;
            break;
        }
    }

    if (!encontrado) {
        predicadorOficial = textoParaAnalizar.replace('predica', '').replace(/[-]/g, ' ').trim();
        predicadorOficial = predicadorOficial.replace(/\b\w/g, l => l.toUpperCase());
    }

    return { titulo, predicador: predicadorOficial, fecha: fechaSQL };
}

// --- 🔄 SINCRONIZACIÓN ---
async function sincronizarDrive() {
    console.log('🔄 Sincronizando Drive...');
    try {
        const listaAlias = await obtenerMapaDeAlias();
        
        const drive = google.drive({ version: 'v3', auth });
        // Si no hay variable, usa el ID hardcodeado por seguridad
        const driveFolderId = FOLDER_ID || '1mLxXbJ9s6HYYjE6G4ruy6JZGEmCsIxwT';

        const res = await drive.files.list({
            q: `'${driveFolderId}' in parents and trashed = false and mimeType contains 'audio'`,
            fields: 'files(id, name, webViewLink, createdTime)',
        });

        const archivos = res.data.files;
        
        for (const archivo of archivos) {
            const nombreLower = archivo.name.toLowerCase();
            // Filtro Anti-Ruido
            if (!nombreLower.includes('predica') || 
                nombreLower.includes('adoracion') || 
                nombreLower.includes('reunion') || 
                nombreLower.endsWith('.wav')) {
                continue; 
            }

            const datos = procesarNombreConAlias(archivo.name, listaAlias);

            // Verificamos existencia
            const [rows] = await pool.query('SELECT id FROM predicas WHERE drive_id = ?', [archivo.id]);

            if (rows.length === 0) {
                await pool.query(
                    `INSERT INTO predicas (titulo, predicador, fecha, url_audio, drive_id) VALUES (?, ?, ?, ?, ?)`,
                    [datos.titulo, datos.predicador, datos.fecha, archivo.webViewLink, archivo.id]
                );
                console.log(`✅ Nuevo: ${datos.titulo}`);
            } else {
                await pool.query(
                    `UPDATE predicas SET titulo = ?, predicador = ?, fecha = ?, url_audio = ? WHERE drive_id = ?`,
                    [datos.titulo, datos.predicador, datos.fecha, archivo.webViewLink, archivo.id]
                );
            }
        }
    } catch (error) {
        console.error('❌ Error en Sync:', error.message);
    }
}

// --- ⏲️ CRON (Cada 30 min) ---
cron.schedule('*/30 * * * *', () => {
    sincronizarDrive();
});

// --- 💓 HEALTH CHECK (Para que no se duerma) ---
app.get('/ping', async (req, res) => {
    try {
        await pool.query('SELECT 1'); 
        res.send('Pong! DB Alive 🦅');
    } catch (error) {
        res.status(500).send('DB Error');
    }
});

// --- 🚀 API PÚBLICA ---
app.get('/api/predicas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM predicas ORDER BY fecha DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error de servidor');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor La Roca corriendo en puerto ${PORT}`);
    sincronizarDrive(); // Primer sync al arrancar
});