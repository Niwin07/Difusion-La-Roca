const pool = require("../config/db");
const { webPush, isConfigured } = require("../config/push");
const { ApiError } = require("../middleware/errorHandler");

// Límites seguros: iOS Safari corta el título ~50 y el cuerpo ~120;
// Android/Chrome tolera un poco más pero conviene mantenerlo corto en ambos.
const NOTIFY_TITLE_MAX = 65;
const NOTIFY_BODY_MAX = 150;

const FRASES_RECORDATORIO = [
  "Hay mensajes esperándote en la app",
  "Cuando tengas un momento, hay Palabra para vos",
  "¿Ya escuchaste la ultima predica?",
  "Entrá un ratito y recibi de la palabra de Dios",
  "No te cuelgues, hay palabra para vos",
];

async function suscribir(suscripcion) {
  if (!suscripcion?.endpoint || !suscripcion?.keys?.p256dh || !suscripcion?.keys?.auth) {
    throw new ApiError(400, "Suscripción inválida");
  }

  const [rows] = await pool.query("SELECT id FROM suscripciones_push WHERE endpoint = ?", [
    suscripcion.endpoint,
  ]);

  if (rows.length === 0) {
    await pool.query(
      "INSERT INTO suscripciones_push (endpoint, p256dh, auth) VALUES (?, ?, ?)",
      [suscripcion.endpoint, suscripcion.keys.p256dh, suscripcion.keys.auth],
    );
    console.log("🔔 Nuevo creyente suscrito a notificaciones");
  }
}

// Único lugar que manda un payload a todas las suscripciones y limpia las
// que ya no sirven (410/404 = el usuario desinstaló / bloqueó permisos).
// Antes esta misma lógica estaba copiada 3 veces (notify-custom,
// notificarNuevaPredica, notificarRecordatorio), cada una borrando las
// suscripciones muertas una por una en vez de en batch.
async function enviarATodos(payload) {
  if (!isConfigured) return { enviados: 0, eliminados: 0 };

  const [suscripciones] = await pool.query(
    "SELECT id, endpoint, p256dh, auth FROM suscripciones_push",
  );
  if (suscripciones.length === 0) return { enviados: 0, eliminados: 0 };

  const idsAEliminar = [];
  await Promise.all(
    suscripciones.map(async (sub) => {
      const pushConfig = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
      try {
        await webPush.sendNotification(pushConfig, JSON.stringify(payload));
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          idsAEliminar.push(sub.id);
        }
      }
    }),
  );

  if (idsAEliminar.length > 0) {
    await pool.query(
      `DELETE FROM suscripciones_push WHERE id IN (${idsAEliminar.map(() => "?").join(",")})`,
      idsAEliminar,
    );
  }

  return { enviados: suscripciones.length - idsAEliminar.length, eliminados: idsAEliminar.length };
}

async function notificarNuevaPredica(cantidadNuevas) {
  if (!isConfigured) return { enviados: 0, eliminados: 0 };

  const payload = {
    title: "¡Nuevo mensaje de La Roca! 🦅",
    body:
      cantidadNuevas === 1
        ? "Ya está disponible una nueva prédica. Escuchala ahora."
        : `Ya están disponibles ${cantidadNuevas} nuevos mensajes.`,
    icon: "/logo192.png",
    badge: "/logo192.png",
    url: "/",
  };

  console.log("📢 Enviando push de nueva prédica...");
  const resultado = await enviarATodos(payload);
  console.log(`✅ Notificaciones enviadas: ${resultado.enviados}`);
  return resultado;
}

async function notificarRecordatorio() {
  if (!isConfigured) return { enviados: 0, eliminados: 0 };

  const payload = {
    title: "Ministerio Profético La Roca",
    body: FRASES_RECORDATORIO[Math.floor(Math.random() * FRASES_RECORDATORIO.length)],
    icon: "/logo192.png",
    badge: "/logo192.png",
    url: "/",
  };

  console.log("📢 Enviando recordatorio...");
  const resultado = await enviarATodos(payload);
  console.log(`✅ Recordatorios enviados: ${resultado.enviados}`);
  return resultado;
}

async function enviarNotificacionPersonalizada({ title, body, url }) {
  if (!title?.trim() || !body?.trim()) {
    throw new ApiError(400, "Falta título o mensaje");
  }

  const tituloFinal = title.trim();
  const cuerpoFinal = body.trim();

  if (tituloFinal.length > NOTIFY_TITLE_MAX || cuerpoFinal.length > NOTIFY_BODY_MAX) {
    throw new ApiError(400, "Título o mensaje demasiado largo");
  }
  if (!isConfigured) {
    throw new ApiError(500, "Web Push no configurado en el servidor");
  }

  const urlFinal = url?.trim() || "/";
  const payload = {
    title: tituloFinal,
    body: cuerpoFinal,
    icon: "/logo192.png",
    badge: "/logo192.png",
    url: urlFinal,
  };

  const resultado = await enviarATodos(payload);

  await pool.query(
    `INSERT INTO notificaciones_enviadas (titulo, cuerpo, url, enviados, eliminados)
     VALUES (?, ?, ?, ?, ?)`,
    [tituloFinal, cuerpoFinal, urlFinal, resultado.enviados, resultado.eliminados],
  );

  return resultado;
}

async function obtenerHistorial() {
  const [rows] = await pool.query(
    `SELECT id, titulo, cuerpo, url, enviados, eliminados, creado_en
     FROM notificaciones_enviadas ORDER BY creado_en DESC LIMIT 20`,
  );
  return rows;
}

module.exports = {
  suscribir,
  notificarNuevaPredica,
  notificarRecordatorio,
  enviarNotificacionPersonalizada,
  obtenerHistorial,
};
