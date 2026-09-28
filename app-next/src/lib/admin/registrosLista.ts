// Filtrado, orden y paginación de "Registros" — misma lógica que pageRegistros() en
// assets/js/admin.js, separada de Prisma para poder probarla con datos de ejemplo.
import { ESTADOS_REGISTRO } from "@/lib/catalogos";
import { regionDe } from "./formato";

const PER_PAGE = 15;
const norm = (s: string) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export type RegistroLista = {
  id: string;
  creado: Date;
  estado: keyof typeof ESTADOS_REGISTRO;
  tipo: string;
  genero: string;
  region: string;
  rango: string;
  nombreProyecto: string;
  nombreCompleto: string | null;
  contactoNombre: string;
  contactoEmail: string;
  ciudad: string;
  miembros: string[];
};

export type FiltrosLista = {
  estado: string;
  q: string;
  tipo: string;
  genero: string;
  region: string;
  rango: string;
  sort: "creado" | "nombre" | "estado";
  dir: 1 | -1;
  page: number;
};

export const filtrosPorDefecto = (): FiltrosLista => ({
  estado: "todos", q: "", tipo: "todos", genero: "todos", region: "todos", rango: "todos", sort: "creado", dir: -1, page: 1,
});

function coincide(r: RegistroLista, f: FiltrosLista): boolean {
  if (f.tipo !== "todos" && r.tipo !== f.tipo) return false;
  if (f.genero !== "todos" && r.genero !== f.genero) return false;
  if (f.region !== "todos" && r.region !== f.region) return false;
  if (f.rango !== "todos" && r.rango !== f.rango) return false;
  if (f.q) {
    const hay = norm([r.id, r.nombreProyecto, r.nombreCompleto, r.contactoNombre, r.contactoEmail, r.ciudad, ...r.miembros].join(" "));
    if (!norm(f.q).split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

const ORDEN_ESTADO: Record<string, number> = { pendiente: 0, correccion: 1, aprobado: 2, rechazado: 3 };
const SORTERS: Record<FiltrosLista["sort"], (a: RegistroLista, b: RegistroLista) => number> = {
  creado: (a, b) => a.creado.getTime() - b.creado.getTime(),
  nombre: (a, b) => a.nombreProyecto.localeCompare(b.nombreProyecto, "es"),
  estado: (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.creado.getTime() - a.creado.getTime(),
};

export function calcularLista(todos: RegistroLista[], f: FiltrosLista) {
  const base = todos.filter((r) => coincide(r, f));

  const counts: Record<string, number> = { todos: base.length };
  base.forEach((r) => { counts[r.estado] = (counts[r.estado] ?? 0) + 1; });

  const visibles = base.filter((r) => f.estado === "todos" || r.estado === f.estado).sort((a, b) => SORTERS[f.sort](a, b) * f.dir);
  const pages = Math.max(1, Math.ceil(visibles.length / PER_PAGE));
  const page = Math.min(Math.max(1, f.page), pages);
  const slice = visibles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return { counts, visibles, pages, page, slice, perPage: PER_PAGE };
}

export function opcionesFiltro(todos: RegistroLista[]) {
  const unicos = (arr: string[]) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, "es"));
  return {
    generos: unicos(todos.map((r) => r.genero)),
    regiones: unicos(todos.map((r) => r.region)),
  };
}

export { regionDe };
