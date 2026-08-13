import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import styles from "./States.module.css";

export function ErrorState({ title = "Algo salió mal", description, onRetry }) {
  return (
    <div className={styles.error} role="alert">
      <AlertTriangle size={36} className={styles.icon} aria-hidden="true" />
      <div>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
