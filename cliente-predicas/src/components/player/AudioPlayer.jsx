import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, X, ExternalLink, Volume2, Loader2 } from "lucide-react";
import { BASE_URL } from "../../api/client";
import { getDriveId } from "../../api/predicas";
import { IconButton } from "../ui/IconButton";
import styles from "./AudioPlayer.module.css";

function formatTime(time) {
  if (!time || Number.isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// Se monta con key={predica.id} desde el host (ver AudioPlayerHost) — así
// cada mensaje arranca con estado 100% limpio sin tener que resetear nada
// a mano.
export function AudioPlayer({ predica, onClose }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioUrl = useMemo(() => {
    const id = getDriveId(predica.url_audio);
    return id ? `${BASE_URL}/api/audio/${id}` : predica.url_audio;
  }, [predica.url_audio]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (audioRef.current && currentTime > 0) {
        localStorage.setItem(`progress_${predica.id}`, currentTime.toString());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, predica.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const onLoadedMetadata = () => {
    setLoading(false);
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);

    const savedProgress = parseFloat(localStorage.getItem(`progress_${predica.id}`));
    if (!Number.isNaN(savedProgress) && savedProgress > 0) {
      audioRef.current.currentTime = savedProgress;
      setCurrentTime(savedProgress);
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    localStorage.removeItem(`progress_${predica.id}`);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          {loading && !error ? (
            <Loader2 size={38} className="spinning" style={{ color: "var(--accent)" }} aria-hidden="true" />
          ) : (
            <IconButton
              variant="solid"
              className={styles.playToggle}
              onClick={togglePlay}
              disabled={error}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </IconButton>
          )}
          <div className={styles.meta}>
            <p className={styles.title}>{error ? "No se pudo cargar el audio" : predica.titulo}</p>
            {!error && <p className={styles.artist}>{predica.predicador}</p>}
          </div>
          <IconButton
            aria-label="Cerrar reproductor"
            onClick={onClose}
            className={styles.mobileOnly}
            size="sm"
          >
            <X size={16} />
          </IconButton>
        </div>

        {!error && (
          <div className={styles.progress}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className={styles.slider}
              style={{ backgroundSize: `${duration ? (currentTime * 100) / duration : 0}% 100%` }}
              aria-label="Progreso de la reproducción"
            />
            <span className={styles.time}>{formatTime(duration)}</span>
          </div>
        )}

        <div className={styles.extras}>
          {!error && (
            <div className={styles.volume}>
              <Volume2 size={16} aria-hidden="true" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className={styles.volumeSlider}
                style={{ backgroundSize: `${volume * 100}% 100%` }}
                aria-label="Volumen"
              />
            </div>
          )}
          <a
            href={predica.url_audio}
            target="_blank"
            rel="noreferrer"
            className={styles.linkOut}
            aria-label="Abrir en Google Drive"
            title="Abrir en Google Drive"
          >
            <ExternalLink size={17} />
          </a>
          <IconButton aria-label="Cerrar reproductor" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
