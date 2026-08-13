import { useCallback, useState } from "react";
import { ping, sincronizarDrive, repararFechas } from "../api/admin";
import { useToast } from "../context/ToastContext";

export const SYNC_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  SYNCING: "syncing",
  SUCCESS: "success",
  ERROR: "error",
};

export function useSync(password, onDatosActualizados) {
  const showToast = useToast();
  const [syncState, setSyncState] = useState(SYNC_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [repairState, setRepairState] = useState("idle");
  const [repairResult, setRepairResult] = useState(null);

  const addLog = useCallback((msg, type = "info") => {
    const time = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog((prev) => [...prev.slice(-50), { time, msg, type }]);
  }, []);

  const sincronizar = async () => {
    if (syncState === SYNC_STATES.SYNCING || syncState === SYNC_STATES.CONNECTING) return;

    setSyncState(SYNC_STATES.CONNECTING);
    setProgress(10);
    setShowLog(true);
    setLog([]);
    addLog("Iniciando conexión con el servidor...", "info");

    try {
      setProgress(20);
      addLog("Verificando salud del servidor...", "info");
      const pingData = await ping(AbortSignal.timeout(8000));
      addLog(
        `Servidor OK — última sync: ${pingData.ultimaSync ? new Date(pingData.ultimaSync).toLocaleString("es-AR") : "nunca"}`,
        "ok",
      );

      setSyncState(SYNC_STATES.SYNCING);
      setProgress(40);
      addLog("Conectando con Google Drive...", "info");
      const syncData = await sincronizarDrive(password, AbortSignal.timeout(30000));
      addLog(`Drive: ${syncData.message || "Sincronización completada"}`, "ok");

      setProgress(65);
      addLog("Procesando archivos nuevos...", "info");
      await new Promise((r) => setTimeout(r, 1200));

      setProgress(85);
      addLog("Recargando base de datos...", "info");
      await onDatosActualizados();

      setProgress(100);
      setSyncState(SYNC_STATES.SUCCESS);
      addLog("✓ Sincronización completada", "ok");
      showToast("Drive sincronizado correctamente", "success");

      setTimeout(() => {
        setSyncState(SYNC_STATES.IDLE);
        setProgress(0);
      }, 4000);
    } catch (err) {
      setSyncState(SYNC_STATES.ERROR);
      setProgress(100);
      const msg = err.name === "TimeoutError" ? "Tiempo de espera agotado (el servidor tardó demasiado)" : err.message;
      addLog(`✗ Error: ${msg}`, "err");
      showToast("No se pudo sincronizar con Drive", "error");
      setTimeout(() => {
        setSyncState(SYNC_STATES.IDLE);
        setProgress(0);
      }, 5000);
    }
  };

  const reparar = async () => {
    setRepairState("running");
    setRepairResult(null);
    setShowLog(true);
    addLog("Iniciando reparación de fechas desde Drive...", "info");
    try {
      const data = await repararFechas(password, AbortSignal.timeout(60000));
      setRepairResult(data);
      setRepairState("ok");
      addLog(`✓ Fechas reparadas: ${data.reparados} de ${data.total} archivos`, "ok");
      showToast(`${data.reparados} fechas corregidas correctamente`, "success");
      await onDatosActualizados();
      setTimeout(() => {
        setRepairState("idle");
        setRepairResult(null);
      }, 5000);
    } catch (err) {
      setRepairState("error");
      addLog(`✗ Error al reparar: ${err.message}`, "err");
      showToast("No se pudieron reparar las fechas", "error");
      setTimeout(() => setRepairState("idle"), 4000);
    }
  };

  return {
    syncState,
    progress,
    log,
    showLog,
    setShowLog,
    sincronizar,
    repairState,
    repairResult,
    reparar,
  };
}
