require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { google } = require('googleapis');
const cron = require('node-cron');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- ⚙️ CONFIGURACIÓN ---
const PORT = process.env.PORT || 3001;
const FOLDER_ID = process.env.FOLDER_ID; // Se lee de variable de entorno

// --- ☁️ CONFIGURACIÓN DE BASE DE DATOS (AIVEN/CLOUD) ---
// Usamos la URI completa que te dio Aiven
const dbConnectionConfig = {
    uri: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } // OBLIGATORIO para Aiven
};

// --- 🔐 AUTENTICACIÓN GOOGLE (CLOUD) ---
// En la nube no leemos archivos .json, leemos una variable de texto con el contenido
let auth;
try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        // Modo Nube: Lee el JSON desde la variable de entorno
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        console.log("🔐 Autenticación Google cargada desde Variable de Entorno.");
    } else {
        // Fallback: Modo Local (si tenés el archivo credenciales_drive.json)
        const path = require('path');
        const CREDENTIALS_PATH = path.join(__dirname, 'credenciales_drive.json');
        auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        console.log("🔐 Autenticación Google cargada desde Archivo Local.");
    }
} catch (error) {
    console.error("❌ Error iniciando Auth de Google:", error.message);
}

// --- 🧠 LÓGICA DE ALIAS ---
async function obtenerMapaDeAlias(connection) {
    try {
        const [rows] = await connection.execute('SELECT alias_detectado, nombre_oficial FROM predicador_alias');
        return rows.sort((a, b) => b.alias_detectado.length - a.alias_detectado.length);
    } catch (error) {
        console.error("⚠️ Error cargando alias (Posiblemente tabla vacía o inexistente):", error.message);
        return [];
    }
}

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
        predicadorOficial = textoParaAnalizar
            .replace('predica', '')
            .replace(/[-]/g, ' ')
            .trim();
        predicadorOficial = predicadorOficial.replace(/\b\w/g, l => l.toUpperCase());
    }

    return { titulo, predicador: predicadorOficial, fecha: fechaSQL };
}

// --- 🔄 MOTOR DE SINCRONIZACIÓN ---
async function sincronizarDrive() {
    console.log('🔄 Iniciando sincronización...');
    let connection;

    try {
        // Conexión usando la URI de Aiven
        connection = await mysql.createConnection(dbConnectionConfig);
        
        const listaAlias = await obtenerMapaDeAlias(connection);
        console.log(`🧠 Alias cargados: ${listaAlias.length} reglas activas.`);

        const drive = google.drive({ version: 'v3', auth });
        
        // Obtenemos FOLDER_ID de la variable de entorno o fallback hardcodeado si olvidaste ponerla
        const driveFolderId = FOLDER_ID || '1mLxXbJ9s6HYYjE6G4ruy6JZGEmCsIxwT';

        const res = await drive.files.list({
            q: `'${driveFolderId}' in parents and trashed = false and mimeType contains 'audio'`,
            fields: 'files(id, name, webViewLink, createdTime)',
        });

        const archivos = res.data.files;
        console.log(`📂 Drive: ${archivos.length} archivos encontrados.`);

        for (const archivo of archivos) {
            const nombreLower = archivo.name.toLowerCase();

            if (!nombreLower.includes('predica') || 
                nombreLower.includes('adoracion') || 
                nombreLower.includes('reunion') ||
                nombreLower.includes('ministracion') || 
                nombreLower.endsWith('.wav')) {
                continue; 
            }

            const datos = procesarNombreConAlias(archivo.name, listaAlias);

            const [rows] = await connection.execute(
                'SELECT id FROM predicas WHERE drive_id = ?', 
                [archivo.id]
            );

            if (rows.length === 0) {
                await connection.execute(
                    `INSERT INTO predicas (titulo, predicador, fecha, url_audio, drive_id) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [datos.titulo, datos.predicador, datos.fecha, archivo.webViewLink, archivo.id]
                );
                console.log(`✅ [NUEVO] ${datos.predicador} - ${datos.titulo}`);
            } else {
                await connection.execute(
                    `UPDATE predicas 
                     SET titulo = ?, predicador = ?, fecha = ?, url_audio = ?
                     WHERE drive_id = ?`,
                    [datos.titulo, datos.predicador, datos.fecha, archivo.webViewLink, archivo.id]
                );
            }
        }
        console.log('✨ Sincronización finalizada.');

    } catch (error) {
        console.error('❌ Error fatal en sincronización:', error);
    } finally {
        if (connection) await connection.end();
    }
}

// --- ⏲️ CRON JOBS ---
cron.schedule('*/30 * * * *', () => {
    sincronizarDrive();
});

// Ejecutar al iniciar (Importante para Render)
sincronizarDrive();

// --- 🌐 RUTAS API ---
app.get('/api/predicas', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConnectionConfig);
        const [rows] = await connection.execute('SELECT * FROM predicas ORDER BY fecha DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error de servidor');
    } finally {
        if (connection) await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});