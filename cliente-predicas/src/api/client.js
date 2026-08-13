// Capa fina sobre fetch. En dev pega directo al backend local; en
// producción usa rutas relativas (mismo origen, sin CORS) — mismo criterio
// que ya usaba el proyecto.
const BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Error del servidor (${res.status})`, res.status);
  }

  return data;
}

export { request, ApiError, BASE_URL };
