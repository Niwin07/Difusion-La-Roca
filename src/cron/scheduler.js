const cron = require("node-cron");
const driveSyncService = require("../services/driveSyncService");
const pushService = require("../services/pushService");

// Solo tiene sentido donde hay un proceso Node vivo y sostenido (local o
// Render) — en Vercel serverless no hay nada que mantenga vivo un
// setInterval/cron entre invocaciones, por eso ahí se usan los endpoints
// /api/cron/* disparados por un cron externo (ver src/routes/cron.js).
function iniciarCronJobs() {
  // Recordatorio cada 2 días a las 10:00 (hora Argentina)
  cron.schedule(
    "0 10 */2 * *",
    () => {
      console.log("⏰ Disparando recordatorio automático...");
      pushService.notificarRecordatorio().catch((err) => {
        console.error("❌ Error en el recordatorio programado:", err.message);
      });
    },
    { timezone: "America/Argentina/Buenos_Aires" },
  );

  // Mantiene la base sincronizada con Drive cada 30 minutos
  cron.schedule("*/30 * * * *", () => {
    driveSyncService.sincronizarDrive().catch((err) => {
      console.error("❌ Error en la sync programada:", err.message);
    });
  });
}

module.exports = { iniciarCronJobs };
