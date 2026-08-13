const webPush = require("web-push");
const env = require("./env");

// Antes: si VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY estaban seteadas pero
// VAPID_EMAIL no, `vapidEmail.includes(...)` explotaba al cargar el
// módulo (fuera de cualquier try/catch de request) y tiraba abajo TODO el
// proceso — en Vercel eso significa que ni siquiera /api/predicas
// respondía. Ahora una configuración parcial solo deshabilita las
// notificaciones push, no el resto del sitio.
const isConfigured = !!(env.vapidPublicKey && env.vapidPrivateKey && env.vapidEmail);

if (isConfigured) {
  const subject = env.vapidEmail.startsWith("mailto:")
    ? env.vapidEmail
    : `mailto:${env.vapidEmail}`;
  webPush.setVapidDetails(subject, env.vapidPublicKey, env.vapidPrivateKey);
  console.log("🔔 Web Push configurado correctamente");
} else {
  console.warn("⚠️ Web Push no configurado (faltan VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_EMAIL)");
}

module.exports = { webPush, isConfigured };
