const { Router } = require("express");
const pushService = require("../services/pushService");
const { asyncHandler } = require("../middleware/errorHandler");
const { requireAdminPassword } = require("../middleware/auth");
const { adminAuthLimiter, subscribeLimiter } = require("../middleware/rateLimit");

const router = Router();

router.post(
  "/subscribe",
  subscribeLimiter,
  asyncHandler(async (req, res) => {
    await pushService.suscribir(req.body);
    res.status(201).json({ message: "Suscrito correctamente" });
  }),
);

router.post(
  "/notify-custom",
  adminAuthLimiter,
  requireAdminPassword,
  asyncHandler(async (req, res) => {
    const { title, body, url } = req.body;
    const resultado = await pushService.enviarNotificacionPersonalizada({ title, body, url });
    res.json({ message: "Notificación enviada", ...resultado });
  }),
);

router.get(
  "/notify-history",
  adminAuthLimiter,
  requireAdminPassword,
  asyncHandler(async (req, res) => {
    const historial = await pushService.obtenerHistorial();
    res.json(historial);
  }),
);

router.post(
  "/test-push",
  adminAuthLimiter,
  requireAdminPassword,
  asyncHandler(async (req, res) => {
    await pushService.notificarRecordatorio();
    res.json({ message: "Notificaciones de prueba enviadas" });
  }),
);

module.exports = router;
