import { Loader2 } from "lucide-react";
import styles from "./Button.module.css";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  className = "",
  disabled,
  children,
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant],
    size === "sm" && styles.sm,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={16} className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
