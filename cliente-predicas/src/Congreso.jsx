import { useEffect, useState } from "react";
import { Play, Pause, RefreshCw, Share2, Download, Heart } from "lucide-react";

const getDriveId = (url) => {
  if (!url) return null;
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];
  const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  return null;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

  .cg-root {
    font-family: 'Lato', sans-serif;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 0 120px;
    box-sizing: border-box;
  }

  .cg-hero {
    position: relative;
    background: linear-gradient(160deg, #2a1205 0%, #1a0a00 50%, #12102a 100%);
    border-radius: 24px;
    padding: 36px 24px 32px;
    text-align: center;
    overflow: hidden;
    margin-bottom: 20px;
    border: 1px solid rgba(201,108,40,0.2);
    box-sizing: border-box;
  }

  .cg-arch-bg {
    position: absolute;
    top: -15px;
    right: 16px;
    opacity: 0.12;
    pointer-events: none;
  }

  .cg-hero-badge {
    display: inline-block;
    background: #c96c28;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  .cg-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 6vw, 2.6rem);
    font-weight: 400;
    color: #f0e8d8;
    margin: 0 0 4px;
    line-height: 1.15;
  }

  .cg-hero-title em {
    font-style: italic;
    color: #c96c28;
  }

  .cg-hero-sub {
    font-size: 12px;
    color: rgba(240,232,216,0.5);
    letter-spacing: 0.8px;
    margin: 8px 0 0;
  }

  .cg-hero-meta {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .cg-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(240,232,216,0.5);
  }

  .cg-meta-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c96c28;
    flex-shrink: 0;
  }

  .cg-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
    box-sizing: border-box;
  }

  .cg-stat {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px 8px;
    text-align: center;
    box-sizing: border-box;
  }

  .cg-stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    color: #c96c28;
    line-height: 1;
    margin-bottom: 4px;
  }

  .cg-stat-label {
    font-size: 10px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cg-tabs {
    display: flex;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 5px;
    gap: 4px;
    margin-bottom: 20px;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
  }

  .cg-tab {
    flex: 1 1 0;
    min-width: 0;
    padding: 10px 4px;
    border-radius: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    box-sizing: border-box;
    overflow: hidden;
  }

  .cg-tab:hover { background: var(--hover-bg); }

  .cg-tab.active {
    background: linear-gradient(135deg, #c96c28, #a04e1a);
    box-shadow: 0 4px 12px rgba(201,108,40,0.3);
  }

  .cg-tab-day {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text-secondary);
    margin-bottom: 2px;
  }

  .cg-tab.active .cg-tab-day { color: rgba(255,255,255,0.7); }

  .cg-tab-name {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cg-tab.active .cg-tab-name { color: #fff; }

  .cg-tab-count {
    font-size: 9px;
    color: var(--text-secondary);
    margin-top: 2px;
    white-space: nowrap;
  }

  .cg-tab.active .cg-tab-count { color: rgba(255,255,255,0.6); }

  .cg-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0 12px;
  }

  .cg-section-pill {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 12px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pill-predica {
    background: rgba(201,108,40,0.12);
    color: #c96c28;
    border: 1px solid rgba(201,108,40,0.25);
  }

  .pill-taller {
    background: rgba(106,90,191,0.12);
    color: #8878d8;
    border: 1px solid rgba(106,90,191,0.25);
  }

  .cg-section-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .cg-empty {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-secondary);
    background: var(--card-bg);
    border-radius: 16px;
    border: 1px dashed var(--border);
  }

  .cg-loading {
    text-align: center;
    padding: 60px;
    color: var(--text-secondary);
  }

  /* Badge tipo dentro de card-meta */
  .tipo-badge {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 1px 7px;
    border-radius: 6px;
  }

  .tipo-badge.predica {
    background: rgba(201,108,40,0.12);
    color: #c96c28;
  }

  .tipo-badge.taller {
    background: rgba(106,90,191,0.12);
    color: #8878d8;
  }

  /* En congreso, el play también hereda el estilo mobile de App.css */
`;

const ArchDecor = () => (
  <svg
    className="cg-arch-bg"
    width="130"
    height="130"
    viewBox="0 0 100 100"
    fill="none"
  >
    <path
      d="M15 95 L15 38 Q15 5 50 5 Q85 5 85 38 L85 95"
      stroke="#c96c28"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path
      d="M24 95 L24 41 Q24 14 50 14 Q76 14 76 41 L76 95"
      stroke="#c96c28"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const DIAS_CONFIG = [
  { key: "jueves", label: "Día 1", nombre: "Jueves" },
  { key: "viernes", label: "Día 2", nombre: "Viernes" },
  { key: "sabado", label: "Día 3", nombre: "Sábado" },
];

export default function Congreso({ onReproducir, predicaReproduciendo }) {
  const [sesiones, setSesiones] = useState({});
  const [diaActivo, setDiaActivo] = useState("jueves");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [favoritos, setFavoritos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoritosCongreso") || "[]");
    } catch {
      return [];
    }
  });

  const cargarCongreso = async () => {
    setCargando(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/congreso`);
      if (!res.ok) throw new Error("Error del servidor");
      const data = await res.json();
      setSesiones(data);
    } catch (err) {
      console.error("Error congreso:", err);
      setError(
        "No se pudo cargar el congreso. ¿Está configurada la carpeta en Drive?",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCongreso();
  }, []);

  const toggleFavorito = (id) => {
    setFavoritos((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem("favoritosCongreso", JSON.stringify(next));
      return next;
    });
  };

  const compartir = async (sesion) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: sesion.nombre, url: sesion.url });
        return;
      } catch {}
    }
    navigator.clipboard?.writeText(sesion.url);
  };

  const sesionesDia = sesiones[diaActivo] || [];
  const predicas = sesionesDia.filter((s) => s.tipo === "predica");
  const talleres = sesionesDia.filter((s) => s.tipo === "taller");
  const totalPredicas = Object.values(sesiones)
    .flat()
    .filter((s) => s.tipo === "predica").length;
  const totalTalleres = Object.values(sesiones)
    .flat()
    .filter((s) => s.tipo === "taller").length;

  const renderCard = (sesion, index) => {
    const isPlaying = predicaReproduciendo?.id === sesion.id;
    const esFav = favoritos.includes(sesion.id);
    const diaLabel = DIAS_CONFIG.find((d) => d.key === diaActivo)?.nombre;

    return (
      <div key={sesion.id} className="card">
        <div className="card-num">
          <span>{index + 1}</span>
        </div>
        <div className="card-body">
          <div className="card-meta">
            <span className={`pill pill-${sesion.tipo}`}>
              {sesion.tipo === "taller" ? "Taller" : "Prédica"}
            </span>
            <span className="pill-date">{diaLabel}</span>
          </div>
          <div className="card-title">{sesion.nombre}</div>
          <div
            className="card-author"
            style={{
              color: "var(--copper, #c96c28)",
              fontWeight: 600,
              fontStyle: "normal",
              fontSize: "0.82rem",
            }}
          >
            {sesion.predicador || "Congreso 2026"}
          </div>
        </div>

        <div className="card-actions">
          <button
            onClick={() => toggleFavorito(sesion.id)}
            className={`favorite-btn ${esFav ? "active" : ""}`}
            title="Favorito"
          >
            <Heart size={20} fill={esFav ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => compartir(sesion)}
            className="share-btn"
            title="Compartir"
          >
            <Share2 size={18} />
          </button>

          <a
            href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/download/${getDriveId(sesion.url)}?name=${encodeURIComponent(sesion.nombre)}`}
            className="download-btn"
            title="Descargar"
            download
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={18} />
          </a>

          <button
            onClick={() =>
              onReproducir({
                id: sesion.id,
                titulo: sesion.nombre,
                predicador: sesion.predicador || "Congreso 2026",
                url_audio: sesion.url,
              })
            }
            className="play-btn-round cg-play-round"
            title={isPlaying ? "Reproduciendo..." : "Escuchar"}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cg-root">
        <div className="cg-hero">
          <ArchDecor />
          <div className="cg-hero-badge">Congreso Profético 2026</div>
          <h2 className="cg-hero-title">
            Saliendo <em>de la</em>
            <br />
            Tumba
          </h2>
          <p className="cg-hero-sub">
            Ministerio La Roca · Ushuaia, Tierra del Fuego
          </p>
        </div>

        <div className="cg-stats">
          <div className="cg-stat">
            <div className="cg-stat-num">3</div>
            <div className="cg-stat-label">Días</div>
          </div>
          <div className="cg-stat">
            <div className="cg-stat-num">{cargando ? "—" : totalPredicas}</div>
            <div className="cg-stat-label">Prédicas</div>
          </div>
          <div className="cg-stat">
            <div className="cg-stat-num">{cargando ? "—" : totalTalleres}</div>
            <div className="cg-stat-label">Talleres</div>
          </div>
        </div>

        <div className="cg-tabs">
          {DIAS_CONFIG.map((dia) => {
            const count = (sesiones[dia.key] || []).length;
            return (
              <button
                key={dia.key}
                className={`cg-tab ${diaActivo === dia.key ? "active" : ""}`}
                onClick={() => setDiaActivo(dia.key)}
              >
                <div className="cg-tab-day">{dia.label}</div>
                <div className="cg-tab-name">{dia.nombre}</div>
                {!cargando && (
                  <div className="cg-tab-count">
                    {count > 0
                      ? `${count} sesión${count !== 1 ? "es" : ""}`
                      : "—"}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {cargando ? (
          <div className="cg-loading">
            <RefreshCw
              size={32}
              style={{ animation: "spin 1s linear infinite", color: "#c96c28" }}
            />
            <p style={{ marginTop: 16 }}>Cargando sesiones...</p>
          </div>
        ) : error ? (
          <div className="cg-empty">
            <p>{error}</p>
            <button
              onClick={cargarCongreso}
              className="reset-btn"
              style={{ marginTop: 12 }}
            >
              Reintentar
            </button>
          </div>
        ) : sesionesDia.length === 0 ? (
          <div className="cg-empty">
            <p>No hay sesiones cargadas para este día todavía.</p>
          </div>
        ) : (
          <div className="grid">
            {predicas.length > 0 && (
              <>
                <div className="cg-section-header">
                  <span className="cg-section-pill pill-predica">
                    {predicas.length === 1 ? "Prédica" : "Prédicas"}
                  </span>
                  <div className="cg-section-line" />
                </div>
                {predicas.map((s, index) => renderCard(s, index))}
              </>
            )}
            {talleres.length > 0 && (
              <>
                <div
                  className="cg-section-header"
                  style={{ marginTop: predicas.length > 0 ? 8 : 0 }}
                >
                  <span className="cg-section-pill pill-taller">
                    Talleres ({talleres.length})
                  </span>
                  <div className="cg-section-line" />
                </div>
                {talleres.map((s, index) => renderCard(s, index))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
