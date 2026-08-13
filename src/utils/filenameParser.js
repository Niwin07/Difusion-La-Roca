// Parseo del nombre de archivo de Drive → { titulo, predicador, fecha, esTaller }.
// Funciones puras (sin I/O) a propósito: es la pieza de lógica de negocio
// más intrincada del proyecto y la más fácil de testear si en algún
// momento se agrega una suite de tests.

const MINUSCULAS_ES = new Set([
  "y", "e", "o", "u", "de", "del", "los", "las", "el", "la", "un", "una",
  "unos", "unas", "a", "al", "en", "con", "por", "para", "sin", "sobre",
  "entre", "como", "que", "lo", "su", "sus", "mi", "mis", "tu", "tus",
  "se", "te", "me", "le", "les", "ni", "si", "ya", "no", "vs",
]);

// Palabras que identifican el inicio del nombre del predicador
const PALABRAS_AUTOR = [
  "profeta", "pastora", "pastor", "apostol", "apóstol", "hermano", "hermana", "dr", "rev",
];

function cap(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Capitalización correcta para títulos en español
function tituloES(str) {
  return str
    .split(" ")
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i !== 0 && MINUSCULAS_ES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function extraerFechaDelNombre(sinExtension) {
  // Busca al final del string un patrón DD[-_]MM[-_]YY(YY) o DD[-_]MM[-_]YY
  // Ejemplos que debe capturar:
  //   -21-02-26       → 21/02/2026
  //   -06-12-2025     → 06/12/2025
  //   -14_03_26       → 14/03/2026
  //   -05_12_25       → 05/12/2025
  //   _21_03_26       → 21/03/2026
  const regex = /[-_](\d{1,2})[-_](\d{1,2})[-_](\d{2,4})$/;
  const m = sinExtension.match(regex);
  if (!m) return { fecha: null, sinFecha: sinExtension };

  let [, dia, mes, anio] = m;
  if (anio.length === 2) anio = "20" + anio;

  const diaN = parseInt(dia),
    mesN = parseInt(mes),
    anioN = parseInt(anio);
  if (diaN < 1 || diaN > 31 || mesN < 1 || mesN > 12 || anioN < 2000 || anioN > 2100) {
    return { fecha: null, sinFecha: sinExtension };
  }

  const fecha = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  // Quitar la fecha del final para quedarnos con el resto del nombre
  const sinFecha = sinExtension.slice(0, sinExtension.length - m[0].length);
  return { fecha, sinFecha };
}

function parsearNombreArchivo(nombreArchivo) {
  const sinExtension = nombreArchivo.replace(/\.(mp3|m4a|wav|ogg|flac)$/i, "").trim();

  if (!sinExtension) {
    return { titulo: "Mensaje", autorTexto: "ministerio la roca", fecha: null, esTaller: false };
  }

  // 1. Extraer la fecha primero, antes de cualquier split
  const { fecha: fechaSQL, sinFecha } = extraerFechaDelNombre(sinExtension);

  // 2. Normalizar: reemplazar underscores por guiones para split uniforme
  const normalizado = sinFecha.replace(/_/g, "-");
  const partes = normalizado
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);

  if (partes.length === 0) {
    return { titulo: "Mensaje", autorTexto: "ministerio la roca", fecha: fechaSQL, esTaller: false };
  }

  const tipo = partes[0].toLowerCase();
  const esTaller = tipo === "taller";
  const resto = partes.slice(1);

  let tituloTaller = "";
  let autorPartes;

  if (esTaller && resto.length > 0) {
    let iAutorInicio = -1;
    for (let i = 0; i < resto.length; i++) {
      const segLower = resto[i].toLowerCase();
      if (PALABRAS_AUTOR.some((p) => segLower === p || segLower.startsWith(p))) {
        iAutorInicio = i;
        break;
      }
    }
    if (iAutorInicio === -1) iAutorInicio = 1;

    const tituloRaw = resto.slice(0, iAutorInicio).join(" ");
    tituloTaller = tituloES(tituloRaw);
    autorPartes = resto.slice(iAutorInicio);
  } else {
    autorPartes = resto;
  }

  const autorTexto = autorPartes
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map(cap)
    .join(" ")
    .toLowerCase();

  const titulo = esTaller ? tituloTaller || "Taller" : "Prédica";
  return { titulo, autorTexto, fecha: fechaSQL, esTaller };
}

// Aplica los alias de predicador (ej. "pablo" → "Profeta Pablo Lay") cargados desde DB.
function procesarNombreConAlias(nombreArchivo, listaAlias) {
  const { titulo, autorTexto, fecha, esTaller } = parsearNombreArchivo(nombreArchivo);

  let predicadorOficial = null;
  for (const item of listaAlias) {
    if (autorTexto.includes(item.alias_detectado.toLowerCase())) {
      predicadorOficial = item.nombre_oficial;
      break;
    }
  }

  if (!predicadorOficial) {
    predicadorOficial = autorTexto.split(" ").filter(Boolean).map(cap).join(" ") || "Ministerio La Roca";
  }

  return { titulo, predicador: predicadorOficial, fecha, esTaller };
}

module.exports = {
  cap,
  tituloES,
  extraerFechaDelNombre,
  parsearNombreArchivo,
  procesarNombreConAlias,
};
