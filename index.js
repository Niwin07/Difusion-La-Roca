require('dotenv').config();
const { pipeline } = require('stream'); // Agregá esto arriba con los require
const { promisify } = require('util'); // Agregá esto arriba también
const express = require('express');
const mysql = require('mysql2/promise');
const { google } = require('googleapis');
const cron = require('node-cron');
const cors = require('cors');
const path = require('path');
const pipelineAsync = promisify(pipeline);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const FOLDER_ID = process.env.FOLDER_ID;

// === 🚀 CACHE SIMPLE (Evita consultas innecesarias a DB) ===
let cachePredicas = null;
let ultimaActualizacion = null;

// === 🏊‍♂️ POOL OPTIMIZADO ===
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false }, 
    waitForConnections: true,
    connectionLimit: 3, // Reducido para servicios gratuitos
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    idleTimeout: 60000 // Cierra conexiones ociosas
});

// === 🔐 AUTENTICACIÓN GOOGLE (HÍBRIDA) ===
let auth;
try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        console.log("☁️  Modo Nube");
    } else {
        auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, 'credenciales_drive.json'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        console.log("💻 Modo Local");
    }
} catch (error) {
    console.error("❌ Error Auth:", error.message);
}

// === 🧠 CACHE DE ALIAS (Se carga una sola vez) ===
let mapaAlias = [];

async function cargarAlias() {
    if (mapaAlias.length > 0) return mapaAlias;
    
    try {
        const [rows] = await pool.query(
            'SELECT alias_detectado, nombre_oficial FROM predicador_alias ORDER BY LENGTH(alias_detectado) DESC'
        );
        mapaAlias = rows;
        console.log(`📋 Alias cargados: ${rows.length}`);
        return rows;
    } catch (error) {
        console.error("⚠️ Error alias:", error.message);
        return [];
    }
}

// === 🤖 PROCESAMIENTO MEJORADO ===
function procesarNombreConAlias(nombreArchivo, listaAlias) {
    let nombreLimpio = nombreArchivo
        .replace(/\.mp3$/i, '')
        .replace(/_/g, '-')
        .trim();
    
    const nombreLower = nombreLimpio.toLowerCase();
    
    // Regex más robusto para fechas
    const regexFecha = /[-_](\d{1,2})[-_](\d{1,2})[-_](\d{2,4})(?=\s|$|\.)/;
    const match = nombreLimpio.match(regexFecha);
    
    let fechaSQL = new Date().toISOString().split('T')[0];
    let titulo = "Mensaje";
    let textoParaAnalizar = nombreLower;
    
    if (match) {
        let [_, dia, mes, anio] = match;
        if (anio.length === 2) anio = '20' + anio;
        
        // Validación de fecha
        const diaNum = parseInt(dia);
        const mesNum = parseInt(mes);
        if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12) {
            fechaSQL = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            titulo = `Mensaje del ${dia}/${mes}/${anio}`;
            textoParaAnalizar = nombreLower.substring(0, match.index).trim();
        }
    } else {
        // Si no hay fecha, usa el nombre completo como título
        titulo = nombreLimpio.replace(/-/g, ' ');
    }
    
    // Buscar predicador por alias
    let predicadorOficial = "Predicador Invitado";
    
    for (const item of listaAlias) {
        const aliasLower = item.alias_detectado.toLowerCase();
        if (textoParaAnalizar.includes(aliasLower)) {
            predicadorOficial = item.nombre_oficial;
            break;
        }
    }
    
    // Si no se encontró alias, extraer del nombre
    if (predicadorOficial === "Predicador Invitado" && textoParaAnalizar) {
        let extracted = textoParaAnalizar
            .replace(/predica/gi, '')
            .replace(/mensaje/gi, '')
            .replace(/[-]/g, ' ')
            .trim();
        
        if (extracted.length > 2) {
            predicadorOficial = extracted
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }
    }
    
    return { titulo, predicador: predicadorOficial, fecha: fechaSQL };
}

// === 🔄 SINCRONIZACIÓN OPTIMIZADA ===
let sincronizando = false;

