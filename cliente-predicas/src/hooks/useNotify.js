import { useState } from "react";
import { notifyCustom, getNotifyHistory } from "../api/push";
import { useToast } from "../context/ToastContext";

export const NOTIFY_TITLE_MAX = 65;
export const NOTIFY_BODY_MAX = 150;

export function useNotify(password) {
  const showToast = useToast();
  const [form, setForm] = useState({ title: "", body: "", url: "" });
  const [enviando, setEnviando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await getNotifyHistory(password);
      setHistorial(data);
    } catch {
      // silencioso — el historial no es crítico para el flujo principal
    } finally {
      setCargandoHistorial(false);
    }
  };

  const enviar = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      showToast("Completá título y mensaje", "error");
      return;
    }
    setEnviando(true);
    try {
      const data = await notifyCustom({ ...form, password });
      showToast(`Enviada a ${data.enviados} dispositivos`, "success");
      setForm({ title: "", body: "", url: "" });
      cargarHistorial();
    } catch (err) {
      showToast(err.message || "Error al enviar", "error");
    } finally {
      setEnviando(false);
    }
  };

  return { form, setForm, enviando, enviar, historial, cargandoHistorial, cargarHistorial };
}
