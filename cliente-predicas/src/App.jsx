import { useEffect, useState, useMemo } from 'react';
import { Play, Calendar, Search, Sun, Moon } from 'lucide-react';
import './App.css';

// Componente SVG del Águila (Icono personalizado)
const EagleIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="eagle-icon"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    {/* Este es un diseño abstracto tipo "capas" o alas. 
        Si querés un águila más realista, podemos cambiar el path */}
  </svg>
);

function App() {
  const [predicas, setPredicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState('Todos');
  const [predicadorSeleccionado, setPredicadorSeleccionado] = useState('Todos');

  // --- LÓGICA DE TEMA (CLARO / OSCURO) ---
  const [tema, setTema] = useState(() => {
    // 1. Revisar si el usuario ya guardó una preferencia
    const guardado = localStorage.getItem('tema');
    if (guardado) return guardado;
    
    // 2. Si no, revisar la preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Aplicar la clase al body
    if (tema === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    // Guardar elección
    localStorage.setItem('tema', tema);
  }, [tema]);

  const toggleTema = () => {
    setTema(prev => prev === 'light' ? 'dark' : 'light');
  };
  // ----------------------------------------

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/predicas`)
      .then(res => res.json())
      .then(data => {
        setPredicas(data);
        setCargando(false);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  const listas = useMemo(() => {
    const anios = [...new Set(predicas.map(p => new Date(p.fecha).getFullYear()))].sort((a,b) => b-a);
    const predicadores = [...new Set(predicas.map(p => p.predicador))].sort();
    return { anios, predicadores };
  }, [predicas]);

  const predicasFiltradas = useMemo(() => {
    return predicas.filter(p => {
      const coincideAnio = anioSeleccionado === 'Todos' || new Date(p.fecha).getFullYear() === parseInt(anioSeleccionado);
      const coincidePredicador = predicadorSeleccionado === 'Todos' || p.predicador === predicadorSeleccionado;
      const coincideTexto = p.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                            p.predicador.toLowerCase().includes(busqueda.toLowerCase());
      
      return coincideAnio && coincidePredicador && coincideTexto;
    });
  }, [predicas, anioSeleccionado, predicadorSeleccionado, busqueda]);

  return (
    <div className="container">
      
      {/* HEADER CON ÁGUILA Y TOGGLE */}
      <header className="hero">
        
        {/* Botón de cambio de tema */}
        <button onClick={toggleTema} className="theme-toggle" title="Cambiar tema">
          {tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Logo Águila */}
        <EagleIcon />
        
        <div>
          <span className="subtitle-badge">Ministerio Profético La Roca</span>
        </div>
        <h1>Canal de Difusión</h1>
      </header>

      {/* BARRA DE CONTROLES */}
      <div className="controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar mensaje..." 
            className="search-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select 
          value={predicadorSeleccionado} 
          onChange={(e) => setPredicadorSeleccionado(e.target.value)}
        >
          <option value="Todos">Todos los Predicadores</option>
          {listas.predicadores.map(pred => (
            <option key={pred} value={pred}>{pred}</option>
          ))}
        </select>

        <select 
          value={anioSeleccionado} 
          onChange={(e) => setAnioSeleccionado(e.target.value)}
        >
          <option value="Todos">Todos los Años</option>
          {listas.anios.map(anio => (
            <option key={anio} value={anio}>{anio}</option>
          ))}
        </select>
      </div>

      {/* LISTA DE MENSAJES */}
      {cargando ? (
        <p className="loading">Cargando contenido...</p>
      ) : (
        <div className="grid">
          {predicasFiltradas.map((predica) => (
            <div key={predica.id} className="card">
              
              <div className="card-content">
                <div className="card-meta">
                  <span>{new Date(predica.fecha).toLocaleDateString()}</span>
                  <span>•</span>
                  <span style={{color: 'var(--accent)'}}>Audio</span>
                </div>
                <h3>{predica.titulo}</h3>
                <div className="predicador">{predica.predicador}</div>
              </div>

              <a 
                href={predica.url_audio} 
                target="_blank" 
                rel="noreferrer" 
                className="play-btn-round"
                title="Reproducir"
              >
                <Play size={20} fill="currentColor" />
              </a>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;