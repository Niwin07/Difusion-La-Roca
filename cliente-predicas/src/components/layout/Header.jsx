import { Link, useLocation } from "wouter";
import { Radio, CalendarDays, Sun, Moon } from "lucide-react";
import { EagleMark } from "../icons/EagleMark";
import { IconButton } from "../ui/IconButton";
import { useTheme } from "../../context/ThemeContext";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Prédicas", icon: Radio },
  { href: "/congreso", label: "Congreso", icon: CalendarDays },
];

export function Header() {
  const [location] = useLocation();
  const { tema, toggleTema } = useTheme();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <EagleMark className={styles.brandIcon} />
        <span className={styles.brandText}>
          <span className={styles.brandName}>La Roca</span>
          <span className={styles.brandSub}>Ministerio Profético</span>
        </span>
      </Link>

      <nav className={styles.nav} role="tablist" aria-label="Secciones">
        {NAV_ITEMS.map((item) => {
          const { href, label } = item;
          const Icon = item.icon;
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              role="tab"
              aria-selected={active}
              className={[styles.navBtn, active && styles.active].filter(Boolean).join(" ")}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.actions}>
        <IconButton
          aria-label={tema === "light" ? "Activar tema oscuro" : "Activar tema claro"}
          onClick={toggleTema}
        >
          {tema === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </IconButton>
      </div>
    </header>
  );
}
