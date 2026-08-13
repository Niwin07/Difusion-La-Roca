import { Search, ChevronUp, ChevronDown, Edit2, Save, X, RefreshCw } from "lucide-react";
import { PREDICADORES_OFICIALES } from "../../predicadores";
import styles from "./AdminDashboard.module.css";

function SortIcon({ col, sortConfig }) {
  if (sortConfig.key !== col) return <ChevronDown size={11} style={{ opacity: 0.25 }} />;
  return sortConfig.dir === "asc" ? (
    <ChevronUp size={11} style={{ color: "var(--copper-400)" }} />
  ) : (
    <ChevronDown size={11} style={{ color: "var(--copper-400)" }} />
  );
}

function sortHeaderProps(col, label, sortConfig, toggleSort) {
  return {
    onClick: () => toggleSort(col),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSort(col);
      }
    },
    tabIndex: 0,
    role: "button",
    "aria-label": `Ordenar por ${label}`,
    "aria-sort": sortConfig.key === col ? (sortConfig.dir === "asc" ? "ascending" : "descending") : "none",
    className: sortConfig.key === col ? styles.sorted : "",
  };
}

export function PredicasTable({
  predicas,
  busqueda,
  onBuscar,
  sortConfig,
  toggleSort,
  editandoId,
  form,
  setForm,
  onEditar,
  onGuardar,
  onCancelar,
  guardando,
}) {
  return (
    <>
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} aria-hidden="true" />
        <label htmlFor="admin-search" className="sr-only">
          Buscar por título, predicador o fecha
        </label>
        <input
          id="admin-search"
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por título, predicador o fecha..."
          value={busqueda}
          onChange={(e) => onBuscar(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th {...sortHeaderProps("fecha", "fecha", sortConfig, toggleSort)}>
                <span className={styles.thInner}>
                  Fecha <SortIcon col="fecha" sortConfig={sortConfig} />
                </span>
              </th>
              <th {...sortHeaderProps("titulo", "título", sortConfig, toggleSort)}>
                <span className={styles.thInner}>
                  Título <SortIcon col="titulo" sortConfig={sortConfig} />
                </span>
              </th>
              <th {...sortHeaderProps("predicador", "predicador", sortConfig, toggleSort)}>
                <span className={styles.thInner}>
                  Predicador <SortIcon col="predicador" sortConfig={sortConfig} />
                </span>
              </th>
              <th style={{ width: 90, textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {predicas.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className={styles.emptyRow}>
                    {busqueda ? `// Sin resultados para "${busqueda}"` : "// Todavía no hay mensajes sincronizados"}
                  </div>
                </td>
              </tr>
            )}
            {predicas.map((predica) => {
              const isEditing = editandoId === predica.id;
              const fechaDisplay = (() => {
                const d = new Date(predica.fecha);
                return `${d.getUTCDate().toString().padStart(2, "0")}/${(d.getUTCMonth() + 1).toString().padStart(2, "0")}/${d.getUTCFullYear()}`;
              })();

              return (
                <tr key={predica.id} className={[styles.row, isEditing && styles.editing].filter(Boolean).join(" ")}>
                  {isEditing ? (
                    <>
                      <td style={{ width: 140 }}>
                        <input
                          type="date"
                          className={styles.rowInput}
                          aria-label="Fecha"
                          value={form.fecha}
                          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.rowInput}
                          aria-label="Título"
                          value={form.titulo}
                          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                          placeholder="Título del mensaje"
                        />
                      </td>
                      <td style={{ width: 200 }}>
                        <select
                          className={styles.rowInput}
                          aria-label="Predicador"
                          value={form.predicador}
                          onChange={(e) => setForm({ ...form, predicador: e.target.value })}
                          style={{ appearance: "auto" }}
                        >
                          {PREDICADORES_OFICIALES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                          {!PREDICADORES_OFICIALES.includes(form.predicador) && (
                            <option value={form.predicador}>{form.predicador}</option>
                          )}
                        </select>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={[styles.actionBtn, styles["tone-success"]].join(" ")}
                            onClick={onGuardar}
                            disabled={guardando}
                            aria-label="Guardar cambios"
                            style={{ padding: "0.4rem" }}
                          >
                            {guardando ? <RefreshCw size={14} className="spinning" /> : <Save size={14} />}
                          </button>
                          <button
                            className={[styles.actionBtn, styles["tone-danger"]].join(" ")}
                            onClick={onCancelar}
                            aria-label="Cancelar edición"
                            style={{ padding: "0.4rem" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={styles.dateCell}>{fechaDisplay}</td>
                      <td>
                        <div className={styles.titleCell} title={predica.titulo}>
                          {predica.titulo}
                        </div>
                      </td>
                      <td>
                        <span className={styles.titleCell} style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                          {predica.predicador}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={[styles.actionBtn, styles["tone-accent"]].join(" ")}
                            onClick={() => onEditar(predica)}
                            aria-label={`Editar "${predica.titulo}"`}
                            style={{ padding: "0.4rem" }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
