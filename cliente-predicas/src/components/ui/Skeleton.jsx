import styles from "./States.module.css";

export function Skeleton({ width, height = "1em", radius, className = "", style, ...props }) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
      style={{ width, height, borderRadius: radius, display: "block", ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}
