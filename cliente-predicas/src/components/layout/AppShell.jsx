import { Header } from "./Header";
import { EagleWatermark } from "../icons/EagleMark";
import { ToastViewport } from "../ui/ToastViewport";
import { AudioPlayerHost } from "../player/AudioPlayerHost";
import { useAudioPlayer } from "../../context/AudioPlayerContext";
import styles from "./AppShell.module.css";

export function AppShell({ children }) {
  const { predicaActual } = useAudioPlayer();

  return (
    <div className={styles.shell}>
      <div className={styles.glow} aria-hidden="true" />
      <EagleWatermark className={styles.watermark} />
      <Header />
      <main className={[styles.main, predicaActual && styles.withPlayer].filter(Boolean).join(" ")}>
        {children}
      </main>
      <footer className={styles.footer}>© {new Date().getFullYear()} Ministerio Profético La Roca</footer>
      <AudioPlayerHost />
      <ToastViewport />
    </div>
  );
}
