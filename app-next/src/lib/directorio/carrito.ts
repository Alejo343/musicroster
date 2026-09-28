// Carrito de selección del comprador — solo en este navegador, igual que hoy
// Directorio.seleccion en assets/js/directorio.js. No es un dato sensible: es un borrador
// de proyectos antes de armar la solicitud, así que no hace falta persistirlo en el servidor.
const KEY = "mr-seleccion-v1";
export const EVENTO_CAMBIO = "mr-seleccion-cambio";

// Cachea el array parseado: useSyncExternalStore exige que la función de snapshot
// devuelva la MISMA referencia mientras el valor no cambie (si no, re-renderiza sin fin).
let crudoCacheado: string | null = null;
let idsCacheados: string[] = [];

function leer(): string[] {
  if (typeof window === "undefined") return idsCacheados;
  const crudo = window.localStorage.getItem(KEY) ?? "[]";
  if (crudo !== crudoCacheado) {
    crudoCacheado = crudo;
    try {
      const v = JSON.parse(crudo);
      idsCacheados = Array.isArray(v) ? v : [];
    } catch {
      idsCacheados = [];
    }
  }
  return idsCacheados;
}

function escribir(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // sin almacenamiento disponible: la selección no persiste, pero no rompe la página
  }
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export const carrito = {
  ids: leer,
  has: (id: string) => leer().includes(id),
  add(id: string) {
    const s = leer();
    if (!s.includes(id)) escribir([...s, id]);
  },
  remove(id: string) {
    escribir(leer().filter((x) => x !== id));
  },
  toggle(id: string) {
    if (carrito.has(id)) carrito.remove(id); else carrito.add(id);
  },
  clear() {
    escribir([]);
  },
};
