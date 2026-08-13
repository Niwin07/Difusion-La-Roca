import { useState } from "react";
import { activarNotificaciones as suscribirPush } from "../api/push";
import { useToast } from "../context/ToastContext";

export function usePushPermission() {
  const showToast = useToast();
  const [permiso, setPermiso] = useState(() => ("Notification" in window ? Notification.permission : "denied"));
  const [activando, setActivando] = useState(false);

  const activar = async () => {
    setActivando(true);
    try {
      const resultado = await suscribirPush();
      setPermiso("Notification" in window ? Notification.permission : "denied");

      if (resultado.ok) {
        showToast("¡Listo! Vas a recibir avisos de nuevos mensajes", "success");
      } else if (resultado.reason === "denied") {
        showToast("Permiso de notificaciones denegado", "error");
      } else if (resultado.reason === "unsupported") {
        showToast("Tu navegador no soporta notificaciones push", "error");
      }
    } catch {
      showToast("No se pudo activar las notificaciones", "error");
    } finally {
      setActivando(false);
    }
  };

  return { permiso, activando, activar };
}
