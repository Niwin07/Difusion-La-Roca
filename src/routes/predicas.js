const { Router } = require("express");
const predicasService = require("../services/predicasService");
const { asyncHandler } = require("../middleware/errorHandler");
const { requireAdminPassword } = require("../middleware/auth");
const { adminAuthLimiter } = require("../middleware/rateLimit");
const { requirePositiveIntParam } = require("../utils/validators");

const router = Router();

router.get(
  "/predicas",
  asyncHandler(async (req, res) => {
    const rows = await predicasService.listarPredicas();
    res.json(rows);
  }),
);

router.put(
  "/predicas/:id",
  adminAuthLimiter,
  requireAdminPassword,
  asyncHandler(async (req, res) => {
    const id = requirePositiveIntParam(req.params.id);
    const { titulo, predicador, fecha } = req.body;

    const actualizada = await predicasService.actualizarPredica(id, { titulo, predicador, fecha });
    if (!actualizada) {
      return res.status(404).json({ error: "Prédica no encontrada" });
    }

    res.json({ message: "Predica actualizada correctamente" });
  }),
);

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const stats = await predicasService.obtenerStats();
    res.json(stats);
  }),
);

module.exports = router;
