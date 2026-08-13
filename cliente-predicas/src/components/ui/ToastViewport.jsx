import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStack } from "../../context/ToastContext";
import styles from "./Toast.module.css";

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastViewport() {
  const { toasts, dismiss } = useToastStack();
  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="region" aria-label="Notificaciones">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div key={toast.id} className={[styles.toast, styles[toast.type]].filter(Boolean).join(" ")} role="status">
            <span className={styles.icon}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <span>{toast.message}</span>
            <button className={styles.dismiss} onClick={() => dismiss(toast.id)} aria-label="Descartar">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