async function sincronizarDrive() {
    if (sincronizando) {
        console.log('⏭️  Sync en progreso, saltando...');
        return;
    }
    
    sincronizando = true;
    console.log(`🔄 Sync [${new Date().toLocaleTimeString('es-AR')}]`);
    
    try {
        const listaAlias = await cargarAlias();
        const drive = google.drive({ version: 'v3', auth });
        const driveFolderId = FOLDER_ID || '1mLxXbJ9s6HYYjE6G4ruy6JZGEmCsIxwT';
        
        // Traer archivos de Drive
        const res = await drive.files.list({
            q: `'${driveFolderId}' in parents and trashed = false and mimeType contains 'audio'`,
            fields: 'files(id, name, webViewLink, createdTime)',
            orderBy: 'createdTime desc',
            pageSize: 1000 // Limitar por si hay muchos archivos
        });
        
        const archivos = res.data.files || [];
        let nuevos = 0;
        let actualizados = 0;
        
        for (const archivo of archivos) {
            const nombreLower = archivo.name.toLowerCase();
            
            // Filtro mejorado
            if (!nombreLower.includes('predica') || 
                nombreLower.includes('adoracion') || 
                nombreLower.includes('adoración') ||
                nombreLower.includes('reunion') || 
                nombreLower.includes('reunión') ||
                nombreLower.includes('alabanza') ||
                nombreLower.endsWith('.wav') ||
                nombreLower.endsWith('.m4a')) {
                continue;
            }
            
            const datos = procesarNombreConAlias(archivo.name, listaAlias);
            
            // Buscar si existe
            const [rows] = await pool.query(
                'SELECT id, titulo, predicador FROM predicas WHERE drive_id = ?', 
                [archivo.id]
            );
            
            if (rows.length === 0) {
                // Insertar nuevo
                await pool.query(
                    `INSERT INTO predicas (titulo, predicador, fecha, url_audio, drive_id) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [datos.titulo, datos.predicador, datos.fecha, archivo.webViewLink, archivo.id]
                );
                nuevos++;
            } else {
                // Actualizar solo si cambió algo
                const existente = rows[0];
                if (existente.titulo !== datos.titulo || existente.predicador !== datos.predicador) {
                    await pool.query(
                        `UPDATE predicas 
                         SET titulo = ?, predicador = ?, fecha = ?, url_audio = ? 
                         WHERE drive_id = ?`,
                        [datos.titulo, datos.predicador, datos.fecha, archivo.webViewLink, archivo.id]
                    );
                    actualizados++;
                }
            }
        }
        
        // Invalidar cache
        cachePredicas = null;
        ultimaActualizacion = new Date();
        
        console.log(`✅ Sync OK - Nuevos: ${nuevos}, Actualizados: ${actualizados}`);
        
    } catch (error) {
        console.error('❌ Error Sync:', error.message);
    } finally {
        sincronizando = false;
    }
}

// === ⏲️ CRON MANTIENE SERVICIOS DESPIERTOS ===
cron.schedule('*/30 * * * *', () => {
    sincronizarDrive();
});

// === 💓 HEALTH CHECK ===
app.get('/ping', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: 'ok', 
            timestamp: new Date(),
            ultimaSync: ultimaActualizacion 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// === 🚀 API CON CACHE ===
app.get('/api/predicas', async (req, res) => {
    try {
        // Usar cache si existe (válido por 5 min)
        const ahora = Date.now();
        if (cachePredicas && (ahora - cachePredicas.timestamp < 5 * 60 * 1000)) {
            return res.json(cachePredicas.data);
        }
        
        // Consultar DB
        const [rows] = await pool.query(
            'SELECT id, titulo, predicador, fecha, url_audio FROM predicas ORDER BY fecha DESC'
        );
        
        // Actualizar cache
        cachePredicas = {
            data: rows,
            timestamp: ahora
        };
        
        res.json(rows);
    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// === 🎯 ENDPOINT EXTRA: Forzar sincronización manual ===
app.post('/api/sync', async (req, res) => {
    if (sincronizando) {
        return res.json({ message: 'Sincronización en progreso' });
    }
    
    sincronizarDrive();
    res.json({ message: 'Sincronización iniciada' });
});

// --- 🎧 PROXY DE AUDIO INTELIGENTE (SOPORTA SEEKING/ADELANTAR) ---
app.get('/api/audio/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const range = req.headers.range; // <--- ESTO ES LA CLAVE
        const drive = google.drive({ version: 'v3', auth });

        // 1. Obtener metadatos (tamaño del archivo)
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'size, mimeType'
        });

        const fileSize = parseInt(metadata.data.size);

        // 2. Si el navegador pide un RANGO (adelantar audio)
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            // Headers para decirle al navegador "Acá tenés solo el pedacito que pediste"
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': metadata.data.mimeType || 'audio/mpeg',
            };

            res.writeHead(206, head); // 206 = Partial Content

            // Pedir a Google solo ese rango
            const response = await drive.files.get(
                { 
                    fileId: fileId, 
                    alt: 'media' 
                },
                { 
                    responseType: 'stream',
                    headers: { 'Range': `bytes=${start}-${end}` } 
                }
            );

            response.data.pipe(res);

        } else {
            // 3. Si no pide rango (primera carga), mandamos headers básicos
            const head = {
                'Content-Length': fileSize,
                'Content-Type': metadata.data.mimeType || 'audio/mpeg',
            };
            res.writeHead(200, head);
            
            const response = await drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );
            response.data.pipe(res);
        }

    } catch (error) {
        // Ignoramos error de "Broken pipe" (cuando el usuario cierra el audio antes de terminar)
        if (error.code !== 'EPIPE' && error.code !== 'ECONNRESET') {
            console.error("❌ Error audio stream:", error.message);
        }
        // No mandamos res.status(500) si ya empezamos a enviar datos porque crashea express
        if (!res.headersSent) res.status(500).end();
    }
});

// === 📊 ENDPOINT: Stats ===
app.get('/api/stats', async (req, res) => {
    try {
        const [total] = await pool.query('SELECT COUNT(*) as total FROM predicas');
        const [porPredicador] = await pool.query(
            'SELECT predicador, COUNT(*) as cantidad FROM predicas GROUP BY predicador ORDER BY cantidad DESC'
        );
        const [porAnio] = await pool.query(
            'SELECT YEAR(fecha) as anio, COUNT(*) as cantidad FROM predicas GROUP BY YEAR(fecha) ORDER BY anio DESC'
        );
        
        res.json({
            total: total[0].total,
            porPredicador,
            porAnio,
            ultimaSync: ultimaActualizacion
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 📥 ENDPOINT DE DESCARGA DIRECTA ---
app.get('/api/download/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const customName = req.query.name || 'mensaje-la-roca';
        const drive = google.drive({ version: 'v3', auth });

        // Obtenemos el stream de Google
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        // Forzamos la descarga con el nombre del mensaje
        res.setHeader('Content-Disposition', `attachment; filename="${customName}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        response.data.pipe(res);
    } catch (error) {
        console.error("❌ Error en descarga:", error.message);
        res.status(500).send("No se pudo procesar la descarga");
    }
});

// === 🚀 INICIO ===
app.listen(PORT, () => {
    console.log(`🦅 Ministerio La Roca API - Puerto ${PORT}`);
    cargarAlias(); // Pre-cargar alias
    sincronizarDrive(); // Sync inicial
});