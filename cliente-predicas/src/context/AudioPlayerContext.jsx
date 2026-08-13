import { createContext, useContext, useState } from "react";

const AudioPlayerContext = createContext(null);

// Estado global de "qué se está reproduciendo ahora" — cualquier pantalla
// (prédicas, congreso) puede disparar reproducción sin prop-drilling, y el
// mini-player persiste al cambiar de sección.
export function AudioPlayerProvider({ children }) {
  const [predicaActual, setPredicaActual] = useState(null);

  const reproducir = (predica) => setPredicaActual(predica);
  const cerrar = () => setPredicaActual(null);

  return (
    <AudioPlayerContext.Provider value={{ predicaActual, reproducir, cerrar }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook vive junto a su Provider a propósito
export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer debe usarse dentro de <AudioPlayerProvider>");
  return ctx;
}
