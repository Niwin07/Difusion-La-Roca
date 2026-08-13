import { useState } from "react";
import { verificarPassword } from "../api/admin";
import { ApiError } from "../api/client";

// La contraseña se valida contra el servidor de verdad (no hay ningún
// valor hardcodeado en el cliente) — ver ADMIN_PASSWORD en el backend.
export function useAdminAuth() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verificando, setVerificando] = useState(false);

  const intentarEntrar = async (intento) => {
    if (!intento.trim() || verificando) return;
    setVerificando(true);
    setError("");
    try {
      await verificarPassword(intento);
      setPassword(intento);
      setAutenticado(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError("El panel de administración no está configurado en el servidor (falta ADMIN_PASSWORD).");
      } else if (err instanceof ApiError && err.status === 401) {
        setError("Contraseña incorrecta. Volvé a intentarlo.");
      } else {
        setError("No se pudo conectar con el servidor. Probá de nuevo.");
      }
    } finally {
      setVerificando(false);
    }
  };

  const salir = () => {
    setAutenticado(false);
    setPassword("");
  };

  return { autenticado, password, error, verificando, intentarEntrar, salir, clearError: () => setError("") };
}
