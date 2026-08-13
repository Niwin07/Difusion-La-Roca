import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";
import styles from "./Modal.module.css";

export function Modal({ title, onClose, maxWidth, children, labelledBy }) {
  const dialogRef = useRef(null);
  const titleId = labelledBy || "modal-title";

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={styles.dialog}
        style={maxWidth ? { "--max-width": maxWidth } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        ref={dialogRef}
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            <IconButton aria-label="Cerrar" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
