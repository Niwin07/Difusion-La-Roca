const { Router } = require("express");
const driveSyncService = require("../services/driveSyncService");
const syncState = require("../services/syncState");
const { asyncHandler } = require("../middleware/errorHandler");
const { requireAdminPassword } = require("../middleware/auth");
const { adminAuthLimiter } = require("../middleware/rateLimit");

const router = Router();

// Antes: disparaba sincronizarDrive() SIN esperarla y respondía al toque
// ("Sincronización iniciada"). En un entorno serverless (Vercel) eso es un
// bug real, no solo un detalle de estilo: en cuanto la respuesta HTTP sale,
// la función puede congelarse/matarse, y esa sincronización en curso queda
// cortada a la mitad sin ninguna garantía de terminar. Ahora se espera el
// resultado real antes de responder — con el N+1 ya resuelto, sincronizar
// unos cientos de archivos es cuestión de segundos, no de minutos.
router.post(
  "/sync",
  adminAuthLimiter,
  requireAdminPassword,
  asyncHandler(async (req, res) => {
    if (syncState.isSincronizando()) {
      return res.json({ message: "Sincronización en progreso" });
    }

    const resultado = await driveSyncService.sincronizarDrive();
    res.json({
      message: `Sincronización completada — ${resultado.nuevos} nuevas, ${resultado.actualizados} actualizadas`,
      ...resultado,
    });
  }),
);

router.post(
  "/repair-fechas",
  adminAuthLimiter,
  requireAdminPassword,
  asyncHandler(async (req, res) => {
    const resultado = await driveSyncService.repararFechas();
    res.json({ message: "Reparacion completa", ...resultado });
  }),
);

module.exports = router;
