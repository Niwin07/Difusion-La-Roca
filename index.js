require("dotenv").config();
const { pipeline } = require("stream");
const { promisify } = require("util");
const express = require("express");
const mysql = require("mysql2/promise");
const { google } = require("googleapis");
const cron = require("node-cron");
const cors = require("cors");
const path = require("path");
const pipelineAsync = promisify(pipeline);
const webPush = require("web-push");

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
  idleTimeout: 60000, // Cierra conexiones ociosas
});

// === 🔔 CONFIGURACIÓN WEB PUSH ===
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (publicVapidKey && privateVapidKey) {
  webPush.setVapidDetails(
    vapidEmail.includes("mailto:") ? vapidEmail : `mailto:${vapidEmail}`,
    publicVapidKey,
    privateVapidKey,
  );
  console.log("🔔 Web Push configurado correctamente");
} else {
  console.warn("⚠️ Faltan las claves VAPID en el entorno");
}

// === 🔐 AUTENTICACIÓN GOOGLE (HÍBRIDA) ===
let auth;
try {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    console.log("☁️  Modo Nube");
  } else {
    auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "credenciales_drive.json"),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
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
      "SELECT alias_detectado, nombre_oficial FROM predicador_alias ORDER BY LENGTH(alias_detectado) DESC",
    );
    mapaAlias = rows;
    console.log(`📋 Alias cargados: ${rows.length}`);
    return rows;
  } catch (error) {
    console.error("⚠️ Error alias:", error.message);
    return [];
  }
}

const MINUSCULAS_ES = new Set([
  "y",
  "e",
  "o",
  "u",
  "de",
  "del",
  "los",
  "las",
  "el",
  "la",
  "un",
  "una",
  "unos",
  "unas",
  "a",
  "al",
  "en",
  "con",
  "por",
  "para",
  "sin",
  "sobre",
  "entre",
  "como",
  "que",
  "lo",
  "su",
  "sus",
  "mi",
  "mis",
  "tu",
  "tus",
  "se",
  "te",
  "me",
  "le",
  "les",
  "ni",
  "si",
  "ya",
  "no",
  "vs",
]);

// Palabras que identifican el inicio del nombre del predicador
const PALABRAS_AUTOR = [
  "profeta",
  "pastora",
  "pastor",
  "apostol",
  "apóstol",
  "hermano",
  "hermana",
  "dr",
  "rev",
];

// Límites seguros: iOS Safari corta el título ~50 y el cuerpo ~120;
// Android/Chrome tolera un poco más pero conviene mantenerlo corto en ambos.
const NOTIFY_TITLE_MAX = 65;
const NOTIFY_BODY_MAX = 150;

app.post("/api/notify-custom", async (req, res) => {
  const { password, title, body, url } = req.body;
  const PASSWORD_SECRET = process.env.ADMIN_PASSWORD || "roca2026";

  if (password !== PASSWORD_SECRET) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: "Falta título o mensaje" });
  }
  if (title.trim().length > NOTIFY_TITLE_MAX || body.trim().length > NOTIFY_BODY_MAX) {
    return res.status(400).json({ error: "Título o mensaje demasiado largo" });
  }
  if (!publicVapidKey) {
    return res.status(500).json({ error: "Web Push no configurado en el servidor" });
  }

  try {
    const tituloFinal = title.trim();
    const cuerpoFinal = body.trim();
    const urlFinal = url?.trim() || "/";

    const payload = {
      title: tituloFinal,
      body: cuerpoFinal,
      icon: "/logo192.png",
      badge: "/logo192.png",
      url: urlFinal,
    };

    const resultado = await enviarPushATodos(payload);

    await pool.query(
      `INSERT INTO notificaciones_enviadas (titulo, cuerpo, url, enviados, eliminados)
       VALUES (?, ?, ?, ?, ?)`,
      [tituloFinal, cuerpoFinal, urlFinal, resultado.enviados, resultado.eliminados],
    );

    res.json({ message: "Notificación enviada", ...resultado });
  } catch (error) {
    console.error("❌ Error en notificación personalizada:", error.message);
    res.status(500).json({ error: "Error enviando la notificación" });
  }
});

