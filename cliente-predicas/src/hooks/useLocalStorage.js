import { useCallback, useState } from "react";

// Estado persistido en localStorage. Uso deliberadamente simple (lee una
// vez al montar, escribe en cada set) — no hace falta sincronizar entre
// pestañas para lo que usa esta app (tema, favoritos, progreso de audio).
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // localStorage lleno o bloqueado (modo privado) — seguimos en memoria.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
