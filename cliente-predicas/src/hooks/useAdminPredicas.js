import { useCallback, useEffect, useMemo, useState } from "react";
import { getPredicas, updatePredica } from "../api/predicas";
import { useToast } from "../context/ToastContext";

export function useAdminPredicas(password) {
  const showToast = useToast();
  const [predicas, setPredicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "fecha", dir: "desc" });
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getPredicas();
      setPredicas(data);
    } catch {
      showToast("No se pudo cargar la lista de mensajes", "error");
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleSort = (key) => {
    setSortConfig((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    const lista = predicas.filter(
      (p) => p.titulo?.toLowerCase().includes(q) || p.predicador?.toLowerCase().includes(q) || p.fecha?.includes(q),
    );
    lista.sort((a, b) => {
      let va = a[sortConfig.key] ?? "";
      let vb = b[sortConfig.key] ?? "";
      if (sortConfig.key === "fecha") {
        va = new Date(va);
        vb = new Date(vb);
      } else {
        va = va.toString().toLowerCase();
        vb = vb.toString().toLowerCase();
      }
      if (va < vb) return sortConfig.dir === "asc" ? -1 : 1;
      if (va > vb) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return lista;
  }, [predicas, busqueda, sortConfig]);

  const predicadoresUnicos = useMemo(() => new Set(predicas.map((p) => p.predicador)).size, [predicas]);

  const empezarEdicion = (predica) => {
    setEditandoId(predica.id);
    setForm({ ...predica, fecha: new Date(predica.fecha).toISOString().split("T")[0] });
  };

  const cancelarEdicion = () => setEditandoId(null);

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await updatePredica(editandoId, { ...form, password });
      showToast("Guardado con éxito", "success");
      setEditandoId(null);
      await cargar();
    } catch (err) {
      showToast(err.message || "Error al guardar", "error");
    } finally {
      setGuardando(false);
    }
  };

  return {
    predicas,
    predicasFiltradas: filtradas,
    predicadoresUnicos,
    cargando,
    busqueda,
    setBusqueda,
    sortConfig,
    toggleSort,
    editandoId,
    form,
    setForm,
    empezarEdicion,
    cancelarEdicion,
    guardarCambios,
    guardando,
    recargar: cargar,
  };
}
