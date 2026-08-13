import { Inbox } from "lucide-react";
import styles from "./States.module.css";

export function EmptyState({ icon, title, description, action }) {
  const Icon = icon || Inbox;
  return (
    <div className={styles.empty}>
      <Icon size={36} className={styles.icon} aria-hidden="true" />
      <div>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
