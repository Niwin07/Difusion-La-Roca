const { ApiError } = require("../middleware/errorHandler");

// Helpers de validación chicos y reutilizables — antes cada endpoint
// validaba (o no) a mano, de forma distinta. Nada elaborado: esto no
// necesita una librería de schemas para 4 campos de texto.

function requireNonEmptyString(value, field, { max = 255 } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `Falta el campo "${field}"`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ApiError(400, `El campo "${field}" no puede superar los ${max} caracteres`);
  }
  return trimmed;
}

// Fechas del formulario llegan como "YYYY-MM-DD" (input type="date").
function requireIsoDate(value, field = "fecha") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `El campo "${field}" debe tener formato YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, `El campo "${field}" no es una fecha válida`);
  }
  return value;
}

function requirePositiveIntParam(value, field = "id") {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, `El parámetro "${field}" debe ser un entero positivo`);
  }
  return n;
}

module.exports = { requireNonEmptyString, requireIsoDate, requirePositiveIntParam };
