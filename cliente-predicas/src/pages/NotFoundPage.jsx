import { Link } from "wouter";
import { Compass } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import buttonStyles from "../components/ui/Button.module.css";

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Página no encontrada"
      description="La dirección a la que intentaste entrar no existe."
      action={
        <Link href="/" className={[buttonStyles.btn, buttonStyles.primary].join(" ")}>
          Volver al inicio
        </Link>
      }
    />
  );
}
