import { useState } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { TextField } from "../ui/Field";
import { Button } from "../ui/Button";
import styles from "./AdminLogin.module.css";

export function AdminLogin({ error, verificando, onSubmit, clearError }) {
  const [valor, setValor] = useState("");

  return (
    <div className={styles.screen}>
      <form
        className={styles.card}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(valor);
        }}
      >
        <div className={styles.icon}>
          <Lock size={22} />
        </div>
        <h1 className={styles.title}>Acceso restringido</h1>
        <p className={styles.subtitle}>Ingresá la contraseña de administración para gestionar las prédicas.</p>

        <div className={styles.form}>
          <TextField
            id="admin-password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            autoFocus
            disabled={verificando}
            value={valor}
            error={error}
            onChange={(e) => {
              setValor(e.target.value);
              if (error) clearError();
            }}
          />

          <div className={styles.actions}>
            <Button type="submit" variant="primary" block loading={verificando}>
              {verificando ? "Verificando..." : "Entrar"}
            </Button>
            <Link href="/" className={styles.back}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
