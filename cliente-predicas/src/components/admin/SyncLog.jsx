import { SYNC_STATES } from "../../hooks/useSync";
import styles from "./AdminDashboard.module.css";

export function SyncProgressBar({ syncState, progress }) {
  const tone =
    syncState === SYNC_STATES.ERROR ? styles.error : syncState === SYNC_STATES.SUCCESS ? styles.success : "";
  return (
    <div className={styles.progressWrap}>
      <div className={[styles.progressBar, tone].filter(Boolean).join(" ")} style={{ width: `${progress}%` }} />
    </div>
  );
}

export function SyncLog({ log, visible }) {
  if (!visible || log.length === 0) return null;
  return (
    <div className={styles.syncLog}>
      {log.map((line, i) => (
        <div key={i} className={styles.logLine}>
          <span className={styles.logTime}>{line.time}</span>
          <span className={[styles.logMsg, styles[line.type]].filter(Boolean).join(" ")}>{line.msg}</span>
        </div>
      ))}
    </div>
  );
}
