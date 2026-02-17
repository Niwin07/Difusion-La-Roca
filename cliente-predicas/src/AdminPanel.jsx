import { useState } from 'react';
import { Save, X, RefreshCw, Edit2, Calendar, User, Type } from 'lucide-react';
import './App.css'; // Usamos los mismos estilos

export const AdminPanel = ({ predicas, onCerrar, onRecargar, password }) => {
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Iniciar edición
  const empezarEdicion = (predica) => {
    setEditandoId(predica.id);
    // Convertir fecha ISO a YYYY-MM-DD para el input
    const fechaFormat = new Date(predica.fecha).toISOString().split('T')[0];
    setForm({ ...predica, fecha: fechaFormat });
  };

  // Guardar cambios
  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/predicas/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password })
      });

      if (res.ok) {
        alert("✅ Guardado con éxito");
        setEditandoId(null);
        onRecargar(); // Recargar la lista principal
      } else {
        alert("❌ Error al guardar (revisá la contraseña)");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="admin-overlay">
      <div className="admin-container">
        
        {/* HEADER ADMIN */}
        <div className="admin-header">
          <h2>🛠️ Panel de Control</h2>
          <div className="admin-actions">
            <button onClick={onRecargar} className="admin-btn sync">
              <RefreshCw size={18} /> Sincronizar Drive
            </button>
            <button onClick={onCerrar} className="admin-btn close">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* TABLA DE EDICIÓN */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Predicador</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {predicas.map((predica) => (
                <tr key={predica.id} className={editandoId === predica.id ? 'editing-row' : ''}>
                  
                  {/* MODO EDICIÓN */}
                  {editandoId === predica.id ? (
                    <>
                      <td>
                        <input 
                          type="date" 
                          className="admin-input"
                          value={form.fecha}
                          onChange={e => setForm({...form, fecha: e.target.value})}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="admin-input"
                          value={form.titulo}
                          onChange={e => setForm({...form, titulo: e.target.value})}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="admin-input"
                          value={form.predicador}
                          onChange={e => setForm({...form, predicador: e.target.value})}
                        />
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={guardarCambios} disabled={guardando} className="save-btn">
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditandoId(null)} className="cancel-btn">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    /* MODO LECTURA */
                    <>
                      <td>{new Date(predica.fecha).toLocaleDateString('es-AR')}</td>
                      <td className="fw-bold">{predica.titulo}</td>
                      <td>{predica.predicador}</td>
                      <td>
                        <button onClick={() => empezarEdicion(predica)} className="edit-btn">
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};