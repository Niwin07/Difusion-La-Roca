import { Play, Pause, Heart, Share2, Download, Mic2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { IconButton } from "../ui/IconButton";
import styles from "./MessageCard.module.css";

export function MessageCard({
  index,
  title,
  predicador,
  dateLabel,
  tipo = "predica",
  isPlaying = false,
  isFavorite = false,
  onToggleFavorite,
  onShare,
  downloadHref,
  onPlay,
  style,
}) {
  return (
    <article className={[styles.card, isPlaying && styles.playing].filter(Boolean).join(" ")} style={style}>
      <div className={styles.top}>
        <Badge tone={tipo === "taller" ? "taller" : "accent"}>{tipo === "taller" ? "Taller" : "Prédica"}</Badge>
        {typeof index === "number" && <span className={styles.index}>#{index}</span>}
        <span className={styles.date}>{dateLabel}</span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.author}>
          <Mic2 size={12} aria-hidden="true" />
          {predicador}
        </p>
      </div>

      <div className={styles.actions}>
        {onToggleFavorite && (
          <IconButton
            size="sm"
            aria-label={isFavorite ? `Quitar "${title}" de favoritos` : `Agregar "${title}" a favoritos`}
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
            className={isFavorite ? styles.favoriteActive : ""}
          >
            <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
          </IconButton>
        )}

        <div className={styles.secondaryActions}>
          {onShare && (
            <IconButton size="sm" aria-label={`Compartir "${title}"`} onClick={onShare}>
              <Share2 size={14} />
            </IconButton>
          )}
          {downloadHref && (
            <IconButton
              size="sm"
              aria-label={`Descargar "${title}"`}
              title="Descargar"
              href={downloadHref}
              download
            >
              <Download size={14} />
            </IconButton>
          )}
          <button className={styles.playBtn} onClick={onPlay} aria-label={isPlaying ? `Reproduciendo "${title}"` : `Escuchar "${title}"`}>
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            <span>{isPlaying ? "Sonando" : "Escuchar"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
