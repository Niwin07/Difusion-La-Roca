const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// No hace falta anunciar qué framework corre atrás.
app.disable("x-powered-by");

// Antes: app.use(cors()) sin opciones refleja CUALQUIER origen. El
// frontend en producción llama a la API con rutas relativas (mismo
// origen — Vercel sirve front y API desde el mismo dominio), así que en
// los hechos no necesita CORS ahí; lo único que depende de esto es el dev
// server local y algún origen extra que se declare a propósito.
//
// Ojo: no sabemos con certeza el/los dominio(s) de producción reales desde
// acá, así que restringir por default sin esa info podría cortar el sitio
// entero por una CORS mal configurada. Por eso: si se configura
// ALLOWED_ORIGINS, se restringe a esa lista (+ el dev server local); si no
// se configura nada, se mantiene el comportamiento permisivo de antes.
// Recomendación: setear ALLOWED_ORIGINS con el dominio real en producción.
const defaultDevOrigins = env.isVercel
  ? []
  : ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = [...defaultDevOrigins, ...env.allowedOrigins];

app.use(
  cors(
    allowedOrigins.length === 0
      ? undefined
      : {
          origin(origin, callback) {
            // Sin header Origin (curl, apps nativas, llamadas server-to-server
            // como los cron externos) no es un request de navegador — no aplica CORS.
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }
            callback(new Error("Origen no permitido por CORS"));
          },
        },
  ),
);

// 100kb es el default de Express — lo dejamos explícito porque ningún
// payload real de esta API (editar una prédica, una suscripción push, un
// título/cuerpo de notificación) se acerca a ese tamaño; es solo un techo
// razonable contra un body gigante.
app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
