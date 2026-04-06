import { useEffect, useState } from "react";
import { Play, Pause, RefreshCw, Share2, Download, X } from "lucide-react";

// ===================================================
// ESTILOS DEL CONGRESO
// Paleta inspirada en los flyers: tierra + púrpura
// ===================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

  .cg-root {
    font-family: 'Lato', sans-serif;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 0 120px;
  }

  /* === HERO DEL CONGRESO === */
  .cg-hero {
    position: relative;
    background: linear-gradient(160deg, #2a1205 0%, #1a0a00 50%, #12102a 100%);
    border-radius: 24px;
    padding: 40px 32px 36px;
    text-align: center;
    overflow: hidden;
    margin-bottom: 28px;
    border: 1px solid rgba(201,108,40,0.2);
  }

  .dark .cg-hero {
    background: linear-gradient(160deg, #2a1205 0%, #140800 50%, #0e0c22 100%);
  }

  .light .cg-hero {
    background: linear-gradient(160deg, #3d1f0d 0%, #1a0a00 50%, #1a1535 100%);
  }

  .cg-arch-bg {
    position: absolute;
    top: -15px;
    right: 20px;
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
    padding: 5px 16px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .cg-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.6rem;
    font-weight: 400;
    color: #f0e8d8;
    margin: 0 0 4px;
    line-height: 1.1;
  }

  .cg-hero-title em {
    font-style: italic;
    color: #c96c28;
  }

  .cg-hero-sub {
    font-size: 13px;
    color: rgba(240,232,216,0.5);
    letter-spacing: 1px;
    margin: 10px 0 0;
  }

  .cg-hero-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .cg-meta-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: rgba(240,232,216,0.5);
  }

  .cg-meta-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c96c28;
    flex-shrink: 0;
  }

  /* === STATS === */
  .cg-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .cg-stat {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    text-align: center;
  }

  .cg-stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    color: #c96c28;
    line-height: 1;
    margin-bottom: 4px;
  }

  .cg-stat-label {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* === TABS DE DÍAS === */
  .cg-tabs {
    display: flex;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 6px;
    gap: 4px;
    margin-bottom: 20px;
  }

  .cg-tab {
    flex: 1;
    padding: 12px 8px;
    border-radius: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .cg-tab:hover {
    background: var(--hover-bg);
  }

  .cg-tab.active {
    background: linear-gradient(135deg, #c96c28, #a04e1a);
    box-shadow: 0 4px 12px rgba(201,108,40,0.3);
  }

  .cg-tab-day {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-secondary);
    margin-bottom: 2px;
  }

  .cg-tab.active .cg-tab-day {
    color: rgba(255,255,255,0.7);
  }

  .cg-tab-name {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    color: var(--text-primary);
  }

  .cg-tab.active .cg-tab-name {
    color: #fff;
  }

  .cg-tab-count {
    font-size: 10px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .cg-tab.active .cg-tab-count {
    color: rgba(255,255,255,0.6);
  }

  /* === SECCIÓN LABEL === */
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

  /* === TARJETA DE SESIÓN === */
  .cg-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .cg-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 3px 0 0 3px;
    background: transparent;
    transition: background 0.2s;
  }

  .cg-card.predica-card::before { background: #c96c28; }
  .cg-card.taller-card::before { background: #6a5abf; }

  .cg-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px var(--shadow);
  }

  .cg-card.predica-card:hover {
    border-color: rgba(201,108,40,0.35);
  }

  .cg-card.taller-card:hover {
    border-color: rgba(106,90,191,0.35);
  }

  .cg-card.playing {
    border-color: rgba(201,108,40,0.5);
    background: rgba(201,108,40,0.05);
  }

  .cg-card.playing.taller-card {
    border-color: rgba(106,90,191,0.5);
    background: rgba(106,90,191,0.05);
  }

  /* === ÍCONO DE TIPO === */
  .cg-type-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .cg-type-icon.predica-icon {
    background: rgba(201,108,40,0.1);
    border: 1px solid rgba(201,108,40,0.2);
  }

  .cg-type-icon.taller-icon {
    background: rgba(106,90,191,0.1);
    border: 1px solid rgba(106,90,191,0.2);
  }

  /* === CUERPO DE TARJETA === */
  .cg-card-body {
    flex: 1;
    min-width: 0;
  }

  .cg-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
    font-weight: 600;
  }

  .cg-card-meta {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* === ACCIONES === */
  .cg-card-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .cg-action-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--hover-bg);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cg-action-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .cg-play-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .cg-play-btn.predica-play {
    background: #c96c28;
    box-shadow: 0 4px 12px rgba(201,108,40,0.35);
    color: white;
  }

  .cg-play-btn.taller-play {
    background: #6a5abf;
    box-shadow: 0 4px 12px rgba(106,90,191,0.35);
    color: white;
  }

  .cg-play-btn:hover {
    transform: scale(1.1);
  }

  /* === ESTADO VACÍO/CARGANDO === */
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

  /* === MOBILE === */
  @media (max-width: 480px) {
    .cg-hero-title { font-size: 2rem; }
    .cg-hero { padding: 30px 20px 28px; }
    .cg-stats { gap: 8px; }
    .cg-stat { padding: 12px 8px; }
    .cg-stat-num { font-size: 22px; }
    .cg-card { padding: 14px; gap: 10px; }
    .cg-card-title { font-size: 0.92rem; }
  }
`;

// === ÍCONOS INLINE ===
const IconPredica = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path
      d="M9 18V5l12-2v13"
      stroke="#c96c28"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="18" r="3" stroke="#c96c28" strokeWidth="2" />
    <circle cx="18" cy="16" r="3" stroke="#c96c28" strokeWidth="2" />
  </svg>
);

const IconTaller = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      stroke="#6a5abf"
      strokeWidth="2"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      stroke="#6a5abf"
      strokeWidth="2"
    />
    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1.5"
      stroke="#6a5abf"
      strokeWidth="2"
    />
    <rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="1.5"
      stroke="#6a5abf"
      strokeWidth="2"
    />
  </svg>
);

// === ARCO DECORATIVO (símbolo del congreso) ===
const ArchDecor = () => (
  <svg
    className="cg-arch-bg"
    width="140"
    height="140"
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

// === ESTRUCTURA DE DÍAS Y TIPOS (filtrado de nombre de archivo) ===
const DIAS_CONFIG = [
  { key: "jueves", label: "Día 1", nombre: "Jueves", sesiones: 1 },
  { key: "viernes", label: "Día 2", nombre: "Viernes", sesiones: 5 },
  { key: "sabado", label: "Día 3", nombre: "Sábado", sesiones: 5 },
];

function detectarTipo(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes("taller")) return "taller";
  return "predica";
}

function limpiarNombre(nombre) {
  return nombre
    .replace(/\.mp3$/i, "")
    .replace(/\.m4a$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================
export default function Congreso({ onReproducir, predicaReproduciendo }) {
  const [sesiones, setSesiones] = useState({});
  const [diaActivo, setDiaActivo] = useState("jueves");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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

  // Sesiones del día activo, separadas por tipo
  const sesionesDia = sesiones[diaActivo] || [];
  const predicas = sesionesDia.filter((s) => s.tipo === "predica");
  const talleres = sesionesDia.filter((s) => s.tipo === "taller");

  const compartir = async (sesion) => {
    const texto = `🦅 ${sesion.nombre} — Congreso "Saliendo de la Tumba" 2026\n🔗 ${sesion.url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: sesion.nombre, url: sesion.url });
      } catch {
        navigator.clipboard?.writeText(sesion.url);
      }
    } else {
      navigator.clipboard?.writeText(sesion.url);
    }
  };

  const getDriveId = (url) => {
    if (!url) return null;
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) return matchD[1];
    const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matchId) return matchId[1];
    return null;
  };

  const totalSesiones = Object.values(sesiones).flat().length;
  const totalPredicas = Object.values(sesiones)
    .flat()
    .filter((s) => s.tipo === "predica").length;
  const totalTalleres = Object.values(sesiones)
    .flat()
    .filter((s) => s.tipo === "taller").length;

  return (
    <>
      <style>{styles}</style>
      <div className="cg-root">
        {/* === HERO === */}
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
          <div className="cg-hero-meta">
            <div className="cg-meta-item">
              <div className="cg-meta-dot" />
              <span>2 al 4 de Abril</span>
            </div>
            <div className="cg-meta-item">
              <div className="cg-meta-dot" />
              <span>Los Ñires y Bahía Grande</span>
            </div>
            <div className="cg-meta-item">
              <div className="cg-meta-dot" />
              <span>Acceso libre</span>
            </div>
          </div>
        </div>

        {/* === STATS === */}
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

        {/* === TABS DE DÍAS === */}
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

        {/* === CONTENIDO === */}
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
          <div>
            {/* PRÉDICAS */}
            {predicas.length > 0 && (
              <>
                <div className="cg-section-header">
                  <span className="cg-section-pill pill-predica">
                    {predicas.length === 1 ? "Prédica" : "Prédicas"}
                  </span>
                  <div className="cg-section-line" />
                </div>
                {predicas.map((sesion) => {
                  const isPlaying = predicaReproduciendo?.id === sesion.id;
                  return (
                    <div
                      key={sesion.id}
                      className={`cg-card predica-card ${isPlaying ? "playing" : ""}`}
                    >
                      <div className="cg-type-icon predica-icon">
                        <IconPredica />
                      </div>
                      <div className="cg-card-body">
                        <div className="cg-card-title">{sesion.nombre}</div>
                        <div className="cg-card-meta">
                          Congreso 2026 ·{" "}
                          {DIAS_CONFIG.find((d) => d.key === diaActivo)?.nombre}
                        </div>
                      </div>
                      <div className="cg-card-actions">
                        <button
                          className="cg-action-btn"
                          onClick={() => compartir(sesion)}
                          title="Compartir"
                        >
                          <Share2 size={14} />
                        </button>
                        <a
                          href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/download/${getDriveId(sesion.url)}?name=${encodeURIComponent(sesion.nombre)}`}
                          className="cg-action-btn"
                          title="Descargar"
                          download
                          onClick={(e) => e.stopPropagation()}
                          style={{ textDecoration: "none" }}
                        >
                          <Download size={14} />
                        </a>
                        <button
                          className="cg-play-btn predica-play"
                          onClick={() =>
                            onReproducir({
                              ...sesion,
                              titulo: sesion.nombre,
                              predicador: "Congreso 2026",
                              url_audio: sesion.url,
                            })
                          }
                          title={isPlaying ? "Pausar" : "Escuchar"}
                        >
                          {isPlaying ? (
                            <Pause size={16} fill="white" />
                          ) : (
                            <Play
                              size={16}
                              fill="white"
                              style={{ marginLeft: 2 }}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* TALLERES */}
            {talleres.length > 0 && (
              <>
                <div className="cg-section-header">
                  <span className="cg-section-pill pill-taller">
                    Talleres ({talleres.length})
                  </span>
                  <div className="cg-section-line" />
                </div>
                {talleres.map((sesion) => {
                  const isPlaying = predicaReproduciendo?.id === sesion.id;
                  return (
                    <div
                      key={sesion.id}
                      className={`cg-card taller-card ${isPlaying ? "playing" : ""}`}
                    >
                      <div className="cg-type-icon taller-icon">
                        <IconTaller />
                      </div>
                      <div className="cg-card-body">
                        <div className="cg-card-title">{sesion.nombre}</div>
                        <div className="cg-card-meta">
                          Congreso 2026 ·{" "}
                          {DIAS_CONFIG.find((d) => d.key === diaActivo)?.nombre}
                        </div>
                      </div>
                      <div className="cg-card-actions">
                        <button
                          className="cg-action-btn"
                          onClick={() => compartir(sesion)}
                          title="Compartir"
                        >
                          <Share2 size={14} />
                        </button>
                        <a
                          href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/download/${getDriveId(sesion.url)}?name=${encodeURIComponent(sesion.nombre)}`}
                          className="cg-action-btn"
                          title="Descargar"
                          download
                          onClick={(e) => e.stopPropagation()}
                          style={{ textDecoration: "none" }}
                        >
                          <Download size={14} />
                        </a>
                        <button
                          className="cg-play-btn taller-play"
                          onClick={() =>
                            onReproducir({
                              ...sesion,
                              titulo: sesion.nombre,
                              predicador: "Congreso 2026",
                              url_audio: sesion.url,
                            })
                          }
                          title={isPlaying ? "Pausar" : "Escuchar"}
                        >
                          {isPlaying ? (
                            <Pause size={16} fill="white" />
                          ) : (
                            <Play
                              size={16}
                              fill="white"
                              style={{ marginLeft: 2 }}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
