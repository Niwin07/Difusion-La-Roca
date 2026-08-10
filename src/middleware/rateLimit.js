const rateLimit = require("express-rate-limit");

// Nada de Redis ni infraestructura extra: el store en memoria que trae por
// default alcanza para esto (una sola instancia de servidor en Render/local;
// en Vercel serverless funciona por-instancia-tibia, que igual frena ráfagas
// rápidas del mismo caller aunque no sea 100% preciso entre cold starts).

// Endpoints que aceptan la contraseña de admin: sin esto, cualquiera podía
// probar contraseñas sin límite (fuerza bruta contra un secreto compartido).
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
});

// Suscripción a push: pública, sin contraseña — solo para frenar abuso/spam
// de registros masivos, no es una defensa contra fuerza bruta.
const subscribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Esperá un momento." },
});

module.exports = { adminAuthLimiter, subscribeLimiter };
