const pool = require("../config/db");
const { requireNonEmptyString, requireIsoDate } = require("../utils/validators");
const syncState = require("./syncState");

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachePredicas = null; // { data, timestamp }

function invalidarCache() {
  cachePredicas = null;
}

async function listarPredicas() {
  const ahora = Date.now();
  if (cachePredicas && ahora - cachePredicas.timestamp < CACHE_TTL_MS) {
    return cachePredicas.data;
  }

  const [rows] = await pool.query(
    "SELECT id, titulo, predicador, fecha, url_audio FROM predicas ORDER BY fecha DESC",
  );

  cachePredicas = { data: rows, timestamp: ahora };
  return rows;
}

async function actualizarPredica(id, { titulo, predicador, fecha }) {
  const tituloValido = requireNonEmptyString(titulo, "titulo", { max: 300 });
  const predicadorValido = requireNonEmptyString(predicador, "predicador", { max: 200 });
  const fechaValida = requireIsoDate(fecha, "fecha");

  const [result] = await pool.query(
    "UPDATE predicas SET titulo = ?, predicador = ?, fecha = ? WHERE id = ?",
    [tituloValido, predicadorValido, fechaValida, id],
  );

  invalidarCache();
  return result.affectedRows > 0;
}

async function obtenerStats() {
  const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM predicas");
  const [porPredicador] = await pool.query(
    "SELECT predicador, COUNT(*) as cantidad FROM predicas GROUP BY predicador ORDER BY cantidad DESC",
  );
  const [porAnio] = await pool.query(
    "SELECT YEAR(fecha) as anio, COUNT(*) as cantidad FROM predicas GROUP BY YEAR(fecha) ORDER BY anio DESC",
  );

  return {
    total,
    porPredicador,
    porAnio,
    ultimaSync: syncState.getUltimaActualizacion(),
  };
}

module.exports = { listarPredicas, actualizarPredica, obtenerStats, invalidarCache };
