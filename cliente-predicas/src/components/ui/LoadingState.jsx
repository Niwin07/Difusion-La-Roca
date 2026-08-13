import { Loader2 } from "lucide-react";
import styles from "./States.module.css";

export function LoadingState({ label = "Cargando..." }) {
  return (
    <div className={styles.loading} role="status">
      <Loader2 size={32} className="spinning" aria-hidden="true" />
      <p className={styles.title}>{label}</p>
    </div>
  );
}
