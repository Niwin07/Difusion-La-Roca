import styles from "./MessageGrid.module.css";

export function MessageGrid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}
