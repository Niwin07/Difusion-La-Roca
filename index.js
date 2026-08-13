// Entrypoint fino: arma la app en src/app.js y acá solo decide cómo
// arrancarla según el entorno. cliente-predicas/api/index.js (la función
// serverless de Vercel) hace `require('../../index.js')` y espera
// `module.exports` como el app de Express — no mover/renombrar este
// archivo sin actualizar esa referencia.
const env = require("./src/config/env");
const app = require("./src/app");
const driveSyncService = require("./src/services/driveSyncService");
const { iniciarCronJobs } = require("./src/cron/scheduler");

// Precarga el cache de alias de predicadores — corre siempre, local o
// Vercel (no rechaza nunca, ver driveSyncService.cargarAlias).
driveSyncService.cargarAlias();

// En Vercel no hay proceso vivo entre requests: ni app.listen() tiene
// sentido ahí (cada invocación es su propia función) ni los cron.schedule
// sobrevivirían. En ese entorno, sync y recordatorio los dispara un cron
// externo contra /api/cron/*.
if (!env.isVercel) {
  app.listen(env.port, () => {
    console.log(`🦅 Ministerio La Roca API - Puerto ${env.port}`);
    driveSyncService.sincronizarDrive().catch((err) => {
      console.error("❌ Error en la sync inicial:", err.message);
    });
  });

  iniciarCronJobs();
}

module.exports = app;
