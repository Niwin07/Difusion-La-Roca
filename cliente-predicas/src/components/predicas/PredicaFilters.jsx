import { Search, RefreshCw, Calendar } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import styles from "./PredicaFilters.module.css";
import fieldStyles from "../ui/Field.module.css";

const FILTROS_FECHA = [
  { key: "Todos", label: "Todos" },
  { key: "ultimos30", label: "Últimos 30 días" },
  { key: "esteAnio", label: "Este año" },
];

export function PredicaFilters({ filtros, onChange, listas, onRefresh, refrescando }) {
  return (
    <div className={styles.bar}>
      <div className={styles.searchBox}>
        <label htmlFor="busqueda-predicas" className="sr-only">
          Buscar por título o predicador
        </label>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          id="busqueda-predicas"
          type="text"
          placeholder="Buscar por título o predicador..."
          className={[fieldStyles.control, styles.searchInput].join(" ")}
          value={filtros.busqueda}
          onChange={(e) => onChange({ busqueda: e.target.value })}
        />
      </div>

      <label htmlFor="filtro-predicador" className="sr-only">
        Filtrar por predicador
      </label>
      <select
        id="filtro-predicador"
        className={[fieldStyles.control, styles.select].join(" ")}
        value={filtros.predicador}
        onChange={(e) => onChange({ predicador: e.target.value })}
      >
        <option value="Todos">Todos los predicadores</option>
        {listas.predicadores.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <label htmlFor="filtro-anio" className="sr-only">
        Filtrar por año
      </label>
      <select
        id="filtro-anio"
        className={[fieldStyles.control, styles.select].join(" ")}
        value={filtros.anio}
        onChange={(e) => onChange({ anio: e.target.value })}
      >
        <option value="Todos">Todos los años</option>
        {listas.anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <IconButton
        variant="solid"
        className={styles.refresh}
        onClick={onRefresh}
        disabled={refrescando}
        aria-label="Recargar lista de mensajes"
      >
        <RefreshCw size={16} className={refrescando ? "spinning" : ""} aria-hidden="true" />
      </IconButton>

      <div className={styles.chips}>
        {FILTROS_FECHA.map(({ key, label }) => (
          <button
            key={key}
            className={[styles.chip, filtros.filtroFecha === key && styles.active].filter(Boolean).join(" ")}
            onClick={() => onChange({ filtroFecha: key })}
            aria-pressed={filtros.filtroFecha === key}
          >
            <Calendar size={13} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
