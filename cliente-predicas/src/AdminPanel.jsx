import { useState, useMemo, useCallback } from "react";
import {
  Save,
  X,
  RefreshCw,
  Edit2,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  FileText,
  BellRing,
  Wifi,
  WifiOff,
  Loader,
} from "lucide-react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Playfair+Display:wght@600;700&family=Lato:wght@300;400;700&display=swap');

  .ap-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 10, 20, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: ap-fadeIn 0.25s ease;
  }
  @keyframes ap-fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .ap-panel {
    background: #0d1526;
    width: 100%;
    max-width: 1100px;
    height: 92vh;
    border-radius: 24px;
    border: 1px solid rgba(212, 175, 55, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(212,175,55,0.08), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(212,175,55,0.15);
    animation: ap-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes ap-slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* TOPBAR */
  .ap-topbar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 20px;
    padding: 18px 28px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.12);
    background: rgba(212, 175, 55, 0.04);
    flex-shrink: 0;
  }
  .ap-brand { display: flex; align-items: center; gap: 12px; }
  .ap-brand-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, #d4af37, #b8860b);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; box-shadow: 0 4px 12px rgba(212,175,55,0.3); flex-shrink: 0;
  }
  .ap-brand-text h2 {
    margin: 0; font-family: 'Playfair Display', serif; font-size: 1.1rem;
    color: #d4af37; font-weight: 700; letter-spacing: -0.3px; line-height: 1.2;
  }
  .ap-brand-text span {
    font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
    color: rgba(212,175,55,0.45); text-transform: uppercase; letter-spacing: 1.5px;
  }

  /* STATS PILLS */
  .ap-stats { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .ap-stat {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 5px 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: rgba(226, 232, 240, 0.6);
  }
  .ap-stat svg { color: #d4af37; opacity: 0.7; }
  .ap-stat strong { color: #e2e8f0; font-weight: 600; }

  .ap-header-actions { display: flex; gap: 8px; align-items: center; }

  /* SYNC BUTTON — estados: idle / syncing / success / error */
  .ap-btn-sync {
    display: flex; align-items: center; gap: 8px;
    background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3);
    color: #d4af37; padding: 8px 16px; border-radius: 10px;
    font-size: 0.82rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s ease; font-family: 'Lato', sans-serif; white-space: nowrap;
    position: relative; overflow: hidden;
  }
  .ap-btn-sync:hover:not(:disabled) { background: rgba(212, 175, 55, 0.18); border-color: rgba(212, 175, 55, 0.5); transform: translateY(-1px); }
  .ap-btn-sync:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .ap-btn-sync.syncing { background: rgba(212,175,55,0.06); border-color: rgba(212,175,55,0.2); }
  .ap-btn-sync.sync-ok { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.35); color: #10b981; }
  .ap-btn-sync.sync-err { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }

  /* SYNC PROGRESS BAR */
  .ap-sync-bar-wrap {
    height: 2px; background: rgba(212,175,55,0.08); flex-shrink: 0;
  }
  .ap-sync-bar {
    height: 2px; background: linear-gradient(90deg, #d4af37, #b8860b);
    transition: width 0.4s ease;
  }
  .ap-sync-bar.error { background: #ef4444; }
  .ap-sync-bar.success { background: #10b981; }

  /* SYNC LOG PANEL */
  .ap-sync-log {
    background: rgba(0,0,0,0.5); border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 10px 28px; flex-shrink: 0;
    font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
    max-height: 120px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.2) transparent;
    animation: ap-expandDown 0.25s ease;
  }
  @keyframes ap-expandDown { from { max-height: 0; opacity: 0; } to { max-height: 120px; opacity: 1; } }
  .ap-sync-log::-webkit-scrollbar { width: 4px; }
  .ap-sync-log::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 2px; }
  .ap-log-line { display: flex; align-items: flex-start; gap: 10px; padding: 2px 0; line-height: 1.5; }
  .ap-log-time { color: rgba(212,175,55,0.4); flex-shrink: 0; }
  .ap-log-msg { color: rgba(226,232,240,0.7); }
  .ap-log-msg.ok { color: #10b981; }
  .ap-log-msg.err { color: #ef4444; }
  .ap-log-msg.info { color: #60a5fa; }
  .ap-log-msg.warn { color: #f59e0b; }

  /* SEARCH BAR */
  .ap-search-bar { padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
  .ap-search-wrap { position: relative; max-width: 500px; }
  .ap-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(212,175,55,0.4); pointer-events: none; }
  .ap-search-input {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 10px 14px 10px 42px; color: #e2e8f0; font-size: 0.88rem;
    font-family: 'Lato', sans-serif; outline: none; transition: all 0.2s; box-sizing: border-box;
  }
  .ap-search-input::placeholder { color: rgba(148, 163, 184, 0.4); }
  .ap-search-input:focus { border-color: rgba(212,175,55,0.35); background: rgba(212,175,55,0.04); box-shadow: 0 0 0 3px rgba(212,175,55,0.08); }

  /* TABLE AREA */
  .ap-table-wrap {
    flex: 1; overflow-y: auto; overflow-x: auto; padding: 0 8px 8px;
    scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.2) transparent;
  }
  .ap-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
  .ap-table-wrap::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 3px; }
  .ap-table { width: 100%; border-collapse: separate; border-spacing: 0 3px; min-width: 680px; }

  /* THEAD */
  .ap-table thead tr { position: sticky; top: 0; z-index: 10; }
  .ap-table thead th {
    padding: 12px 16px; text-align: left; font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.8px; color: rgba(212,175,55,0.5);
    background: #0d1526; white-space: nowrap; cursor: pointer; user-select: none;
    transition: color 0.2s; border-bottom: 1px solid rgba(212,175,55,0.1);
  }
  .ap-table thead th:hover { color: rgba(212,175,55,0.85); }
  .ap-table thead th.sorted { color: #d4af37; }
  .ap-th-inner { display: flex; align-items: center; gap: 5px; }

  /* TBODY ROWS */
  .ap-row { transition: all 0.2s ease; }
  .ap-row td {
    padding: 14px 16px; background: rgba(255,255,255,0.025); border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; font-size: 0.88rem;
    vertical-align: middle; transition: background 0.2s;
  }
  .ap-row td:first-child { border-radius: 10px 0 0 10px; border-left: 1px solid rgba(255,255,255,0.04); }
  .ap-row td:last-child { border-radius: 0 10px 10px 0; border-right: 1px solid rgba(255,255,255,0.04); }
  .ap-row:hover td { background: rgba(212,175,55,0.04); border-color: rgba(212,175,55,0.1); }
  .ap-row.editing td { background: rgba(212,175,55,0.07); border-color: rgba(212,175,55,0.2); }
  .ap-row.editing td:first-child { border-left: 2px solid rgba(212,175,55,0.5); }

  .ap-title-cell { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: #e2e8f0; font-weight: 600; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ap-badge { display: inline-flex; align-items: center; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.18); color: #d4af37; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
  .ap-date { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: rgba(148,163,184,0.7); white-space: nowrap; }

  /* INPUTS EN EDICIÓN */
  .ap-input {
    width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(212,175,55,0.35);
    border-radius: 8px; padding: 8px 12px; color: #e2e8f0; font-family: 'Lato', sans-serif;
    font-size: 0.88rem; outline: none; transition: all 0.2s; box-sizing: border-box; min-width: 0;
  }
  .ap-input:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.12); background: rgba(212,175,55,0.05); }
  .ap-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(3) hue-rotate(5deg); cursor: pointer; }

  /* ACTION BUTTONS */
  .ap-actions { display: flex; gap: 6px; align-items: center; }
  .ap-icon-btn { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.18s ease; flex-shrink: 0; }
  .ap-edit-btn { background: rgba(255,255,255,0.05); color: rgba(148,163,184,0.6); border: 1px solid rgba(255,255,255,0.06); }
  .ap-edit-btn:hover { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.3); color: #d4af37; transform: scale(1.05); }
  .ap-save-btn { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; }
  .ap-save-btn:hover:not(:disabled) { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.45); transform: scale(1.05); }
  .ap-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ap-cancel-btn { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.7); }
  .ap-cancel-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); color: #ef4444; }

  /* TOAST */
  .ap-toast {
    position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 12px;
    font-size: 0.85rem; font-weight: 600; font-family: 'Lato', sans-serif;
    animation: ap-toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: 10; white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  @keyframes ap-toastIn { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
  .ap-toast.success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #10b981; }
  .ap-toast.error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.35); color: #ef4444; }

  /* EMPTY */
  .ap-empty { text-align: center; padding: 60px 20px; color: rgba(148,163,184,0.4); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; letter-spacing: 1px; }

  /* FOOTER */
  .ap-footer { padding: 10px 28px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .ap-footer-count { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: rgba(148,163,184,0.35); letter-spacing: 0.5px; }
  .ap-footer-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981; animation: ap-pulse 2s ease-in-out infinite; }
  @keyframes ap-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* REPAIR BUTTON */
  .ap-btn-repair {
    display: flex; align-items: center; gap: 8px;
    background: rgba(201,108,40,0.1); border: 1px solid rgba(201,108,40,0.3);
    color: #c96c28; padding: 8px 16px; border-radius: 10px;
    font-size: 0.82rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s ease; font-family: 'Lato', sans-serif; white-space: nowrap;
  }
  .ap-btn-repair:hover:not(:disabled) { background: rgba(201,108,40,0.18); border-color: rgba(201,108,40,0.5); transform: translateY(-1px); }
  .ap-btn-repair:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .ap-btn-repair.repair-ok { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.35); color: #10b981; }
  .ap-btn-repair.repair-err { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }

  /* NOTIFY BUTTON */
  .ap-btn-notify {
    display: flex; align-items: center; gap: 8px;
    background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);
    color: #60a5fa; padding: 8px 16px; border-radius: 10px;
    font-size: 0.82rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s ease; font-family: 'Lato', sans-serif; white-space: nowrap;
  }
  .ap-btn-notify:hover { background: rgba(59,130,246,0.18); border-color: rgba(59,130,246,0.5); transform: translateY(-1px); }
  .ap-btn-notify:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .ap-btn-close { width: 36px; height: 36px; border-radius: 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.7); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
  .ap-btn-close:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); color: #ef4444; }

  @keyframes ap-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .ap-spinning { animation: ap-spin 1s linear infinite; }

  @media (max-width: 680px) {
    .ap-topbar { grid-template-columns: 1fr auto; padding: 14px 16px; }
    .ap-stats { display: none; }
    .ap-search-bar { padding: 10px 16px; }
    .ap-table thead th, .ap-table td { padding: 10px 12px; }
    .ap-btn-sync span, .ap-btn-notify span, .ap-btn-repair span { display: none; }
    .ap-panel { border-radius: 16px; }
    .ap-sync-log { padding: 8px 16px; }
  }
    .ap-notify-overlay {
  position: fixed; inset: 0; background: rgba(5,10,20,0.85);
  backdrop-filter: blur(8px); z-index: 4000;
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.ap-notify-box {
  background: #0d1526; border: 1px solid rgba(212,175,55,0.25);
  border-radius: 18px; padding: 24px; width: 100%; max-width: 440px;
  max-height: 85vh; overflow-y: auto;
  box-shadow: 0 30px 80px rgba(0,0,0,0.8);
}
.ap-notify-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ap-notify-head h3 { margin: 0; color: #d4af37; font-family: 'Playfair Display', serif; font-size: 1.1rem; }
.ap-notify-label {
  display: flex; justify-content: space-between; align-items: center;
  font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; text-transform: uppercase;
  letter-spacing: 1px; color: rgba(212,175,55,0.5); margin-bottom: 6px;
}
.ap-char-count { color: rgba(148,163,184,0.4); }
.ap-char-count.warn { color: #f59e0b; }
.ap-notify-history {
  margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
}
.ap-notify-history-title {
  display: flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; text-transform: uppercase;
  letter-spacing: 1px; color: rgba(212,175,55,0.5); margin-bottom: 10px;
}
.ap-notify-history-item {
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;
}
.ap-notify-history-top { display: flex; justify-content: space-between; gap: 8px; }
.ap-notify-history-top strong { color: #e2e8f0; font-size: 0.85rem; }
.ap-notify-history-item p { margin: 4px 0; color: rgba(203,213,225,0.7); font-size: 0.8rem; }
.ap-notify-history-stat {
  font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: rgba(148,163,184,0.5);
}
`;

const PREDICADORES = [
  "Profeta Pablo Lay",
  "Profeta Miqueas Lay",
  "Pastora Karina",
  "Pastora Cecilia",
  "Pastora Sofia Lay",
  "Pastora Candela Lay",
];

// ─── ESTADOS DEL SYNC ───
const SYNC_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  SYNCING: "syncing",
  SUCCESS: "success",
  ERROR: "error",
};

export const AdminPanel = ({ predicas, onCerrar, onRecargar, password }) => {
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "fecha", dir: "desc" });

  // ─── SYNC STATE ───
  const [syncState, setSyncState] = useState(SYNC_STATES.IDLE);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLog, setSyncLog] = useState([]);
  const [showLog, setShowLog] = useState(false);

  // ─── NOTIFY STATE ───
  const [notifying, setNotifying] = useState(false);
  const NOTIFY_TITLE_MAX = 65;
  const NOTIFY_BODY_MAX = 150;

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [customNotify, setCustomNotify] = useState({ title: "", body: "", url: "" });
  const [sendingCustom, setSendingCustom] = useState(false);
  const [notifyHistory, setNotifyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── REPAIR STATE ───
  const [repairState, setRepairState] = useState("idle"); // idle | running | ok | error
  const [repairResult, setRepairResult] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const addLog = useCallback((msg, type = "info") => {
    const time = new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setSyncLog((prev) => [...prev.slice(-50), { time, msg, type }]);
  }, []);

  // ─── SYNC REAL con feedback paso a paso ───
  const sincronizarDrive = async () => {
    if (
      syncState === SYNC_STATES.SYNCING ||
      syncState === SYNC_STATES.CONNECTING
    )
      return;

    setSyncState(SYNC_STATES.CONNECTING);
    setSyncProgress(10);
    setShowLog(true);
    setSyncLog([]);

    addLog("Iniciando conexión con el servidor...", "info");

    try {
      const apiUrl = (import.meta.env.DEV ? "http://localhost:3001" : "");

      // 1. Verificar que el servidor esté vivo
      setSyncProgress(20);
      addLog("Verificando salud del servidor...", "info");
      const pingRes = await fetch(`${apiUrl}/api/ping`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!pingRes.ok) throw new Error("El servidor no responde (/api/ping falló)");
      const pingData = await pingRes.json();
      addLog(
        `Servidor OK — última sync: ${pingData.ultimaSync ? new Date(pingData.ultimaSync).toLocaleString("es-AR") : "nunca"}`,
        "ok",
      );

      // 2. Disparar sincronización en Drive
      setSyncState(SYNC_STATES.SYNCING);
      setSyncProgress(40);
      addLog("Conectando con Google Drive...", "info");
      const syncRes = await fetch(`${apiUrl}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30000),
      });
      if (!syncRes.ok)
        throw new Error(`El servidor rechazó el sync (${syncRes.status})`);
      const syncData = await syncRes.json();
      addLog(`Drive: ${syncData.message || "Sincronización iniciada"}`, "ok");

      // 3. Esperar un poco para que el servidor procese los archivos
      setSyncProgress(65);
      addLog("Procesando archivos nuevos...", "info");
      await new Promise((r) => setTimeout(r, 2500));

      // 4. Recargar predicas desde la DB
      setSyncProgress(85);
      addLog("Recargando base de datos...", "info");
      await onRecargar();

      setSyncProgress(100);
      setSyncState(SYNC_STATES.SUCCESS);
      addLog(
        `✓ Sincronización completada — ${predicas.length} mensajes en total`,
        "ok",
      );
      showToast("Drive sincronizado correctamente", "success");

      // Volver a idle después de 4 segundos
      setTimeout(() => {
        setSyncState(SYNC_STATES.IDLE);
        setSyncProgress(0);
      }, 4000);
    } catch (err) {
      setSyncState(SYNC_STATES.ERROR);
      setSyncProgress(100);
      const msg =
        err.name === "TimeoutError"
          ? "Tiempo de espera agotado (el servidor tardó demasiado)"
          : err.message;
      addLog(`✗ Error: ${msg}`, "err");
      showToast("No se pudo sincronizar con Drive", "error");
      setTimeout(() => {
        setSyncState(SYNC_STATES.IDLE);
        setSyncProgress(0);
      }, 5000);
    }
  };

  const probarNotificaciones = async () => {
    setNotifying(true);
    try {
      const apiUrl = (import.meta.env.DEV ? "http://localhost:3001" : "");
      const res = await fetch(`${apiUrl}/api/test-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        showToast("Notificación enviada a todos los suscriptores", "success");
      } else {
        showToast("Error al enviar notificación", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setNotifying(false);
    }
  };

  const repararFechas = async () => {
    setRepairState("running");
    setRepairResult(null);
    addLog("Iniciando reparación de fechas desde Drive...", "info");
    try {
      const apiUrl = (import.meta.env.DEV ? "http://localhost:3001" : "");
      const res = await fetch(`${apiUrl}/api/repair-fechas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setRepairResult(data);
      setRepairState("ok");
      addLog(
        `✓ Fechas reparadas: ${data.reparados} de ${data.total} archivos`,
        "ok",
      );
      showToast(`${data.reparados} fechas corregidas correctamente`, "success");
      await onRecargar();
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

  const empezarEdicion = (predica) => {
    setEditandoId(predica.id);
    const fechaFormat = new Date(predica.fecha).toISOString().split("T")[0];
    setForm({ ...predica, fecha: fechaFormat });
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const apiUrl = (import.meta.env.DEV ? "http://localhost:3001" : "");
      const res = await fetch(`${apiUrl}/api/predicas/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, password }),
      });
      if (res.ok) {
        showToast("Guardado con éxito", "success");
        setEditandoId(null);
        onRecargar();
      } else {
        showToast("Error al guardar (revisá la contraseña)", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setGuardando(false);
    }
  };

  const toggleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  const predicasFiltradas = useMemo(() => {
    let lista = predicas.filter((p) => {
      const q = busqueda.toLowerCase();
      return (
        p.titulo?.toLowerCase().includes(q) ||
        p.predicador?.toLowerCase().includes(q) ||
        p.fecha?.includes(q)
      );
    });
    lista.sort((a, b) => {
      let va = a[sortConfig.key] ?? "",
        vb = b[sortConfig.key] ?? "";
      if (sortConfig.key === "fecha") {
        va = new Date(va);
        vb = new Date(vb);
      } else {
        va = va.toString().toLowerCase();
        vb = vb.toString().toLowerCase();
      }
      if (va < vb) return sortConfig.dir === "asc" ? -1 : 1;
      if (va > vb) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return lista;
  }, [predicas, busqueda, sortConfig]);

  const predicadores = useMemo(
    () => [...new Set(predicas.map((p) => p.predicador))].length,
    [predicas],
  );

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col)
      return <ChevronDown size={10} style={{ opacity: 0.25 }} />;
    return sortConfig.dir === "asc" ? (
      <ChevronUp size={10} style={{ color: "#d4af37" }} />
    ) : (
      <ChevronDown size={10} style={{ color: "#d4af37" }} />
    );
  };

  const cargarHistorial = async () => {
  setLoadingHistory(true);
  try {
    const apiUrl = (import.meta.env.DEV ? "http://localhost:3001" : "");
    const res = await fetch(
      `${apiUrl}/api/notify-history?password=${encodeURIComponent(password)}`,
    );
    const data = await res.json();
    if (res.ok) setNotifyHistory(data);
  } catch {
    // silencioso, no es crítico
  } finally {
    setLoadingHistory(false);
  }
  };

  const abrirModalNotify = () => {
  setShowNotifyModal(true);
  cargarHistorial();
  };

const enviarNotificacionPersonalizada = async () => {
  if (!customNotify.title.trim() || !customNotify.body.trim()) {
    showToast("Completá título y mensaje", "error");
    return;
  }
  setSendingCustom(true);
  try {
    const apiUrl = (import.meta.env.DEV ? "http://localhost:3001" : "");
    const res = await fetch(`${apiUrl}/api/notify-custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...customNotify, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error del servidor");
    showToast(`Enviada a ${data.enviados} dispositivos`, "success");
    setCustomNotify({ title: "", body: "", url: "" });
    cargarHistorial();
  } catch (err) {
    showToast(err.message || "Error al enviar", "error");
  } finally {
    setSendingCustom(false);
  }
};

  // ─── ETIQUETA DEL BOTÓN SYNC según estado ───
  const syncBtnClass = `ap-btn-sync ${syncState === SYNC_STATES.SYNCING || syncState === SYNC_STATES.CONNECTING ? "syncing" : syncState === SYNC_STATES.SUCCESS ? "sync-ok" : syncState === SYNC_STATES.ERROR ? "sync-err" : ""}`;
  const syncBtnLabel = {
    [SYNC_STATES.IDLE]: "Sincronizar Drive",
    [SYNC_STATES.CONNECTING]: "Conectando...",
    [SYNC_STATES.SYNCING]: "Sincronizando...",
    [SYNC_STATES.SUCCESS]: "Sincronizado ✓",
    [SYNC_STATES.ERROR]: "Error en sync",
  }[syncState];
  const syncBtnIcon = {
    [SYNC_STATES.IDLE]: <Wifi size={15} />,
    [SYNC_STATES.CONNECTING]: <Loader size={15} className="ap-spinning" />,
    [SYNC_STATES.SYNCING]: <RefreshCw size={15} className="ap-spinning" />,
    [SYNC_STATES.SUCCESS]: <CheckCircle size={15} />,
    [SYNC_STATES.ERROR]: <WifiOff size={15} />,
  }[syncState];

  return (
    <>
      <style>{styles}</style>
      <div
        className="ap-overlay"
        onClick={(e) => e.target === e.currentTarget && onCerrar()}
      >
        <div className="ap-panel">
          {/* TOPBAR */}
          <div className="ap-topbar">
            <div className="ap-brand">
              <div className="ap-brand-icon">🛠️</div>
              <div className="ap-brand-text">
                <h2>Panel de Control</h2>
                <span>Ministerio La Roca</span>
              </div>
            </div>

            <div className="ap-stats">
              <div className="ap-stat">
                <FileText size={12} />
                <strong>{predicas.length}</strong> mensajes
              </div>
              <div className="ap-stat">
                <Users size={12} />
                <strong>{predicadores}</strong> predicadores
              </div>
              <div className="ap-stat">
                <Clock size={12} />
                {syncState === SYNC_STATES.SUCCESS
                  ? "Sincronizado ahora"
                  : "Actualizado ahora"}
              </div>
            </div>

            <div className="ap-header-actions">
              <button
                onClick={abrirModalNotify}
                className="ap-btn-notify"
              >
                <BellRing size={15} />
                <span>Notificación personalizada</span>
              </button>

              <button
                onClick={repararFechas}
                disabled={repairState === "running"}
                className={`ap-btn-repair ${repairState === "ok" ? "repair-ok" : repairState === "error" ? "repair-err" : ""}`}
                title={
                  repairResult
                    ? `${repairResult.reparados} corregidas de ${repairResult.total}`
                    : "Reparar fechas leyendo los nombres de Drive"
                }
              >
                {repairState === "running" ? (
                  <Loader size={15} className="ap-spinning" />
                ) : repairState === "ok" ? (
                  <CheckCircle size={15} />
                ) : repairState === "error" ? (
                  <AlertCircle size={15} />
                ) : (
                  <Clock size={15} />
                )}
                <span>
                  {repairState === "running"
                    ? "Reparando..."
                    : repairState === "ok"
                      ? `${repairResult?.reparados ?? "✓"} corregidas`
                      : repairState === "error"
                        ? "Error"
                        : "Reparar fechas"}
                </span>
              </button>

              <button
                onClick={sincronizarDrive}
                disabled={
                  syncState === SYNC_STATES.SYNCING ||
                  syncState === SYNC_STATES.CONNECTING
                }
                className={syncBtnClass}
                title="Sincronizar con Google Drive"
              >
                {syncBtnIcon}
                <span>{syncBtnLabel}</span>
              </button>

              <button
                onClick={onCerrar}
                className="ap-btn-close"
                title="Cerrar"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* BARRA DE PROGRESO DEL SYNC */}
          <div className="ap-sync-bar-wrap">
            <div
              className={`ap-sync-bar ${syncState === SYNC_STATES.ERROR ? "error" : syncState === SYNC_STATES.SUCCESS ? "success" : ""}`}
              style={{ width: `${syncProgress}%` }}
            />
          </div>

          {/* LOG DEL SYNC (visible mientras sincroniza o si hay líneas) */}
          {showLog && syncLog.length > 0 && (
            <div className="ap-sync-log">
              {syncLog.map((line, i) => (
                <div key={i} className="ap-log-line">
                  <span className="ap-log-time">{line.time}</span>
                  <span className={`ap-log-msg ${line.type}`}>{line.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* SEARCH */}
          <div className="ap-search-bar">
            <div className="ap-search-wrap">
              <Search size={15} className="ap-search-icon" />
              <input
                type="text"
                className="ap-search-input"
                placeholder="Buscar por título, predicador o fecha..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setEditandoId(null);
                }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th
                    onClick={() => toggleSort("fecha")}
                    className={sortConfig.key === "fecha" ? "sorted" : ""}
                  >
                    <div className="ap-th-inner">
                      Fecha <SortIcon col="fecha" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("titulo")}
                    className={sortConfig.key === "titulo" ? "sorted" : ""}
                  >
                    <div className="ap-th-inner">
                      Título <SortIcon col="titulo" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("predicador")}
                    className={sortConfig.key === "predicador" ? "sorted" : ""}
                  >
                    <div className="ap-th-inner">
                      Predicador <SortIcon col="predicador" />
                    </div>
                  </th>
                  <th style={{ width: "90px", textAlign: "right" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {predicasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="ap-empty">
                        // Sin resultados para "{busqueda}"
                      </div>
                    </td>
                  </tr>
                )}
                {predicasFiltradas.map((predica) => {
                  const isEditing = editandoId === predica.id;
                  const fechaDisplay = (() => {
                    const d = new Date(predica.fecha);
                    return `${d.getUTCDate().toString().padStart(2, "0")}/${(d.getUTCMonth() + 1).toString().padStart(2, "0")}/${d.getUTCFullYear()}`;
                  })();
                  return (
                    <tr
                      key={predica.id}
                      className={`ap-row ${isEditing ? "editing" : ""}`}
                    >
                      {isEditing ? (
                        <>
                          <td style={{ width: "140px" }}>
                            <input
                              type="date"
                              className="ap-input"
                              value={form.fecha}
                              onChange={(e) =>
                                setForm({ ...form, fecha: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="ap-input"
                              value={form.titulo}
                              onChange={(e) =>
                                setForm({ ...form, titulo: e.target.value })
                              }
                              placeholder="Título del mensaje"
                            />
                          </td>
                          <td style={{ width: "200px" }}>
                            <select
                              className="ap-input"
                              value={form.predicador}
                              onChange={(e) =>
                                setForm({ ...form, predicador: e.target.value })
                              }
                              style={{ appearance: "auto" }}
                            >
                              {PREDICADORES.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                              {!PREDICADORES.includes(form.predicador) && (
                                <option value={form.predicador}>
                                  {form.predicador}
                                </option>
                              )}
                            </select>
                          </td>
                          <td>
                            <div
                              className="ap-actions"
                              style={{ justifyContent: "flex-end" }}
                            >
                              <button
                                onClick={guardarCambios}
                                disabled={guardando}
                                className="ap-icon-btn ap-save-btn"
                                title="Guardar"
                              >
                                {guardando ? (
                                  <RefreshCw
                                    size={15}
                                    className="ap-spinning"
                                  />
                                ) : (
                                  <Save size={15} />
                                )}
                              </button>
                              <button
                                onClick={() => setEditandoId(null)}
                                className="ap-icon-btn ap-cancel-btn"
                                title="Cancelar"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className="ap-date">{fechaDisplay}</span>
                          </td>
                          <td>
                            <div
                              className="ap-title-cell"
                              title={predica.titulo}
                            >
                              {predica.titulo}
                            </div>
                          </td>
                          <td>
                            <span
                              className="ap-badge"
                              title={predica.predicador}
                            >
                              {predica.predicador}
                            </span>
                          </td>
                          <td>
                            <div
                              className="ap-actions"
                              style={{ justifyContent: "flex-end" }}
                            >
                              <button
                                onClick={() => empezarEdicion(predica)}
                                className="ap-icon-btn ap-edit-btn"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="ap-footer">
            <span className="ap-footer-count">
              {predicasFiltradas.length} / {predicas.length} registros
              {busqueda && ` — filtrando por "${busqueda}"`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {showLog && syncLog.length > 0 && (
                <button
                  onClick={() => setShowLog((v) => !v)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.65rem",
                    color: "rgba(212,175,55,0.4)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {showLog ? "▲ ocultar log" : "▼ ver log"}
                </button>
              )}
              <div className="ap-footer-dot" title="Conectado" />
            </div>
          </div>

          {/* TOAST */}
          {toast && (
            <div className={`ap-toast ${toast.type}`}>
              {toast.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {toast.msg}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOTIFICACIÓN PERSONALIZADA */}
      {showNotifyModal && (
        <div
          className="ap-notify-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowNotifyModal(false)}
        >
          <div className="ap-notify-box">
            <div className="ap-notify-head">
              <h3>📢 Notificación personalizada</h3>
              <button className="ap-btn-close" onClick={() => setShowNotifyModal(false)}>
                <X size={16} />
              </button>
            </div>

            <label className="ap-notify-label">
              Título
              <span
                className={`ap-char-count ${customNotify.title.length > NOTIFY_TITLE_MAX - 10 ? "warn" : ""}`}
              >
                {customNotify.title.length}/{NOTIFY_TITLE_MAX}
              </span>
            </label>
            <input
              type="text"
              className="ap-input"
              placeholder="Ej: Encuentro especial esta noche"
              value={customNotify.title}
              maxLength={NOTIFY_TITLE_MAX}
              onChange={(e) => setCustomNotify({ ...customNotify, title: e.target.value })}
            />

            <label className="ap-notify-label" style={{ marginTop: 12 }}>
              Mensaje
              <span
                className={`ap-char-count ${customNotify.body.length > NOTIFY_BODY_MAX - 20 ? "warn" : ""}`}
              >
                {customNotify.body.length}/{NOTIFY_BODY_MAX}
              </span>
            </label>
            <textarea
              className="ap-input"
              rows={3}
              placeholder="Mensaje que va a recibir la gente"
              value={customNotify.body}
              maxLength={NOTIFY_BODY_MAX}
              onChange={(e) => setCustomNotify({ ...customNotify, body: e.target.value })}
              style={{ resize: "none" }}
            />

            <input
              type="text"
              className="ap-input"
              placeholder="URL al tocarla (opcional, default: /)"
              value={customNotify.url}
              onChange={(e) => setCustomNotify({ ...customNotify, url: e.target.value })}
              style={{ marginTop: 12 }}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button
                className="ap-cancel-btn ap-icon-btn"
                style={{ width: "auto", padding: "0 14px" }}
                onClick={() => setShowNotifyModal(false)}
              >
                Cancelar
              </button>
              <button
                className="ap-btn-notify"
                onClick={enviarNotificacionPersonalizada}
                disabled={sendingCustom}
              >
                {sendingCustom ? <Loader size={15} className="ap-spinning" /> : <BellRing size={15} />}
                <span>Enviar a todos</span>
              </button>
            </div>

            {/* HISTORIAL */}
            <div className="ap-notify-history">
              <div className="ap-notify-history-title">
                Últimas enviadas {loadingHistory && <Loader size={11} className="ap-spinning" />}
              </div>
              {notifyHistory.length === 0 && !loadingHistory && (
                <div className="ap-empty" style={{ padding: "16px 0" }}>
                  Todavía no enviaste ninguna
                </div>
              )}
              {notifyHistory.map((n) => (
                <div key={n.id} className="ap-notify-history-item">
                  <div className="ap-notify-history-top">
                    <strong>{n.titulo}</strong>
                    <span className="ap-date">
                      {new Date(n.creado_en).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p>{n.cuerpo}</p>
                  <span className="ap-notify-history-stat">
                    📤 {n.enviados} entregadas
                    {n.eliminados > 0 ? ` · 🗑️ ${n.eliminados} bajas` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
