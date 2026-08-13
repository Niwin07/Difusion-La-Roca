import styles from "./Badge.module.css";

export function Badge({ tone = "neutral", className = "", children, ...props }) {
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}
