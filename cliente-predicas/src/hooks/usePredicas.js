import { useCallback, useEffect, useMemo, useState } from "react";
import { getPredicas } from "../api/predicas";
import { PREDICADORES_OFICIALES as PREDICADORES_BASE } from "../predicadores";

const PREDICADORES_OFICIALES = [...PREDICADORES_BASE, "Otros"];
const ITEMS_PER_PAGE = 9;

export function usePredicas() {
  const [predicas, setPredicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [predicador, setPredicador] = useState("Todos");
  const [anio, setAnio] = useState("Todos");
  const [filtroFecha, setFiltroFecha] = useState("Todos");
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    try {
      const data = await getPredicas();
      setPredicas(data);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, predicador, anio, filtroFecha]);

  const listas = useMemo(() => {
    const anios = [...new Set(predicas.map((p) => new Date(p.fecha).getFullYear()))].sort((a, b) => b - a);
    const predicadoresEnDB = new Set(predicas.map((p) => p.predicador));
    const predicadores = PREDICADORES_OFICIALES.filter((p) => predicadoresEnDB.has(p) || p === "Otros");
    return { anios, predicadores };
  }, [predicas]);

  const filtradas = useMemo(() => {
    const ahora = Date.now();
    const hace30Dias = ahora - 30 * 24 * 60 * 60 * 1000;
    const inicioAnioActual = new Date(new Date().getFullYear(), 0, 1).getTime();
    const q = busqueda.toLowerCase();

    return predicas
      .filter((p) => {
        const fechaPredica = new Date(p.fecha);
        if (filtroFecha === "ultimos30" && fechaPredica.getTime() < hace30Dias) return false;
        if (filtroFecha === "esteAnio" && fechaPredica.getTime() < inicioAnioActual) return false;

        const anioCoincide = anio === "Todos" || fechaPredica.getFullYear() === parseInt(anio, 10);

        const predicadorCoincide =
          predicador === "Todos"
            ? true
            : predicador === "Otros"
              ? !PREDICADORES_OFICIALES.filter((n) => n !== "Otros").includes(p.predicador)
              : p.predicador === predicador;

        const textoCoincide =
          q === "" || p.titulo.toLowerCase().includes(q) || p.predicador.toLowerCase().includes(q);

        return anioCoincide && predicadorCoincide && textoCoincide;
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [predicas, anio, predicador, busqueda, filtroFecha]);

  const totalPaginas = Math.ceil(filtradas.length / ITEMS_PER_PAGE) || 1;
  const visibles = filtradas.slice((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    if (predicas.length === 0) return null;
    const masReciente = predicas.reduce((max, p) => (new Date(p.fecha) > new Date(max.fecha) ? p : max));
    return { total: predicas.length, ultimoAnio: new Date(masReciente.fecha).getFullYear() };
  }, [predicas]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setPredicador("Todos");
    setAnio("Todos");
    setFiltroFecha("Todos");
  };

  return {
    cargando,
    error,
    stats,
    listas,
    filtros: { busqueda, predicador, anio, filtroFecha },
    setBusqueda,
    setPredicador,
    setAnio,
    setFiltroFecha,
    limpiarFiltros,
    predicasVisibles: visibles,
    totalFiltradas: filtradas.length,
    pagina,
    setPagina,
    totalPaginas,
    itemsPorPagina: ITEMS_PER_PAGE,
    recargar: cargar,
  };
}
