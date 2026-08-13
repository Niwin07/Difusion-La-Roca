import { request } from "./client";

const VAPID_PUBLIC_KEY =
  "BEj0bljV1CUaqUOPLuCFnOzDPS55OF0kEMm0sBuMKv-B2wMPMzFD1jlVxY_XkhcyL6ObNTDFSuy5fgaAEjUZto0";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Pide permiso, se suscribe al push manager del navegador y registra la
// suscripción en el backend. Devuelve { ok: true } o { ok: false, reason }.
export async function activarNotificaciones() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const registration = await navigator.serviceWorker.ready;
  const suscripcion = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await request("/api/subscribe", { method: "POST", body: suscripcion.toJSON() });
  return { ok: true };
}

export const notifyCustom = ({ title, body, url, password }) =>
  request("/api/notify-custom", { method: "POST", body: { title, body, url, password } });

export const getNotifyHistory = (password) =>
  request(`/api/notify-history?password=${encodeURIComponent(password)}`);

export const sendTestPush = (password) =>
  request("/api/test-push", { method: "POST", body: { password } });
