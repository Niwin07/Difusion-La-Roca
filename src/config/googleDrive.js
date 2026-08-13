const { google } = require("googleapis");
const path = require("path");
const env = require("./env");

// Autenticación híbrida: en producción (Vercel) las credenciales vienen
// como JSON en una env var; en local se usa el archivo de servicio
// descargado (credenciales_drive.json, gitignored).
let auth = null;
let authError = null;

try {
  if (env.googleCredentialsJson) {
    const credentials = JSON.parse(env.googleCredentialsJson);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    console.log("☁️  Google Drive: modo nube (credenciales por env var)");
  } else {
    auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "..", "..", "credenciales_drive.json"),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    console.log("💻 Google Drive: modo local (credenciales_drive.json)");
  }
} catch (error) {
  authError = error;
  console.error("❌ Error inicializando autenticación de Google Drive:", error.message);
}

// Devuelve un cliente de Drive listo para usar. Centralizado acá en vez de
// hacer `google.drive({ version: "v3", auth })` suelto en cada handler.
function getDrive() {
  if (!auth) {
    const err = new Error("Google Drive no está configurado en el servidor");
    err.statusCode = 503;
    err.cause = authError;
    throw err;
  }
  return google.drive({ version: "v3", auth });
}

module.exports = { getDrive };
