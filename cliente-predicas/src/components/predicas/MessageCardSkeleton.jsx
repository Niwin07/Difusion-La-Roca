import { Skeleton } from "../ui/Skeleton";
import styles from "./MessageCard.module.css";

export function MessageCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.top}>
        <Skeleton width="70px" height="20px" radius="999px" />
        <Skeleton width="60px" height="12px" />
      </div>
      <div className={styles.body}>
        <Skeleton height="1.4rem" style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height="1.4rem" style={{ marginBottom: 10 }} />
        <Skeleton width="40%" height="12px" />
      </div>
      <div className={styles.actions}>
        <Skeleton width="34px" height="34px" radius="999px" />
        <div className={styles.secondaryActions}>
          <Skeleton width="34px" height="34px" radius="999px" />
          <Skeleton width="34px" height="34px" radius="999px" />
          <Skeleton width="96px" height="34px" radius="999px" />
        </div>
      </div>
    </div>
  );
}