// === 📜 ENDPOINT: HISTORIAL DE NOTIFICACIONES ===
app.get("/api/notify-history", async (req, res) => {
  const { password } = req.query;
  const PASSWORD_SECRET = process.env.ADMIN_PASSWORD || "roca2026";

  if (password !== PASSWORD_SECRET) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, cuerpo, url, enviados, eliminados, creado_en
       FROM notificaciones_enviadas ORDER BY creado_en DESC LIMIT 20`,
    );
    res.json(rows);
  } catch (error) {
    console.error("❌ Error historial:", error.message);
    res.status(500).json({ error: "Error cargando historial" });
  }
});

function esNumero(str) {
  return /^\d{1,4}$/.test(str);
}

function cap(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Capitalización correcta para títulos en español
function tituloES(str) {
  return str
    .split(" ")
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i !== 0 && MINUSCULAS_ES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function extraerFechaDelNombre(sinExtension) {
  // Busca al final del string un patrón DD[-_]MM[-_]YY(YY) o DD[-_]MM[-_]YY
  // Ejemplos que debe capturar:
  //   -21-02-26       → 21/02/2026
  //   -06-12-2025     → 06/12/2025
  //   -14_03_26       → 14/03/2026
  //   -05_12_25       → 05/12/2025
  //   _21_03_26       → 21/03/2026
  const regex = /[-_](\d{1,2})[-_](\d{1,2})[-_](\d{2,4})$/;
  const m = sinExtension.match(regex);
  if (!m) return { fecha: null, sinFecha: sinExtension };

  let [, dia, mes, anio] = m;
  if (anio.length === 2) anio = "20" + anio;

  const diaN = parseInt(dia),
    mesN = parseInt(mes),
    anioN = parseInt(anio);
  if (
    diaN < 1 ||
    diaN > 31 ||
    mesN < 1 ||
    mesN > 12 ||
    anioN < 2000 ||
    anioN > 2100
  ) {
    return { fecha: null, sinFecha: sinExtension };
  }

  const fecha = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  // Quitar la fecha del final para quedarnos con el resto del nombre
  const sinFecha = sinExtension.slice(0, sinExtension.length - m[0].length);
  return { fecha, sinFecha };
}

function parsearNombreArchivo(nombreArchivo) {
  const sinExtension = nombreArchivo
    .replace(/\.(mp3|m4a|wav|ogg|flac)$/i, "")
    .trim();

  if (!sinExtension) {
    return {
      titulo: "Mensaje",
      autorTexto: "ministerio la roca",
      fecha: null,
      esTaller: false,
    };
  }

  // 1. Extraer la fecha primero, antes de cualquier split
  const { fecha: fechaSQL, sinFecha } = extraerFechaDelNombre(sinExtension);

  // 2. Normalizar: reemplazar underscores por guiones para split uniforme
  const normalizado = sinFecha.replace(/_/g, "-");
  const partes = normalizado
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);

  if (partes.length === 0) {
    return {
      titulo: "Mensaje",
      autorTexto: "ministerio la roca",
      fecha: fechaSQL,
      esTaller: false,
    };
  }

  const tipo = partes[0].toLowerCase();
  const esTaller = tipo === "taller";
  const resto = partes.slice(1);

  let tituloTaller = "";
  let autorPartes = [];

  if (esTaller && resto.length > 0) {
    let iAutorInicio = -1;
    for (let i = 0; i < resto.length; i++) {
      const segLower = resto[i].toLowerCase();
      if (
        PALABRAS_AUTOR.some((p) => segLower === p || segLower.startsWith(p))
      ) {
        iAutorInicio = i;
        break;
      }
    }
    if (iAutorInicio === -1) iAutorInicio = 1;

    const tituloRaw = resto.slice(0, iAutorInicio).join(" ");
    tituloTaller = tituloES(tituloRaw);
    autorPartes = resto.slice(iAutorInicio);
  } else {
    autorPartes = resto;
  }

  const autorTexto = autorPartes
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map(cap)
    .join(" ")
    .toLowerCase();

  const titulo = esTaller ? tituloTaller || "Taller" : "Prédica";
  return { titulo, autorTexto, fecha: fechaSQL, esTaller };
}

// === 🤖 PROCESAMIENTO MEJORADO ===
function procesarNombreConAlias(nombreArchivo, listaAlias) {
  const { titulo, autorTexto, fecha } = parsearNombreArchivo(nombreArchivo);

  let predicadorOficial = null;
  for (const item of listaAlias) {
    if (autorTexto.includes(item.alias_detectado.toLowerCase())) {
      predicadorOficial = item.nombre_oficial;
      break;
    }
  }

  if (!predicadorOficial) {
    predicadorOficial =
      autorTexto.split(" ").filter(Boolean).map(cap).join(" ") ||
      "Ministerio La Roca";
  }

  return { titulo, predicador: predicadorOficial, fecha };
}

// === 🔄 SINCRONIZACIÓN OPTIMIZADA ===
let sincronizando = false;

async function sincronizarDrive() {
  if (sincronizando) {
    console.log("⏭️  Sync en progreso, saltando...");
    return;
  }

  sincronizando = true;
  console.log(`🔄 Sync [${new Date().toLocaleTimeString("es-AR")}]`);

  try {
    const listaAlias = await cargarAlias();
    const drive = google.drive({ version: "v3", auth });
    const driveFolderId = FOLDER_ID || "1mLxXbJ9s6HYYjE6G4ruy6JZGEmCsIxwT";

    // Traer archivos de Drive
    const res = await drive.files.list({
      q: `'${driveFolderId}' in parents and trashed = false and mimeType contains 'audio'`,
      fields: "files(id, name, webViewLink, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 1000, // Limitar por si hay muchos archivos
    });

    const archivos = res.data.files || [];
    let nuevos = 0;
    let actualizados = 0;

    for (const archivo of archivos) {
      const nombreLower = archivo.name.toLowerCase();

      // Filtro mejorado
      if (
        !nombreLower.includes("predica") ||
        nombreLower.includes("adoracion") ||
        nombreLower.includes("adoración") ||
        nombreLower.includes("reunion") ||
        nombreLower.includes("reunión") ||
        nombreLower.includes("alabanza") ||
        nombreLower.endsWith(".wav") ||
        nombreLower.endsWith(".m4a")
      ) {
        continue;
      }

      const datos = procesarNombreConAlias(archivo.name, listaAlias);

      // Si el parser no encontró fecha en el nombre, usar createdTime de Drive como fallback
      const fechaFinal =
        datos.fecha ||
        (archivo.createdTime ? archivo.createdTime.split("T")[0] : null) ||
        new Date().toISOString().split("T")[0];

      // Buscar si existe
      const [rows] = await pool.query(
        "SELECT id, titulo, predicador, fecha FROM predicas WHERE drive_id = ?",
        [archivo.id],
      );

      if (rows.length === 0) {
        // Insertar nuevo
        await pool.query(
          `INSERT INTO predicas (titulo, predicador, fecha, url_audio, drive_id) 
                     VALUES (?, ?, ?, ?, ?)`,
          [
            datos.titulo,
            datos.predicador,
            fechaFinal,
            archivo.webViewLink,
            archivo.id,
          ],
        );
        nuevos++;
      } else {
        // Actualizar si cambió título, predicador o se puede corregir la fecha
        const existente = rows[0];
        const fechaExistente = existente.fecha
          ? existente.fecha instanceof Date
            ? existente.fecha.toISOString().split("T")[0]
            : String(existente.fecha).split("T")[0]
          : null;
        const fechaCorregida = datos.fecha || fechaExistente || fechaFinal;
        const hoy = new Date().toISOString().split("T")[0];
        const fechaEstabaMal =
          fechaExistente === hoy && datos.fecha && datos.fecha !== hoy;
        if (
          existente.titulo !== datos.titulo ||
          existente.predicador !== datos.predicador ||
          (datos.fecha && fechaExistente !== datos.fecha) ||
          fechaEstabaMal
        ) {
          await pool.query(
            `UPDATE predicas 
                         SET titulo = ?, predicador = ?, fecha = ?, url_audio = ? 
                         WHERE drive_id = ?`,
            [
              datos.titulo,
              datos.predicador,
              fechaCorregida,
              archivo.webViewLink,
              archivo.id,
            ],
          );
          actualizados++;
        }
      }
    }

    // Invalidar cache
    cachePredicas = null;
    ultimaActualizacion = new Date();

    console.log(
      `✅ Sync OK - Nuevos: ${nuevos}, Actualizados: ${actualizados}`,
    );
    if (nuevos > 0) {
      notificarNuevaPredica(nuevos);
    }
  } catch (error) {
    console.error("❌ Error Sync:", error.message);
  } finally {
    sincronizando = false;
  }
}

// === 🚀 FUNCIÓN: ENVIAR NOTIFICACIÓN MASIVA ===
async function notificarNuevaPredica(cantidadNuevas) {
  if (!publicVapidKey) return; // Si no hay claves, abortamos

  try {
    const [suscripciones] = await pool.query(
      "SELECT * FROM suscripciones_push",
    );
    if (suscripciones.length === 0) return;

    // Armamos el mensaje visual
    const payload = JSON.stringify({
      title: "¡Nuevo mensaje de La Roca! 🦅",
      body:
        cantidadNuevas === 1
          ? "Ya está disponible una nueva prédica. Escuchala ahora."
          : `Ya están disponibles ${cantidadNuevas} nuevos mensajes.`,
      icon: "/logo192.png",
      badge: "/logo192.png",
      url: "/", // A donde los lleva si tocan la notificación
    });

    console.log(`📢 Enviando push a ${suscripciones.length} dispositivos...`);

    // Disparamos a todos al mismo tiempo
    const promesas = suscripciones.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webPush.sendNotification(pushConfig, payload);
      } catch (error) {
        // Si el usuario desinstaló la app o bloqueó los permisos, Chrome nos devuelve 410 o 404
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(
            "🗑️ Eliminando suscripción inactiva (Usuario desinstaló)",
          );
          await pool.query("DELETE FROM suscripciones_push WHERE id = ?", [
            sub.id,
          ]);
        }
      }
    });

    await Promise.all(promesas);
    console.log("✅ Notificaciones enviadas con éxito");
  } catch (error) {
    console.error("❌ Error en el broadcast de push:", error.message);
  }
}

// === 🚀 FUNCIÓN: ENVIAR RECORDATORIO (ANUNCIO AUTOMÁTICO) ===
async function notificarRecordatorio() {
  if (!publicVapidKey) return;

  try {
    const [suscripciones] = await pool.query(
      "SELECT * FROM suscripciones_push",
    );
    if (suscripciones.length === 0) return;

    // Lista de frases para que no sea siempre la misma
    const frases = [
      "Hay mensajes esperándote en la app",
      "Cuando tengas un momento, hay Palabra para vos",
      "¿Ya escuchaste la ultima predica?",
      "Entrá un ratito y recibi de la palabra de Dios",
      "No te cuelgues, hay palabra para vos",
    ];

    // Elegimos una frase al azar
    const fraseRandom = frases[Math.floor(Math.random() * frases.length)];

    const payload = JSON.stringify({
      title: "Ministerio Profético La Roca",
      body: fraseRandom,
      icon: "/logo192.png",
      badge: "/logo192.png",
      url: "/",
    });

    console.log(
      `📢 Enviando recordatorio a ${suscripciones.length} dispositivos...`,
    );

    const promesas = suscripciones.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webPush.sendNotification(pushConfig, payload);
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await pool.query("DELETE FROM suscripciones_push WHERE id = ?", [
            sub.id,
          ]);
        }
      }
    });

    await Promise.all(promesas);
    console.log("✅ Recordatorios enviados con éxito");
  } catch (error) {
    console.error("❌ Error en el recordatorio:", error.message);
  }
}

// === ⏰ CRON PARA RECORDATORIOS (Se ejecuta solo) ===
// '0 10 */2 * *' significa: A las 10:00 AM, cada 2 días.
cron.schedule(
  "0 10 */2 * *",
  () => {
    console.log("⏰ Disparando recordatorio automático...");
    notificarRecordatorio();
  },
  {
    timezone: "America/Argentina/Buenos_Aires", // Usamos tu hora local
  },
);

// === 🧪 ENDPOINT PARA PROBAR NOTIFICACIONES DESDE EL ADMIN ===
app.post("/api/test-push", async (req, res) => {
  const { password } = req.body;
  const PASSWORD_SECRET = process.env.ADMIN_PASSWORD || "roca2026";

  if (password !== PASSWORD_SECRET) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  // Forzamos el envío de un recordatorio para probar
  await notificarRecordatorio();
  res.json({ message: "Notificaciones de prueba enviadas" });
});

// === ⏲️ CRON MANTIENE SERVICIOS DESPIERTOS ===
cron.schedule("*/30 * * * *", () => {
  sincronizarDrive();
});

// === CONGRESO: Leer subcarpeta específica ===
app.get("/api/congreso", async (req, res) => {
  try {
    const drive = google.drive({ version: "v3", auth });

    // ID de tu carpeta "congreso" en Drive — ponelo en .env como CONGRESO_FOLDER_ID
    const congresoFolderId = process.env.CONGRESO_FOLDER_ID;

    // Primero buscamos las subcarpetas (jueves, viernes, sabado)
    const diasRes = await drive.files.list({
      q: `'${congresoFolderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
      fields: "files(id, name)",
    });

    const dias = diasRes.data.files || [];
    const resultado = {};

    for (const dia of dias) {
      const archivosRes = await drive.files.list({
        q: `'${dia.id}' in parents and trashed = false and mimeType contains 'audio'`,
        fields: "files(id, name, webViewLink)",
        orderBy: "name",
      });

      const archivos = archivosRes.data.files || [];
      const diaKey = dia.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes
        .replace(/\s+/g, "_");

      resultado[diaKey] = archivos.map((f) => {
        const parsed = parsearNombreArchivo(f.name);
        const autorCapitalizado =
          parsed.autorTexto.split(" ").filter(Boolean).map(cap).join(" ") ||
          "Ministerio La Roca";

        return {
          id: f.id,
          nombre: parsed.titulo,
          predicador: autorCapitalizado,
          tipo: parsed.esTaller ? "taller" : "predica",
          url: f.webViewLink,
        };
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error("❌ Error congreso:", error.message);
    res.status(500).json({ error: "Error cargando congreso" });
  }
});

