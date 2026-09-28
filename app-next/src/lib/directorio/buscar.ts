// Búsqueda, conteo y "similares" del directorio — misma lógica que hoy assets/js/directorio.js,
// separada de Prisma para poder probarla con datos de ejemplo.
import type { PerfilPublico } from "./perfilPublico";

const norm = (s: string) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export type FiltrosBusqueda = {
  q?: string;
  tipos?: string[];
  genero?: string;
  territorio?: "residencia" | "origen";
  region?: string;
  presupuesto?: string; // índice de PRESUPUESTOS, como string
  segunEvento?: boolean;
  orden?: "relevancia" | "recientes" | "nombre" | "rango_asc" | "rango_desc";
};

const texto = (p: PerfilPublico) =>
  norm([p.nombre, p.titular, p.genero, p.residencia.ciudad, p.residencia.region, p.origen.ciudad].concat(p.integrantes.map((m) => m.nombre)).join(" "));

export function buscarPerfiles(perfiles: PerfilPublico[], f: FiltrosBusqueda = {}): PerfilPublico[] {
  const q = norm(f.q ?? "");
  const tope = f.presupuesto === "" || f.presupuesto == null ? null : Number(f.presupuesto);
  const donde = f.territorio === "origen" ? "origen" : "residencia";

  let out = perfiles.filter((p) => {
    if (q && !texto(p).includes(q)) return false;
    if (f.tipos && f.tipos.length && !f.tipos.includes(p.tipo)) return false;
    if (f.genero && p.genero !== f.genero && !p.otrosGeneros.includes(f.genero)) return false;
    if (f.region && p[donde].region !== f.region) return false;
    if (tope != null) {
      if (p.rango === "segun_evento") return f.segunEvento !== false;
      if (p.rangoIndex > tope) return false;
    }
    return true;
  });

  const score = (p: PerfilPublico) => { const n = norm(p.nombre); return n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2; };
  const asc = (p: PerfilPublico) => (p.rango === "segun_evento" ? 99 : p.rangoIndex);
  const desc = (p: PerfilPublico) => (p.rango === "segun_evento" ? -1 : p.rangoIndex);
  const porNombre = (a: PerfilPublico, b: PerfilPublico) => a.nombre.localeCompare(b.nombre, "es");
  const ordenadores: Record<string, (a: PerfilPublico, b: PerfilPublico) => number> = {
    recientes: (a, b) => b.publicado.getTime() - a.publicado.getTime(),
    nombre: porNombre,
    rango_asc: (a, b) => asc(a) - asc(b) || porNombre(a, b),
    rango_desc: (a, b) => desc(b) - desc(a) || porNombre(a, b),
  };
  const orden = ordenadores[f.orden ?? ""] ?? ((a: PerfilPublico, b: PerfilPublico) => b.publicado.getTime() - a.publicado.getTime());
  out = out.slice().sort(orden);

  if (!f.orden || f.orden === "relevancia") {
    if (q) out.sort((a, b) => score(a) - score(b));
    if (f.genero) out.sort((a, b) => Number(a.genero !== f.genero) - Number(b.genero !== f.genero));
  }
  return out;
}

export function conteo<T>(perfiles: PerfilPublico[], fn: (p: PerfilPublico) => T | T[]): [string, number][] {
  const c = new Map<string, number>();
  perfiles.forEach((p) => {
    const valores = ([] as T[]).concat(fn(p) as never);
    valores.forEach((v) => { if (v) c.set(String(v), (c.get(String(v)) ?? 0) + 1); });
  });
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

export function generosConConteo(perfiles: PerfilPublico[]): [string, number][] {
  const principales = new Set(perfiles.map((p) => p.genero));
  return conteo(perfiles, (p) => [...new Set([p.genero, ...p.otrosGeneros])]).filter(([g]) => principales.has(g));
}

export function similares(perfiles: PerfilPublico[], id: string, n = 4): PerfilPublico[] {
  const base = perfiles.find((p) => p.id === id);
  if (!base) return [];
  const puntos = (p: PerfilPublico) =>
    (p.acento === base.acento ? 2 : 0) + (p.genero === base.genero ? 2 : 0) + (p.residencia.region === base.residencia.region ? 1 : 0);
  return perfiles
    .filter((p) => p.id !== id)
    .map((p) => [p, puntos(p)] as const)
    .filter(([, pts]) => pts > 0)
    .sort((a, b) => b[1] - a[1] || a[0].nombre.localeCompare(b[0].nombre, "es"))
    .slice(0, n)
    .map(([p]) => p);
}
