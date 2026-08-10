// Fuente única de verdad para las variables de entorno. Nada en el resto
// del backend debería leer `process.env` directamente — así evitamos que
// un default inseguro (como pasaba antes con ADMIN_PASSWORD) quede
// escondido en medio de un route handler.
require("dotenv").config();

const isVercel = !!process.env.VERCEL;

module.exports = {
  isVercel,
  port: process.env.PORT || 3001,

  databaseUrl: process.env.DATABASE_URL,

  driveFolderId: process.env.FOLDER_ID || "1mLxXbJ9s6HYYjE6G4ruy6JZGEmCsIxwT",
  congresoFolderId: process.env.CONGRESO_FOLDER_ID,
  googleCredentialsJson: process.env.GOOGLE_CREDENTIALS_JSON,

  // Sin valor por defecto a propósito: un admin panel "protegido" por una
  // clave hardcodeada conocida (la que tenía este proyecto antes) no está
  // protegido. Si no está configurada, las rutas de admin se deshabilitan
  // en vez de aceptar esa clave.
  adminPassword: process.env.ADMIN_PASSWORD || null,
  cronSecret: process.env.CRON_SECRET || null,

  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || null,
  vapidEmail: process.env.VAPID_EMAIL || null,

  // CORS: lista separada por comas de orígenes permitidos. Vacío = mismo
  // origen únicamente (el caso normal en Vercel, donde front y API viven
  // en el mismo dominio). Usar "*" solo si de verdad hace falta abrir la
  // API a otros orígenes.
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
