import { Wrench, FileText, Users, Clock, BellRing, Wifi, WifiOff, CheckCircle2, AlertCircle, Loader2, LogOut } from "lucide-react";
import { SYNC_STATES } from "../../hooks/useSync";
import styles from "./AdminDashboard.module.css";

const SYNC_LABEL = {
  [SYNC_STATES.IDLE]: "Sincronizar Drive",
  [SYNC_STATES.CONNECTING]: "Conectando...",
  [SYNC_STATES.SYNCING]: "Sincronizando...",
  [SYNC_STATES.SUCCESS]: "Sincronizado ✓",
  [SYNC_STATES.ERROR]: "Error en sync",
};

const SYNC_ICON = {
  [SYNC_STATES.IDLE]: Wifi,
  [SYNC_STATES.CONNECTING]: Loader2,
  [SYNC_STATES.SYNCING]: Loader2,
  [SYNC_STATES.SUCCESS]: CheckCircle2,
  [SYNC_STATES.ERROR]: WifiOff,
};

const SYNC_TONE = {
  [SYNC_STATES.IDLE]: "tone-accent",
  [SYNC_STATES.CONNECTING]: "tone-accent",
  [SYNC_STATES.SYNCING]: "tone-accent",
  [SYNC_STATES.SUCCESS]: "tone-success",
  [SYNC_STATES.ERROR]: "tone-danger",
};

export function AdminTopbar({
  totalMensajes,
  totalPredicadores,
  syncState,
  onSync,
  repairState,
  repairResult,
  onRepair,
  onOpenNotify,
  onLogout,
}) {
  const SyncIcon = SYNC_ICON[syncState];
  const syncBusy = syncState === SYNC_STATES.SYNCING || syncState === SYNC_STATES.CONNECTING;

  return (
    <div className={styles.topbar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Wrench size={18} />
        </div>
        <div className={styles.brandText}>
          <div className={styles.brandName}>Panel de Control</div>
          <div className={styles.brandSub}>Ministerio La Roca</div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <FileText size={12} />
          <strong>{totalMensajes}</strong>&nbsp;mensajes
        </div>
        <div className={styles.stat}>
          <Users size={12} />
          <strong>{totalPredicadores}</strong>&nbsp;predicadores
        </div>
      </div>

      <div className={styles.actions}>
        <button className={[styles.actionBtn, styles["tone-info"]].join(" ")} onClick={onOpenNotify}>
          <BellRing size={15} />
          <span>Notificación</span>
        </button>

        <button
          className={[
            styles.actionBtn,
            styles[repairState === "ok" ? "tone-success" : repairState === "error" ? "tone-danger" : "tone-warning"],
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={onRepair}
          disabled={repairState === "running"}
          title={repairResult ? `${repairResult.reparados} corregidas de ${repairResult.total}` : "Reparar fechas leyendo los nombres de Drive"}
        >
          {repairState === "running" ? (
            <Loader2 size={15} className="spinning" />
          ) : repairState === "ok" ? (
            <CheckCircle2 size={15} />
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
          className={[styles.actionBtn, styles[SYNC_TONE[syncState]]].join(" ")}
          onClick={onSync}
          disabled={syncBusy}
        >
          <SyncIcon size={15} className={syncBusy ? "spinning" : ""} />
          <span>{SYNC_LABEL[syncState]}</span>
        </button>

        <button className={styles.logout} onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
