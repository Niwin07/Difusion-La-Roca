import styles from "./Pagination.module.css";

function pageList(current, total) {
  const pages = [];
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || (n >= current - 1 && n <= current + 1)) {
      pages.push(n);
    } else if (n === current - 2 || n === current + 2) {
      pages.push("…");
    }
  }
  return pages.filter((p, i, arr) => p !== "…" || arr[i - 1] !== "…");
}

export function Pagination({ page, totalPages, onChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const first = (page - 1) * itemsPerPage + 1;
  const last = Math.min(page * itemsPerPage, totalItems);

  return (
    <nav className={styles.wrap} aria-label="Paginación">
      <div className={styles.controls}>
        <button
          className={[styles.page, styles.wide].join(" ")}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </button>

        {pageList(page, totalPages).map((n, i) =>
          n === "…" ? (
            <span key={`dots-${i}`} className={styles.dots}>
              …
            </span>
          ) : (
            <button
              key={n}
              className={[styles.page, n === page && styles.active].filter(Boolean).join(" ")}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          ),
        )}

        <button
          className={[styles.page, styles.wide].join(" ")}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
        >
          Siguiente
        </button>
      </div>
      <p className={styles.info}>
        Mostrando {first}–{last} de {totalItems} mensajes
      </p>
    </nav>
  );
}
