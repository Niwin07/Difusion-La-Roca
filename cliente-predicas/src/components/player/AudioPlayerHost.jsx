import { useAudioPlayer } from "../../context/AudioPlayerContext";
import { AudioPlayer } from "./AudioPlayer";

export function AudioPlayerHost() {
  const { predicaActual, cerrar } = useAudioPlayer();
  if (!predicaActual) return null;
  return <AudioPlayer key={predicaActual.id} predica={predicaActual} onClose={cerrar} />;
}
