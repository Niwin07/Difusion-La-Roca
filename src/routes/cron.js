const { Router } = require("express");
const driveSyncService = require("../services/driveSyncService");
const pushService = require("../services/pushService");
const { asyncHandler } = require("../middleware/errorHandler");
const { requireCronSecret } = require("../middleware/auth");

const router = Router();

// Endpoints para que un cron externo (Vercel Cron / cron-job.org / GitHub
// Actions) dispare estas tareas en producción, donde no hay un proceso
// vivo que sostenga node-cron (ver src/cron/scheduler.js).
router.get(
  "/cron/recordatorio",
  requireCronSecret,
  asyncHandler(async (req, res) => {
    await pushService.notificarRecordatorio();
    res.json({ ok: true, tarea: "recordatorio" });
  }),
);

router.get(
  "/cron/sync-drive",
  requireCronSecret,
  asyncHandler(async (req, res) => {
    const resultado = await driveSyncService.sincronizarDrive();
    res.json({ ok: true, tarea: "sync-drive", ...resultado });
  }),
);

module.exports = router;
