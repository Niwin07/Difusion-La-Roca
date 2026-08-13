import { useToast } from "../context/ToastContext";

export function useShare() {
  const showToast = useToast();

  return async ({ titulo, predicador, url }) => {
    const texto = `🦅 ${titulo}\n👤 ${predicador}\n🔗 ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch {
        // Share sheet cancelado/no soportado — caemos al portapapeles.
      }
    }
    navigator.clipboard.writeText(url);
    showToast("Link copiado al portapapeles", "success");
  };
}
