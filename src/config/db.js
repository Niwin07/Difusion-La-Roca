const mysql = require("mysql2/promise");
const env = require("./env");

// Pool único para todo el proceso. connectionLimit bajo a propósito:
// estamos en un plan gratuito de MySQL (Aiven) con pocas conexiones
// concurrentes disponibles.
const pool = mysql.createPool({
  uri: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 60000,
});

module.exports = pool;
