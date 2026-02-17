import { useState, useMemo } from 'react';
import { Save, X, RefreshCw, Edit2, Search, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock, Users, FileText } from 'lucide-react';

// ============================================================
// ESTILOS INTERNOS DEL PANEL (no tocan el App.css principal)
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Playfair+Display:wght@600;700&family=Lato:wght@300;400;700&display=swap');

  .ap-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 10, 20, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: ap-fadeIn 0.25s ease;
  }

  @keyframes ap-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .ap-panel {
    background: #0d1526;
    width: 100%;
    max-width: 1100px;
    height: 92vh;
    border-radius: 24px;
    border: 1px solid rgba(212, 175, 55, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(212,175,55,0.08),
      0 30px 80px rgba(0,0,0,0.8),
      inset 0 1px 0 rgba(212,175,55,0.15);
    animation: ap-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes ap-slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* ─── TOPBAR ─── */
  .ap-topbar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 20px;
    padding: 18px 28px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.12);
    background: rgba(212, 175, 55, 0.04);
    flex-shrink: 0;
  }

  .ap-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ap-brand-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #d4af37, #b8860b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(212,175,55,0.3);
    flex-shrink: 0;
  }

  .ap-brand-text h2 {
    margin: 0;
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    color: #d4af37;
    font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .ap-brand-text span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: rgba(212,175,55,0.45);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  /* ─── STATS PILLS ─── */
  .ap-stats {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .ap-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 5px 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: rgba(226, 232, 240, 0.6);
  }

  .ap-stat svg {
    color: #d4af37;
    opacity: 0.7;
  }

  .ap-stat strong {
    color: #e2e8f0;
    font-weight: 600;
  }

  /* ─── HEADER ACTIONS ─── */
  .ap-header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ap-btn-sync {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #d4af37;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Lato', sans-serif;
    white-space: nowrap;
  }

  .ap-btn-sync:hover {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-1px);
  }

  .ap-btn-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: rgba(239, 68, 68, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ap-btn-close:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  /* ─── SEARCH BAR ─── */
  .ap-search-bar {
    padding: 14px 28px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  .ap-search-wrap {
    position: relative;
    max-width: 500px;
  }

  .ap-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(212,175,55,0.4);
    pointer-events: none;
  }

  .ap-search-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 10px 14px 10px 42px;
    color: #e2e8f0;
    font-size: 0.88rem;
    font-family: 'Lato', sans-serif;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .ap-search-input::placeholder {
    color: rgba(148, 163, 184, 0.4);
  }

  .ap-search-input:focus {
    border-color: rgba(212,175,55,0.35);
    background: rgba(212,175,55,0.04);
    box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
  }

  /* ─── TABLE AREA ─── */
  .ap-table-wrap {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    padding: 0 8px 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(212,175,55,0.2) transparent;
  }

  .ap-table-wrap::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .ap-table-wrap::-webkit-scrollbar-thumb {
    background: rgba(212,175,55,0.2);
    border-radius: 3px;
  }

  .ap-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 3px;
    min-width: 680px;
  }

  /* ─── THEAD ─── */
  .ap-table thead tr {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .ap-table thead th {
    padding: 12px 16px;
    text-align: left;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 1.8px;
    color: rgba(212,175,55,0.5);
    background: #0d1526;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: color 0.2s;
    border-bottom: 1px solid rgba(212,175,55,0.1);
  }

  .ap-table thead th:hover {
    color: rgba(212,175,55,0.85);
  }

  .ap-table thead th.sorted {
    color: #d4af37;
  }

  .ap-th-inner {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* ─── TBODY ROWS ─── */
  .ap-row {
    transition: all 0.2s ease;
  }

  .ap-row td {
    padding: 14px 16px;
    background: rgba(255,255,255,0.025);
    border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: #cbd5e1;
    font-size: 0.88rem;
    vertical-align: middle;
    transition: background 0.2s;
  }

  .ap-row td:first-child {
    border-radius: 10px 0 0 10px;
    border-left: 1px solid rgba(255,255,255,0.04);
  }

  .ap-row td:last-child {
    border-radius: 0 10px 10px 0;
    border-right: 1px solid rgba(255,255,255,0.04);
  }

  .ap-row:hover td {
    background: rgba(212,175,55,0.04);
    border-color: rgba(212,175,55,0.1);
  }

  .ap-row.editing td {
    background: rgba(212,175,55,0.07);
    border-color: rgba(212,175,55,0.2);
  }

  .ap-row.editing td:first-child {
    border-left: 2px solid rgba(212,175,55,0.5);
  }

  /* ─── CELDA TÍTULO ─── */
  .ap-title-cell {
    font-family: 'Playfair Display', serif;
    font-size: 0.95rem;
    color: #e2e8f0;
    font-weight: 600;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ─── BADGE PREDICADOR ─── */
  .ap-badge {
    display: inline-flex;
    align-items: center;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.18);
    color: #d4af37;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ─── FECHA MONO ─── */
  .ap-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    color: rgba(148,163,184,0.7);
    white-space: nowrap;
  }

  /* ─── INPUTS EN EDICIÓN ─── */
  .ap-input {
    width: 100%;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(212,175,55,0.35);
    border-radius: 8px;
    padding: 8px 12px;
    color: #e2e8f0;
    font-family: 'Lato', sans-serif;
    font-size: 0.88rem;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
    min-width: 0;
  }

  .ap-input:focus {
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
    background: rgba(212,175,55,0.05);
  }

  .ap-input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.7) sepia(1) saturate(3) hue-rotate(5deg);
    cursor: pointer;
  }

  /* ─── ACTION BUTTONS ─── */
  .ap-actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .ap-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.18s ease;
    flex-shrink: 0;
  }

  .ap-edit-btn {
    background: rgba(255,255,255,0.05);
    color: rgba(148,163,184,0.6);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .ap-edit-btn:hover {
    background: rgba(212,175,55,0.12);
    border-color: rgba(212,175,55,0.3);
    color: #d4af37;
    transform: scale(1.05);
  }

  .ap-save-btn {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.25);
    color: #10b981;
  }

  .ap-save-btn:hover:not(:disabled) {
    background: rgba(16,185,129,0.18);
    border-color: rgba(16,185,129,0.45);
    transform: scale(1.05);
  }

  .ap-save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ap-cancel-btn {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    color: rgba(239,68,68,0.7);
  }

  .ap-cancel-btn:hover {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.4);
    color: #ef4444;
  }

  /* ─── TOAST INTERNO ─── */
  .ap-toast {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    font-family: 'Lato', sans-serif;
    animation: ap-toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 10;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  @keyframes ap-toastIn {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }

  .ap-toast.success {
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(16,185,129,0.35);
    color: #10b981;
  }

  .ap-toast.error {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.35);
    color: #ef4444;
  }

  /* ─── EMPTY ─── */
  .ap-empty {
    text-align: center;
    padding: 60px 20px;
    color: rgba(148,163,184,0.4);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }

  /* ─── FOOTER ─── */
  .ap-footer {
    padding: 10px 28px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .ap-footer-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    color: rgba(148,163,184,0.35);
    letter-spacing: 0.5px;
  }

  .ap-footer-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 6px #10b981;
    animation: ap-pulse 2s ease-in-out infinite;
  }

  @keyframes ap-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 680px) {
    .ap-topbar {
      grid-template-columns: 1fr auto;
      padding: 14px 16px;
    }
    .ap-stats { display: none; }
    .ap-search-bar { padding: 10px 16px; }
    .ap-table thead th,
    .ap-table td { padding: 10px 12px; }
    .ap-btn-sync span { display: none; }
    .ap-panel { border-radius: 16px; }
  }
