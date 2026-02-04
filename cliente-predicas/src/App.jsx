import { useEffect, useState, useMemo } from 'react';
import { Play, Calendar, Search, Filter, Mic2 } from 'lucide-react';
import './App.css';

function App() {
  const [predicas, setPredicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState('Todos');
  const [predicadorSeleccionado, setPredicadorSeleccionado] = useState('Todos');

  useEffect(() => {
    // Usamos la variable de entorno. Si no existe (en local a veces), usa localhost como respaldo.
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    fetch(`${apiUrl}/api/predicas`)
      .then(res => res.json())
      .then(data => {
        setPredicas(data);
        setCargando(false);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  // --- LÓGICA DE FILTROS INTELIGENTES ---
  
  // 1. Obtener listas únicas para los selectores
  const listas = useMemo(() => {
    const anios = [...new Set(predicas.map(p => new Date(p.fecha).getFullYear()))].sort((a,b) => b-a);
    const predicadores = [...new Set(predicas.map(p => p.predicador))].sort();
    return { anios, predicadores };
  }, [predicas]);

  // 2. Filtrar la data en tiempo real
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
      
      {/* HEADER MINIMALISTA */}
      <header className="hero">
        <span className="subtitle-badge">Ministerio Profético La Roca</span>
        <h1>Canal de Difusión</h1>
      </header>

      {/* BARRA DE CONTROLES (Igual que antes) */}
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
                  <span>Audio</span>
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
                <Play size={18} fill="currentColor" />
              </a>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default App;