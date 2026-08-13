import { useLocalStorage } from "./useLocalStorage";

export function useFavorites(key) {
  const [favoritos, setFavoritos] = useLocalStorage(key, []);

  const toggle = (id) => {
    setFavoritos((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  return [favoritos, toggle];
}
