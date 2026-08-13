import { useCongreso, DIAS_CONFIG } from "../hooks/useCongreso";
import { useFavorites } from "../hooks/useFavorites";
import { useShare } from "../hooks/useShare";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { BASE_URL } from "../api/client";
import { getDriveId } from "../api/predicas";
import { ArchDecor } from "../components/icons/ArchDecor";
import { MessageGrid } from "../components/predicas/MessageGrid";
import { MessageCard } from "../components/predicas/MessageCard";
import { MessageCardSkeleton } from "../components/predicas/MessageCardSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Badge } from "../components/ui/Badge";
import styles from "./CongresoPage.module.css";

export default function CongresoPage() {
  const { cargando, error, diaActivo, setDiaActivo, sesiones, predicas, talleres, totalPredicas, totalTalleres, recargar } =
    useCongreso();
  const [favoritos, toggleFavorito] = useFavorites("favoritosCongreso");
  const { predicaActual, reproducir } = useAudioPlayer();
  const compartir = useShare();

  const renderSesion = (sesion, index) => (
    <MessageCard
      key={sesion.id}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      index={index + 1}
      title={sesion.nombre}
      predicador={sesion.predicador || "Congreso 2026"}
      dateLabel={DIAS_CONFIG.find((d) => d.key === diaActivo)?.nombre}
      tipo={sesion.tipo}
      isPlaying={predicaActual?.id === sesion.id}
      isFavorite={favoritos.includes(sesion.id)}
      onToggleFavorite={() => toggleFavorito(sesion.id)}
      onShare={() => compartir({ titulo: sesion.nombre, predicador: sesion.predicador || "Congreso 2026", url: sesion.url })}
      downloadHref={`${BASE_URL}/api/download/${getDriveId(sesion.url)}?name=${encodeURIComponent(sesion.nombre)}`}
      onPlay={() =>
        reproducir({
          id: sesion.id,
          titulo: sesion.nombre,
          predicador: sesion.predicador || "Congreso 2026",
          url_audio: sesion.url,
        })
      }
    />
  );

  return (
    <>
      <div className={styles.hero}>
        <ArchDecor className={styles.arch} />
        <span className={styles.badge}>Congreso Profético 2026</span>
        <h1 className={styles.title}>
          Saliendo <em>de la</em>
          <br />
          Tumba
        </h1>
        <p className={styles.location}>Ministerio La Roca · Ushuaia, Tierra del Fuego</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>3</div>
          <div className={styles.statLabel}>Días</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{cargando ? "—" : totalPredicas}</div>
          <div className={styles.statLabel}>Prédicas</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{cargando ? "—" : totalTalleres}</div>
          <div className={styles.statLabel}>Talleres</div>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Día del congreso">
        {DIAS_CONFIG.map((dia) => {
          const count = (sesiones[dia.key] || []).length;
          const active = diaActivo === dia.key;
          return (
            <button
              key={dia.key}
              role="tab"
              aria-selected={active}
              className={[styles.tab, active && styles.active].filter(Boolean).join(" ")}
              onClick={() => setDiaActivo(dia.key)}
            >
              <div className={styles.tabDay}>{dia.label}</div>
              <div className={styles.tabName}>{dia.nombre}</div>
              {!cargando && (
                <div className={styles.tabCount}>{count > 0 ? `${count} sesión${count !== 1 ? "es" : ""}` : "—"}</div>
              )}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <MessageGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <MessageCardSkeleton key={i} />
          ))}
        </MessageGrid>
      ) : error ? (
        <ErrorState title="No se pudo cargar el congreso" description={error} onRetry={recargar} />
      ) : predicas.length === 0 && talleres.length === 0 ? (
        <EmptyState title="Todavía no hay sesiones cargadas para este día" />
      ) : (
        <>
          {predicas.length > 0 && (
            <>
              <div className={styles.sectionHead}>
                <Badge tone="accent">{predicas.length === 1 ? "Prédica" : "Prédicas"}</Badge>
                <span className={styles.sectionLine} />
              </div>
              <MessageGrid>{predicas.map(renderSesion)}</MessageGrid>
            </>
          )}

          {talleres.length > 0 && (
            <>
              <div className={styles.sectionHead}>
                <Badge tone="taller">Talleres ({talleres.length})</Badge>
                <span className={styles.sectionLine} />
              </div>
              <MessageGrid>{talleres.map(renderSesion)}</MessageGrid>
            </>
          )}
        </>
      )}
    </>
  );
}
