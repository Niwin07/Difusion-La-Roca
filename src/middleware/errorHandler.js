// Error con status code HTTP explícito. Los services/routes tiran esto
// para casos esperados (401, 400, 404...); todo lo demás que llegue al
// error handler se trata como 500 y no se expone al cliente.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Evita repetir try/catch { res.status(500).json(...) } en cada handler.
// Cualquier rechazo de la promesa cae en el error handler centralizado.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function notFoundHandler(req, res) {
  res.status(404).json({ error: "Recurso no encontrado" });
}

function errorHandler(err, req, res, next) {
  // Si ya empezamos a mandar la respuesta (streams de audio/descarga), no
  // se pueden volver a setear headers — Express recomienda delegar al
  // manejador default, que corta la conexión de forma prolija.
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  // Los 4xx son "esperados" (validación, auth) — el mensaje es seguro para
  // mostrar. Los 500 son fallas inesperadas: no exponemos error.message
  // crudo (puede filtrar detalles de la DB, paths del filesystem, etc.),
  // solo lo logueamos server-side.
  if (statusCode >= 500) {
    console.error("❌ Error interno:", err);
  }

  const message =
    statusCode >= 500 ? "Error interno del servidor" : err.message || "Error en la solicitud";

  res.status(statusCode).json({ error: message });
}

module.exports = { ApiError, asyncHandler, notFoundHandler, errorHandler };
