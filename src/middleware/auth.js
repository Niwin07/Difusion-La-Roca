const crypto = require("crypto");
const env = require("../config/env");
const { ApiError } = require("./errorHandler");

// Comparación a tiempo constante — evita que una diferencia de timing
// entre intentos filtre información sobre cuántos caracteres acertaste.
// Con contraseñas cortas el riesgo real es bajo, pero es gratis hacerlo bien.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ""));
  const bufB = Buffer.from(String(b ?? ""));
  if (bufA.length !== bufB.length) {
    // Comparación dummy de igual longitud para no filtrar la longitud vía timing.
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Antes cada endpoint repetía:
//   const PASSWORD_SECRET = process.env.ADMIN_PASSWORD || "roca2026";
//   if (password !== PASSWORD_SECRET) return res.status(401)...
// Además de estar duplicado 5 veces, el fallback "roca2026" significaba
// que si alguna vez se desplegaba sin ADMIN_PASSWORD configurada, CUALQUIERA
// que conociera ese valor (público, está en el historial del repo) tenía
// acceso total de administrador. Ahora: sin ADMIN_PASSWORD configurada,
// las rutas de admin se deshabilitan (503) en vez de aceptar un default.
function requireAdminPassword(req, res, next) {
  if (!env.adminPassword) {
    return next(
      new ApiError(503, "Autenticación de administrador no configurada en el servidor"),
    );
  }

  const password = req.body?.password ?? req.query?.password;
  if (!safeEqual(password, env.adminPassword)) {
    return next(new ApiError(401, "Contraseña incorrecta"));
  }

  next();
}

// Mismo patrón para los endpoints que dispara un cron externo (Vercel Cron /
// cron-job.org / GitHub Actions), que antes tenían su propia función
// `tareaAutorizada` casi idéntica a la de arriba.
function requireCronSecret(req, res, next) {
  if (!env.cronSecret) {
    return next(new ApiError(503, "CRON_SECRET no configurado en el servidor"));
  }

  const provided = req.headers.authorization?.replace("Bearer ", "") || req.query.secret;
  if (!safeEqual(provided, env.cronSecret)) {
    return next(new ApiError(401, "No autorizado"));
  }

  next();
}

module.exports = { requireAdminPassword, requireCronSecret, safeEqual };