// === 💓 HEALTH CHECK ===
app.get("/ping", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      timestamp: new Date(),
      ultimaSync: ultimaActualizacion,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// === 🚀 API CON CACHE ===
app.get("/api/predicas", async (req, res) => {
  try {
    // Usar cache si existe (válido por 5 min)
    const ahora = Date.now();
    if (cachePredicas && ahora - cachePredicas.timestamp < 5 * 60 * 1000) {
      return res.json(cachePredicas.data);
    }

    // Consultar DB
    const [rows] = await pool.query(
      "SELECT id, titulo, predicador, fecha, url_audio FROM predicas ORDER BY fecha DESC",
    );

    // Actualizar cache
    cachePredicas = {
      data: rows,
      timestamp: ahora,
    };

    res.json(rows);
  } catch (error) {
    console.error("❌ API Error:", error.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// === 🎯 ENDPOINT EXTRA: Forzar sincronización manual ===
app.post("/api/sync", async (req, res) => {
  if (sincronizando) {
    return res.json({ message: "Sincronización en progreso" });
  }

  sincronizarDrive();
  res.json({ message: "Sincronización iniciada" });
});

// === 🛠️ ENDPOINT: Reparar fechas mal guardadas ===
app.post("/api/repair-fechas", async (req, res) => {
  const { password } = req.body;
  const PASSWORD_SECRET = process.env.ADMIN_PASSWORD || "roca2026";
  if (password !== PASSWORD_SECRET) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  try {
    const drive = google.drive({ version: "v3", auth });
    const driveFolderId = FOLDER_ID || "1mLxXbJ9s6HYYjE6G4ruy6JZGEmCsIxwT";

    const driveRes = await drive.files.list({
      q: `'${driveFolderId}' in parents and trashed = false and mimeType contains 'audio'`,
      fields: "files(id, name, createdTime)",
      pageSize: 1000,
    });

    const archivos = driveRes.data.files || [];
    let reparados = 0;
    let sinFecha = 0;

    for (const archivo of archivos) {
      const parsed = parsearNombreArchivo(archivo.name);
      const fechaReparada =
        parsed.fecha ||
        (archivo.createdTime ? archivo.createdTime.split("T")[0] : null);

      if (!fechaReparada) {
        sinFecha++;
        continue;
      }

      const [result] = await pool.query(
        "UPDATE predicas SET fecha = ? WHERE drive_id = ? AND fecha != ?",
        [fechaReparada, archivo.id, fechaReparada],
      );
      if (result.affectedRows > 0) reparados++;
    }

    cachePredicas = null;
    res.json({
      message: "Reparacion completa",
      reparados,
      sinFecha,
      total: archivos.length,
    });
  } catch (error) {
    console.error("Error reparando fechas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- 🎧 PROXY DE AUDIO INTELIGENTE (SOPORTA SEEKING/ADELANTAR) ---
app.get("/api/audio/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const drive = google.drive({ version: "v3", auth });

    // 1. Obtener metadata (sin descargar el archivo)
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "size, mimeType",
    });

    // 2. Configurar headers
    res.setHeader("Content-Type", fileMetadata.data.mimeType || "audio/mpeg");
    res.setHeader("Content-Length", fileMetadata.data.size);
    res.setHeader("Accept-Ranges", "bytes");
    // Cachear en el navegador por 1 hora para que no te pidan el mismo audio a cada rato
    res.setHeader("Cache-Control", "public, max-age=3600");

    // 3. Obtener el stream
    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
    );

    // 4. Usar PIPELINE (Maneja mejor la memoria y errores que .pipe)
    // Si el usuario cierra el reproductor, esto mata la descarga de Google automáticamente
    response.data.pipe(res);

    // Manejo de eventos para liberar memoria si se corta
    res.on("close", () => {
      if (!res.writableEnded) {
        response.data.destroy(); // Cortar el chorro de Google si el usuario se fue
      }
    });
  } catch (error) {
    // Ignoramos error si es porque el cliente cortó la conexión
    if (error.code !== "ECONNRESET" && error.code !== "EPIPE") {
      console.error("❌ Error audio:", error.message);
      if (!res.headersSent) res.status(500).send("Error streaming");
    }
  }
});

// === 📊 ENDPOINT: Stats ===
app.get("/api/stats", async (req, res) => {
  try {
    const [total] = await pool.query("SELECT COUNT(*) as total FROM predicas");
    const [porPredicador] = await pool.query(
      "SELECT predicador, COUNT(*) as cantidad FROM predicas GROUP BY predicador ORDER BY cantidad DESC",
    );
    const [porAnio] = await pool.query(
      "SELECT YEAR(fecha) as anio, COUNT(*) as cantidad FROM predicas GROUP BY YEAR(fecha) ORDER BY anio DESC",
    );

    res.json({
      total: total[0].total,
      porPredicador,
      porAnio,
      ultimaSync: ultimaActualizacion,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === 🔔 ENDPOINT: SUSCRIBIR A NOTIFICACIONES ===
app.post("/api/subscribe", async (req, res) => {
  const suscripcion = req.body;

  if (!suscripcion || !suscripcion.endpoint) {
    return res.status(400).json({ error: "Suscripción inválida" });
  }

  try {
    // Verificamos si el celular/PC ya existe para no duplicar
    const [rows] = await pool.query(
      "SELECT id FROM suscripciones_push WHERE endpoint = ?",
      [suscripcion.endpoint],
    );

    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO suscripciones_push (endpoint, p256dh, auth) VALUES (?, ?, ?)",
        [suscripcion.endpoint, suscripcion.keys.p256dh, suscripcion.keys.auth],
      );
      console.log("🔔 Nuevo creyente suscrito a notificaciones");
    }
    res.status(201).json({ message: "Suscrito correctamente" });
  } catch (error) {
    console.error("❌ Error guardando suscripción:", error.message);
    res.status(500).json({ error: "Error interno" });
  }
});

// --- 📥 ENDPOINT DE DESCARGA DIRECTA ---
app.get("/api/download/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const customName = req.query.name || "mensaje-la-roca";
    const drive = google.drive({ version: "v3", auth });

    // Obtenemos el stream de Google
    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
    );

    // Forzamos la descarga con el nombre del mensaje
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${customName}.mp3"`,
    );
    res.setHeader("Content-Type", "audio/mpeg");

    response.data.pipe(res);
  } catch (error) {
    console.error("❌ Error en descarga:", error.message);
    res.status(500).send("No se pudo procesar la descarga");
  }
});

// === 🛠️ RUTA DE ADMIN: EDITAR PREDICA ===
app.put("/api/predicas/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, predicador, fecha, password } = req.body;

  // 🔐 Seguridad simple: Validamos la contraseña acá también
  // Podés poner esta clave en tu .env como ADMIN_PASSWORD
  const PASSWORD_SECRET = process.env.ADMIN_PASSWORD || "roca2026";

  if (password !== PASSWORD_SECRET) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  try {
    await pool.query(
      "UPDATE predicas SET titulo = ?, predicador = ?, fecha = ? WHERE id = ?",
      [titulo, predicador, fecha, id],
    );

    // Invalidar caché para que se vea el cambio al toque
    cachePredicas = null;

    res.json({ message: "Predica actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error actualizando:", error);
    res.status(500).json({ error: "No se pudo actualizar" });
  }
});

async function enviarPushATodos(payload) {
  const [suscripciones] = await pool.query("SELECT * FROM suscripciones_push");
  if (suscripciones.length === 0) return { enviados: 0, eliminados: 0 };

  let eliminados = 0;
  const promesas = suscripciones.map(async (sub) => {
    const pushConfig = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webPush.sendNotification(pushConfig, JSON.stringify(payload));
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await pool.query("DELETE FROM suscripciones_push WHERE id = ?", [sub.id]);
        eliminados++;
      }
    }
  });

  await Promise.all(promesas);
  return { enviados: suscripciones.length - eliminados, eliminados };
}

// === 🚀 INICIO ===
app.listen(PORT, () => {
  console.log(`🦅 Ministerio La Roca API - Puerto ${PORT}`);
  cargarAlias(); // Pre-cargar alias
  sincronizarDrive(); // Sync inicial
});
