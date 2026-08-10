const { Router } = require("express");
const pool = require("../config/db");
const syncState = require("../services/syncState");
const { asyncHandler } = require("../middleware/errorHandler");

const router = Router();

router.get(
  "/ping",
  asyncHandler(async (req, res) => {
    try {
      await pool.query("SELECT 1");
    } catch (error) {
      // Acá sí devolvemos el detalle: /ping es justamente para diagnosticar
      // si la DB responde, así que el mensaje de error es información útil,
      // no una fuga — nunca incluye datos de negocio.
      return res.status(500).json({ status: "error", message: error.message });
    }

    res.json({
      status: "ok",
      timestamp: new Date(),
      ultimaSync: syncState.getUltimaActualizacion(),
    });
  }),
);

module.exports = router;
