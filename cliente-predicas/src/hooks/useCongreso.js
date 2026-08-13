import { useCallback, useEffect, useState } from "react";
import { getCongreso } from "../api/congreso";
import { ApiError } from "../api/client";

export const DIAS_CONFIG = [
  { key: "jueves", label: "Día 1", nombre: "Jueves" },
  { key: "viernes", label: "Día 2", nombre: "Viernes" },
  { key: "sabado", label: "Día 3", nombre: "Sábado" },
];

export function useCongreso() {
  const [sesiones, setSesiones] = useState({});
  const [diaActivo, setDiaActivo] = useState("jueves");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getCongreso();
      setSesiones(data);
    } catch (err) {
      // ApiError trae un mensaje del servidor ya pensado para mostrar;
      // cualquier otro error (red caída, etc.) usa un mensaje genérico
      // en vez del texto crudo del navegador ("Failed to fetch").
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const sesionesDia = sesiones[diaActivo] || [];
  const predicas = sesionesDia.filter((s) => s.tipo === "predica");
  const talleres = sesionesDia.filter((s) => s.tipo === "taller");
  const totalPredicas = Object.values(sesiones).flat().filter((s) => s.tipo === "predica").length;
  const totalTalleres = Object.values(sesiones).flat().filter((s) => s.tipo === "taller").length;

  return {
    cargando,
    error,
    diaActivo,
    setDiaActivo,
    sesiones,
    predicas,
    talleres,
    totalPredicas,
    totalTalleres,
    recargar: cargar,
  };
}
