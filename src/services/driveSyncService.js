const pool = require("../config/db");
const env = require("../config/env");
const { getDrive } = require("../config/googleDrive");
const { parsearNombreArchivo, procesarNombreConAlias, cap } = require("../utils/filenameParser");
const predicasService = require("./predicasService");
const pushService = require("./pushService");
const syncState = require("./syncState");

let mapaAlias = [];

async function cargarAlias() {
  if (mapaAlias.length > 0) return mapaAlias;

  try {
    const [rows] = await pool.query(
      "SELECT alias_detectado, nombre_oficial FROM predicador_alias ORDER BY LENGTH(alias_detectado) DESC",
    );
    mapaAlias = rows;
    console.log(`📋 Alias cargados: ${rows.length}`);
    return rows;
  } catch (error) {
    console.error("⚠️ Error alias:", error.message);
    return [];
  }
}

function archivoEsPredicaCandidata(nombreArchivo) {
  const nombreLower = nombreArchivo.toLowerCase();
  return !(
    !nombreLower.includes("predica") ||
    nombreLower.includes("adoracion") ||
    nombreLower.includes("adoración") ||
    nombreLower.includes("reunion") ||
    nombreLower.includes("reunión") ||
    nombreLower.includes("alabanza") ||
    nombreLower.endsWith(".wav") ||
    nombreLower.endsWith(".m4a")
  );
}

function normalizarFecha(fecha) {
  if (!fecha) return null;
  return fecha instanceof Date ? fecha.toISOString().split("T")[0] : String(fecha).split("T")[0];
}

