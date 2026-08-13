import { request } from "./client";

// Se usa tanto para el login (¿la contraseña es válida?) como para el
// historial de notificaciones — es el único endpoint GET con contraseña,
// así que sirve para verificar credenciales sin efectos secundarios reales.
export const verificarPassword = (password) =>
  request(`/api/notify-history?password=${encodeURIComponent(password)}`);

export const ping = (signal) => request("/api/ping", { signal });

export const sincronizarDrive = (password, signal) =>
  request("/api/sync", { method: "POST", body: { password }, signal });

export const repararFechas = (password, signal) =>
  request("/api/repair-fechas", { method: "POST", body: { password }, signal });
