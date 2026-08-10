const { Router } = require("express");
const driveSyncService = require("../services/driveSyncService");
const { asyncHandler } = require("../middleware/errorHandler");

const router = Router();

router.get(
  "/congreso",
  asyncHandler(async (req, res) => {
    const resultado = await driveSyncService.listarCongreso();
    res.json(resultado);
  }),
);

module.exports = router;
