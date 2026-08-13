import { BellRing, Heart } from "lucide-react";
import { usePredicas } from "../hooks/usePredicas";
import { useFavorites } from "../hooks/useFavorites";
import { useShare } from "../hooks/useShare";
import { usePushPermission } from "../hooks/usePushPermission";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { BASE_URL } from "../api/client";
import { getDriveId } from "../api/predicas";
import { formatearFecha } from "../utils/formatFecha";
import { PredicaFilters } from "../components/predicas/PredicaFilters";
import { MessageGrid } from "../components/predicas/MessageGrid";
import { MessageCard } from "../components/predicas/MessageCard";
import { MessageCardSkeleton } from "../components/predicas/MessageCardSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const {
    cargando,
    error,
    stats,
    listas,
    filtros,
    setBusqueda,
    setPredicador,
    setAnio,
    setFiltroFecha,
    limpiarFiltros,
    predicasVisibles,
    totalFiltradas,
    pagina,
    setPagina,
    totalPaginas,
    itemsPorPagina,
    recargar,
  } = usePredicas();

  const [favoritos, toggleFavorito] = useFavorites("favoritos");
  const { predicaActual, reproducir } = useAudioPlayer();
  const compartir = useShare();
  const { permiso, activando, activar } = usePushPermission();

  const handleFiltro = (parcial) => {
    if ("busqueda" in parcial) setBusqueda(parcial.busqueda);
    if ("predicador" in parcial) setPredicador(parcial.predicador);
    if ("anio" in parcial) setAnio(parcial.anio);
    if ("filtroFecha" in parcial) setFiltroFecha(parcial.filtroFecha);
  };

  const cambiarPagina = (n) => {
    setPagina(n);
    document.getElementById("resultados-predicas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Ministerio Profético La Roca</span>
        <h1 className={styles.title}>Canal de Difusión</h1>
        <p className={styles.subtitle}>
          Escuchá, descargá y compartí las prédicas y talleres del ministerio, todo en un mismo lugar.
        </p>

        {stats && (
          <div className={styles.statsRow}>
            <span>
              <strong>{stats.total}</strong> mensajes
            </span>
            <span className={styles.dot}>•</span>
            <span>
              Desde <strong>{stats.ultimoAnio}</strong>
            </span>
            {favoritos.length > 0 && (
              <>
                <span className={styles.dot}>•</span>
                <span className={styles.favCount}>
                  <Heart size={13} fill="currentColor" /> {favoritos.length}
                </span>
              </>
            )}
          </div>
        )}

        {"Notification" in window && permiso === "default" && (
          <Button variant="secondary" size="sm" className={styles.notifyBtn} onClick={activar} loading={activando}>
            <BellRing size={15} />
            Recibir alertas de nuevos mensajes
          </Button>
        )}
      </section>

      <PredicaFilters
        filtros={filtros}
        onChange={handleFiltro}
        listas={listas}
        onRefresh={recargar}
        refrescando={cargando}
      />

      <div id="resultados-predicas">
        {cargando ? (
          <MessageGrid>
            {Array.from({ length: itemsPorPagina }).map((_, i) => (
              <MessageCardSkeleton key={i} />
            ))}
          </MessageGrid>
        ) : error ? (
          <ErrorState
            title="No se pudo cargar la biblioteca"
            description="Revisá tu conexión e intentá de nuevo."
            onRetry={recargar}
          />
        ) : predicasVisibles.length === 0 ? (
          <EmptyState
            title="No encontramos mensajes con esos filtros"
            description="Probá con otra búsqueda o limpiá los filtros para ver todo el catálogo."
            action={
              <Button variant="primary" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <>
            <div className={styles.resultsHead}>
              <span className={styles.resultsCount}>
                {totalFiltradas} mensaje{totalFiltradas !== 1 ? "s" : ""}
              </span>
            </div>

            <MessageGrid>
              {predicasVisibles.map((predica, i) => (
                <MessageCard
                  key={predica.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  title={predica.titulo}
                  predicador={predica.predicador}
                  dateLabel={formatearFecha(predica.fecha)}
                  tipo={predica.esTaller ? "taller" : "predica"}
                  isPlaying={predicaActual?.id === predica.id}
                  isFavorite={favoritos.includes(predica.id)}
                  onToggleFavorite={() => toggleFavorito(predica.id)}
                  onShare={() => compartir({ titulo: predica.titulo, predicador: predica.predicador, url: predica.url_audio })}
                  downloadHref={`${BASE_URL}/api/download/${getDriveId(predica.url_audio)}?name=${encodeURIComponent(predica.titulo)}`}
                  onPlay={() => reproducir(predica)}
                />
              ))}
            </MessageGrid>

            <Pagination
              page={pagina}
              totalPages={totalPaginas}
              onChange={cambiarPagina}
              totalItems={totalFiltradas}
              itemsPerPage={itemsPorPagina}
            />
          </>
        )}
      </div>
    </>
  );
}
