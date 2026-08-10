const { Router } = require("express");
const { getDrive } = require("../config/googleDrive");
const { ApiError } = require("../middleware/errorHandler");

const router = Router();

// IDs de Google Drive: alfanuméricos + "-"/"_", en la práctica entre ~10 y
// ~100 caracteres. No filtra qué archivo específico se puede pedir (ver
// nota en el informe final sobre reforzar esto contra la tabla `predicas`
// si hace falta), pero sí descarta de entrada cualquier cosa que no tenga
// forma de ID real antes de gastar una llamada a la API de Drive.
const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,100}$/;

function validarDriveId(id) {
  if (!DRIVE_ID_RE.test(id)) {
    throw new ApiError(400, "Identificador de archivo inválido");
  }
  return id;
}

// --- PROXY DE AUDIO INTELIGENTE (SOPORTA SEEKING/ADELANTAR) ---
router.get("/audio/:id", async (req, res, next) => {
  try {
    const fileId = validarDriveId(req.params.id);
    const drive = getDrive();

    // 1. Obtener metadata (sin descargar el archivo)
    const fileMetadata = await drive.files.get({ fileId, fields: "size, mimeType" });

    // 2. Configurar headers
    res.setHeader("Content-Type", fileMetadata.data.mimeType || "audio/mpeg");
    res.setHeader("Content-Length", fileMetadata.data.size);
    res.setHeader("Accept-Ranges", "bytes");
    // Cachear en el navegador por 1 hora para que no te pidan el mismo audio a cada rato
    res.setHeader("Cache-Control", "public, max-age=3600");

    // 3. Obtener el stream
    const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });

    // 4. Pipe directo — si el cliente corta la conexión, cortamos la descarga de Google
    response.data.pipe(res);

    res.on("close", () => {
      if (!res.writableEnded) {
        response.data.destroy();
      }
    });
  } catch (error) {
    // Ignoramos error si es porque el cliente cortó la conexión
    if (error.code === "ECONNRESET" || error.code === "EPIPE") return;
    next(error);
  }
});

// --- DESCARGA DIRECTA ---
router.get("/download/:id", async (req, res, next) => {
  try {
    const fileId = validarDriveId(req.params.id);
    const customName = req.query.name || "mensaje-la-roca";
    const drive = getDrive();

    const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });

    res.setHeader("Content-Disposition", `attachment; filename="${customName}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");

    response.data.pipe(res);
  } catch (error) {
    if (error.code === "ECONNRESET" || error.code === "EPIPE") return;
    next(error);
  }
});

module.exports = router;