`;

// ============================================================
// PREDICADORES OFICIALES
// ============================================================
const PREDICADORES = [
  'Profeta Pablo Lay',
  'Profeta Miqueas Lay',
  'Pastora Karina',
  'Pastora Cecilia',
  'Pastora Sofia Lay',
  'Pastora Candela Lay',
];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const AdminPanel = ({ predicas, onCerrar, onRecargar, password }) => {
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', dir: 'desc' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Iniciar edición ───
  const empezarEdicion = (predica) => {
    setEditandoId(predica.id);
    const fechaFormat = new Date(predica.fecha).toISOString().split('T')[0];
    setForm({ ...predica, fecha: fechaFormat });
  };

  // ─── Guardar ───
  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/predicas/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password }),
      });
      if (res.ok) {
        showToast('Guardado con éxito', 'success');
        setEditandoId(null);
        onRecargar();
      } else {
        showToast('Error al guardar (revisá la contraseña)', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Ordenamiento ───
  const toggleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  // ─── Filtrado + Sort ───
  const predicasFiltradas = useMemo(() => {
    let lista = predicas.filter(p => {
      const q = busqueda.toLowerCase();
      return (
        p.titulo?.toLowerCase().includes(q) ||
        p.predicador?.toLowerCase().includes(q) ||
        p.fecha?.includes(q)
      );
    });

    lista.sort((a, b) => {
      let va = a[sortConfig.key] ?? '';
      let vb = b[sortConfig.key] ?? '';
      if (sortConfig.key === 'fecha') {
        va = new Date(va);
        vb = new Date(vb);
      } else {
        va = va.toString().toLowerCase();
        vb = vb.toString().toLowerCase();
      }
      if (va < vb) return sortConfig.dir === 'asc' ? -1 : 1;
      if (va > vb) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return lista;
  }, [predicas, busqueda, sortConfig]);

  // ─── Stats ───
  const predicadores = useMemo(() => {
    return [...new Set(predicas.map(p => p.predicador))].length;
  }, [predicas]);

  // ─── Icono sort ───
  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ChevronDown size={10} style={{ opacity: 0.25 }} />;
    return sortConfig.dir === 'asc'
      ? <ChevronUp size={10} style={{ color: '#d4af37' }} />
      : <ChevronDown size={10} style={{ color: '#d4af37' }} />;
  };

  return (
    <>
      <style>{styles}</style>

      <div className="ap-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
        <div className="ap-panel">

          {/* ── TOPBAR ── */}
          <div className="ap-topbar">
            {/* Brand */}
            <div className="ap-brand">
              <div className="ap-brand-icon">🛠️</div>
              <div className="ap-brand-text">
                <h2>Panel de Control</h2>
                <span>Ministerio La Roca</span>
              </div>
            </div>

            {/* Stats */}
            <div className="ap-stats">
              <div className="ap-stat">
                <FileText size={12} />
                <strong>{predicas.length}</strong> mensajes
              </div>
              <div className="ap-stat">
                <Users size={12} />
                <strong>{predicadores}</strong> predicadores
              </div>
              <div className="ap-stat">
                <Clock size={12} />
                Actualizado ahora
              </div>
            </div>

            {/* Actions */}
            <div className="ap-header-actions">
              <button onClick={onRecargar} className="ap-btn-sync">
                <RefreshCw size={15} />
                <span>Sincronizar Drive</span>
              </button>
              <button onClick={onCerrar} className="ap-btn-close" title="Cerrar">
                <X size={17} />
              </button>
            </div>
          </div>

          {/* ── SEARCH ── */}
          <div className="ap-search-bar">
            <div className="ap-search-wrap">
              <Search size={15} className="ap-search-icon" />
              <input
                type="text"
                className="ap-search-input"
                placeholder="Buscar por título, predicador o fecha..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setEditandoId(null); }}
              />
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('fecha')} className={sortConfig.key === 'fecha' ? 'sorted' : ''}>
                    <div className="ap-th-inner">Fecha <SortIcon col="fecha" /></div>
                  </th>
                  <th onClick={() => toggleSort('titulo')} className={sortConfig.key === 'titulo' ? 'sorted' : ''}>
                    <div className="ap-th-inner">Título <SortIcon col="titulo" /></div>
                  </th>
                  <th onClick={() => toggleSort('predicador')} className={sortConfig.key === 'predicador' ? 'sorted' : ''}>
                    <div className="ap-th-inner">Predicador <SortIcon col="predicador" /></div>
                  </th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {predicasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="ap-empty">// Sin resultados para "{busqueda}"</div>
                    </td>
                  </tr>
                )}

                {predicasFiltradas.map(predica => {
                  const isEditing = editandoId === predica.id;
                  const fechaDisplay = (() => {
                    const d = new Date(predica.fecha);
                    return `${d.getUTCDate().toString().padStart(2,'0')}/${(d.getUTCMonth()+1).toString().padStart(2,'0')}/${d.getUTCFullYear()}`;
                  })();

                  return (
                    <tr key={predica.id} className={`ap-row ${isEditing ? 'editing' : ''}`}>
                      {isEditing ? (
                        <>
                          {/* Fecha */}
                          <td style={{ width: '140px' }}>
                            <input
                              type="date"
                              className="ap-input"
                              value={form.fecha}
                              onChange={e => setForm({ ...form, fecha: e.target.value })}
                            />
                          </td>
                          {/* Título */}
                          <td>
                            <input
                              type="text"
                              className="ap-input"
                              value={form.titulo}
                              onChange={e => setForm({ ...form, titulo: e.target.value })}
                              placeholder="Título del mensaje"
                            />
                          </td>
                          {/* Predicador */}
                          <td style={{ width: '200px' }}>
                            <select
                              className="ap-input"
                              value={form.predicador}
                              onChange={e => setForm({ ...form, predicador: e.target.value })}
                              style={{ appearance: 'auto' }}
                            >
                              {PREDICADORES.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                              {!PREDICADORES.includes(form.predicador) && (
                                <option value={form.predicador}>{form.predicador}</option>
                              )}
                            </select>
                          </td>
                          {/* Acciones */}
                          <td>
                            <div className="ap-actions" style={{ justifyContent: 'flex-end' }}>
                              <button
                                onClick={guardarCambios}
                                disabled={guardando}
                                className="ap-icon-btn ap-save-btn"
                                title="Guardar"
                              >
                                {guardando
                                  ? <RefreshCw size={15} style={{ animation: 'ap-spin 1s linear infinite' }} />
                                  : <Save size={15} />
                                }
                              </button>
                              <button
                                onClick={() => setEditandoId(null)}
                                className="ap-icon-btn ap-cancel-btn"
                                title="Cancelar"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className="ap-date">{fechaDisplay}</span>
                          </td>
                          <td>
                            <div className="ap-title-cell" title={predica.titulo}>
                              {predica.titulo}
                            </div>
                          </td>
                          <td>
                            <span className="ap-badge" title={predica.predicador}>
                              {predica.predicador}
                            </span>
                          </td>
                          <td>
                            <div className="ap-actions" style={{ justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => empezarEdicion(predica)}
                                className="ap-icon-btn ap-edit-btn"
                                title="Editar"
                              >
                                <Edit2 size={14} />
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

          {/* ── FOOTER ── */}
          <div className="ap-footer">
            <span className="ap-footer-count">
              {predicasFiltradas.length} / {predicas.length} registros
              {busqueda && ` — filtrando por "${busqueda}"`}
            </span>
            <div className="ap-footer-dot" title="Conectado" />
          </div>

          {/* ── TOAST ── */}
          {toast && (
            <div className={`ap-toast ${toast.type}`}>
              {toast.type === 'success'
                ? <CheckCircle size={16} />
                : <AlertCircle size={16} />
              }
              {toast.msg}
            </div>
          )}

        </div>
      </div>

      {/* Keyframe extra para el spinner */}
      <style>{`
        @keyframes ap-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};