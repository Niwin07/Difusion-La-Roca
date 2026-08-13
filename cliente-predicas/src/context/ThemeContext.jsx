import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Nota: se guarda como string plano en localStorage (no JSON) a propósito
// — así conserva el valor que ya tenían guardado los usuarios de la
// versión anterior de la app ("light"/"dark").
function leerTemaInicial() {
  const guardado = localStorage.getItem("tema");
  if (guardado === "light" || guardado === "dark") return guardado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(leerTemaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  const toggleTema = () => setTema((prev) => (prev === "light" ? "dark" : "light"));

  return <ThemeContext.Provider value={{ tema, toggleTema }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook vive junto a su Provider a propósito
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