async function listarArchivosCarpeta(folderId) {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'audio'`,
    fields: "files(id, name, webViewLink, createdTime)",
    orderBy: "createdTime desc",
    pageSize: 1000,
  });
  return res.data.files || [];
}

// === SINCRONIZACIÓN CON DRIVE ===
// Antes: por cada archivo de Drive se hacía un SELECT para ver si ya
// existía y después un INSERT/UPDATE — con 200 archivos eso son ~200-400
// round trips a la DB, en serie, uno por uno. Ahora: un solo SELECT trae
// todo lo que ya existe (WHERE drive_id IN (...)), la decisión de
// insertar/actualizar se hace en memoria, y la escritura final es un solo
// INSERT multi-fila + las UPDATE que realmente cambiaron, todo dentro de
// una transacción.
async function sincronizarDrive() {
  if (syncState.isSincronizando()) {
    console.log("⏭️  Sync en progreso, saltando...");
    return { nuevos: 0, actualizados: 0, saltado: true };
  }

  syncState.setSincronizando(true);
  console.log(`🔄 Sync [${new Date().toLocaleTimeString("es-AR")}]`);

  try {
    const listaAlias = await cargarAlias();
    const archivos = await listarArchivosCarpeta(env.driveFolderId);

    const hoy = new Date().toISOString().split("T")[0];
    const candidatos = [];

    for (const archivo of archivos) {
      if (!archivoEsPredicaCandidata(archivo.name)) continue;

      const datos = procesarNombreConAlias(archivo.name, listaAlias);
      const fechaFinal =
        datos.fecha || (archivo.createdTime ? archivo.createdTime.split("T")[0] : null) || hoy;

      candidatos.push({ archivo, datos, fechaFinal });
    }

    if (candidatos.length === 0) {
      syncState.setUltimaActualizacion(new Date());
      console.log("✅ Sync OK - Nuevos: 0, Actualizados: 0");
      return { nuevos: 0, actualizados: 0 };
    }

    const driveIds = candidatos.map((c) => c.archivo.id);
    const [existentesRows] = await pool.query(
      `SELECT id, drive_id, titulo, predicador, fecha FROM predicas WHERE drive_id IN (${driveIds
        .map(() => "?")
        .join(",")})`,
      driveIds,
    );
    const existentesPorDriveId = new Map(existentesRows.map((r) => [r.drive_id, r]));

    const aInsertar = [];
    const aActualizar = [];

    for (const { archivo, datos, fechaFinal } of candidatos) {
      const existente = existentesPorDriveId.get(archivo.id);

      if (!existente) {
        aInsertar.push([datos.titulo, datos.predicador, fechaFinal, archivo.webViewLink, archivo.id]);
        continue;
      }

      const fechaExistente = normalizarFecha(existente.fecha);
      const fechaCorregida = datos.fecha || fechaExistente || fechaFinal;
      const fechaEstabaMal = fechaExistente === hoy && datos.fecha && datos.fecha !== hoy;

      const cambioAlgo =
        existente.titulo !== datos.titulo ||
        existente.predicador !== datos.predicador ||
        (datos.fecha && fechaExistente !== datos.fecha) ||
        fechaEstabaMal;

      if (cambioAlgo) {
        aActualizar.push({
          id: existente.id,
          titulo: datos.titulo,
          predicador: datos.predicador,
          fecha: fechaCorregida,
          url_audio: archivo.webViewLink,
        });
      }
    }

    await escribirCambiosEnTransaccion(aInsertar, aActualizar);

    predicasService.invalidarCache();
    syncState.setUltimaActualizacion(new Date());

    const nuevos = aInsertar.length;
    const actualizados = aActualizar.length;
    console.log(`✅ Sync OK - Nuevos: ${nuevos}, Actualizados: ${actualizados}`);

    if (nuevos > 0) {
      // No bloquea la respuesta del sync por un fallo de push — es una
      // notificación best-effort, no el resultado principal de la operación.
      pushService.notificarNuevaPredica(nuevos).catch((err) => {
        console.error("❌ Error notificando nuevas prédicas:", err.message);
      });
    }

    return { nuevos, actualizados };
  } finally {
    syncState.setSincronizando(false);
  }
}

async function escribirCambiosEnTransaccion(aInsertar, aActualizar) {
  if (aInsertar.length === 0 && aActualizar.length === 0) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (aInsertar.length > 0) {
      const placeholders = aInsertar.map(() => "(?, ?, ?, ?, ?)").join(", ");
      await conn.query(
        `INSERT INTO predicas (titulo, predicador, fecha, url_audio, drive_id) VALUES ${placeholders}`,
        aInsertar.flat(),
      );
    }

    for (const fila of aActualizar) {
      await conn.query(
        "UPDATE predicas SET titulo = ?, predicador = ?, fecha = ?, url_audio = ? WHERE id = ?",
        [fila.titulo, fila.predicador, fila.fecha, fila.url_audio, fila.id],
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// === REPARAR FECHAS MAL GUARDADAS ===
// Mismo criterio que la sync: un SELECT trae todo lo que hace falta,
// se decide en memoria, y solo se escriben las filas que realmente cambian.
async function repararFechas() {
  const archivos = await listarArchivosCarpeta(env.driveFolderId);
  const driveIds = archivos.map((a) => a.id);

  let existentesPorDriveId = new Map();
  if (driveIds.length > 0) {
    const [rows] = await pool.query(
      `SELECT id, drive_id, fecha FROM predicas WHERE drive_id IN (${driveIds.map(() => "?").join(",")})`,
      driveIds,
    );
    existentesPorDriveId = new Map(rows.map((r) => [r.drive_id, r]));
  }

  const aActualizar = [];
  let sinFecha = 0;

  for (const archivo of archivos) {
    const parsed = parsearNombreArchivo(archivo.name);
    const fechaReparada =
      parsed.fecha || (archivo.createdTime ? archivo.createdTime.split("T")[0] : null);

    if (!fechaReparada) {
      sinFecha++;
      continue;
    }

    const existente = existentesPorDriveId.get(archivo.id);
    if (!existente) continue;

    const fechaActual = normalizarFecha(existente.fecha);
    if (fechaActual !== fechaReparada) {
      aActualizar.push({ id: existente.id, fecha: fechaReparada });
    }
  }

  if (aActualizar.length > 0) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const fila of aActualizar) {
        await conn.query("UPDATE predicas SET fecha = ? WHERE id = ?", [fila.fecha, fila.id]);
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
    predicasService.invalidarCache();
  }

  return { reparados: aActualizar.length, sinFecha, total: archivos.length };
}

// === CONGRESO: leer subcarpetas (jueves/viernes/sábado) ===
async function listarCongreso() {
  if (!env.congresoFolderId) {
    const err = new Error("CONGRESO_FOLDER_ID no está configurado en el servidor");
    err.statusCode = 503;
    throw err;
  }

  const drive = getDrive();
  const diasRes = await drive.files.list({
    q: `'${env.congresoFolderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
  });

  const dias = diasRes.data.files || [];
  const resultado = {};

  for (const dia of dias) {
    // Ojo: a diferencia de listarArchivosCarpeta() (usada por la sync
    // principal), acá el orden es alfabético por nombre, no por fecha de
    // creación — así se respeta el orden del cronograma ("Predica 1",
    // "Predica 2", ...) tal como estaba antes de este refactor.
    const archivosRes = await drive.files.list({
      q: `'${dia.id}' in parents and trashed = false and mimeType contains 'audio'`,
      fields: "files(id, name, webViewLink)",
      orderBy: "name",
    });
    const archivos = archivosRes.data.files || [];

    const diaKey = dia.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/\s+/g, "_");

    resultado[diaKey] = archivos.map((f) => {
      const parsed = parsearNombreArchivo(f.name);
      const autorCapitalizado =
        parsed.autorTexto.split(" ").filter(Boolean).map(cap).join(" ") || "Ministerio La Roca";

      return {
        id: f.id,
        nombre: parsed.titulo,
        predicador: autorCapitalizado,
        tipo: parsed.esTaller ? "taller" : "predica",
        url: f.webViewLink,
      };
    });
  }

  return resultado;
}

module.exports = { sincronizarDrive, repararFechas, listarCongreso, cargarAlias };
