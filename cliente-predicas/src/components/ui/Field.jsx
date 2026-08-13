import { AlertCircle } from "lucide-react";
import styles from "./Field.module.css";

function ErrorText({ id, error }) {
  if (!error) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      <AlertCircle size={13} aria-hidden="true" />
      {error}
    </p>
  );
}

export function TextField({ id, label, error, hint, rightSlot, className = "", ...props }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {rightSlot}
        </label>
      )}
      <input
        id={id}
        className={styles.control}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      />
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      <ErrorText id={errorId} error={error} />
    </div>
  );
}

export function TextareaField({ id, label, error, hint, rightSlot, className = "", ...props }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {rightSlot}
        </label>
      )}
      <textarea id={id} className={styles.control} aria-invalid={!!error} aria-describedby={errorId} {...props} />
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      <ErrorText id={errorId} error={error} />
    </div>
  );
}

export function SelectField({ id, label, error, className = "", children, ...props }) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <select id={id} className={styles.control} aria-invalid={!!error} {...props}>
        {children}
      </select>
      <ErrorText error={error} />
    </div>
  );
}
