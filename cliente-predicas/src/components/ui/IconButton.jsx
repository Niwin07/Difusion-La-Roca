import { forwardRef } from "react";
import styles from "./IconButton.module.css";

// aria-label es obligatorio a propósito: un botón solo-ícono sin nombre
// accesible es el error de a11y más común de este tipo de componente.
export const IconButton = forwardRef(function IconButton(
  { variant = "default", size = "md", active = false, className = "", "aria-label": ariaLabel, ...props },
  ref,
) {
  if (import.meta.env.DEV && !ariaLabel) {
    console.warn("IconButton sin aria-label — agregalo para que sea accesible.");
  }

  const classes = [
    styles.btn,
    size === "sm" && styles.sm,
    variant === "solid" && styles.solid,
    active && styles.active,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Con href se comporta como un link real (necesario para <a download>,
  // que depende del comportamiento nativo del navegador) en vez de un
  // <button> — mismo look, semántica correcta.
  if (props.href) {
    return <a ref={ref} className={classes} aria-label={ariaLabel} {...props} />;
  }

  return <button ref={ref} type="button" className={classes} aria-label={ariaLabel} {...props} />;
});
