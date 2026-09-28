// Cálculo puro del dashboard de "Resumen" — misma lógica que pageResumen() en
// assets/js/admin.js, separada de Prisma para poder probarla con datos de ejemplo.
import { TIPOS_PROYECTO, RANGOS_CONTRATACION, rangoLabel } from "@/lib/catalogos";
import { regionDe } from "./formato";

const DAY = 86400000;

export type RegistroResumen = {
  id: string;
  creado: Date;
  estado: "pendiente" | "correccion" | "aprobado" | "rechazado";
  tipo: string;
  generoPrincipal: string;
  paisResidencia: string;
  regionResidencia: string;
  ciudadActual: string;
  rangoContratacion: string;
  quienRegistra: string;
  nombreProyecto: string;
};

function contarPor<T>(lista: T[], clave: (x: T) => string) {
  const m = new Map<string, number>();
  lista.forEach((r) => { const k = clave(r); m.set(k, (m.get(k) ?? 0) + 1); });
  return m;
}

export function computeResumen(todos: RegistroResumen[], rangeDays: number) {
  const now = Date.now();
  const edad = (r: RegistroResumen) => now - r.creado.getTime();
  const inRange = rangeDays ? todos.filter((r) => edad(r) < rangeDays * DAY) : todos;
  const prev = rangeDays ? todos.filter((r) => edad(r) >= rangeDays * DAY && edad(r) < 2 * rangeDays * DAY) : [];

  const pendientes = todos.filter((r) => r.estado === "pendiente");
  const masAntiguoFecha = pendientes.reduce((m, r) => (r.creado.getTime() < m.getTime() ? r.creado : m), new Date(now));
  const publicados = inRange.filter((r) => r.estado === "aprobado").length;
  const delta = rangeDays && prev.length ? Math.round(((inRange.length - prev.length) / prev.length) * 100) : null;

  // Registros por día
  const dias = rangeDays || Math.ceil(todos.reduce((m, r) => Math.max(m, edad(r)), 0) / DAY) + 1;
  const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: dias }, (_, i) => ({ fecha: new Date(inicio.getTime() - (dias - 1 - i) * DAY), n: 0 }));
  inRange.forEach((r) => {
    const d = new Date(r.creado); d.setHours(0, 0, 0, 0);
    const i = Math.round((d.getTime() - buckets[0].fecha.getTime()) / DAY);
    if (buckets[i]) buckets[i].n++;
  });
  const pico = Math.max(1, ...buckets.map((b) => b.n));

  // Estados
  const est = contarPor(inRange, (r) => r.estado);
  const ordenEstados = ["pendiente", "correccion", "aprobado", "rechazado"] as const;
  const totalEstados = inRange.length || 1;

  // Tipo / género / territorio / rango
  const tipos = contarPor(inRange, (r) => r.tipo);
  const porTipo = Object.entries(TIPOS_PROYECTO)
    .filter(([k]) => tipos.get(k))
    .map(([k, l]) => [k, l, tipos.get(k)!] as const)
    .sort((a, b) => b[2] - a[2]);

  const generos = [...contarPor(inRange, (r) => r.generoPrincipal)].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const territorios = [...contarPor(inRange, regionDe)].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const rangos = contarPor(inRange, (r) => r.rangoContratacion);
  const porRango = RANGOS_CONTRATACION.map(([k, l]) => [k, l, rangos.get(k) ?? 0] as const);

  const terceros = inRange.filter((r) => r.quienRegistra !== "artista").length;

  return {
    periodo: rangeDays ? `últimos ${rangeDays} días` : "desde el lanzamiento",
    kpis: {
      total: inRange.length,
      totalDelta: delta,
      pendientes: pendientes.length,
      pendienteMasAntiguoFecha: masAntiguoFecha,
      publicados,
      publicadosPct: inRange.length ? Math.round((publicados / inRange.length) * 100) : 0,
    },
    dias: { buckets, pico },
    estados: ordenEstados.map((e) => ({ estado: e, n: est.get(e) ?? 0, pct: Math.round(((est.get(e) ?? 0) / totalEstados) * 100) })),
    porTipo,
    porGenero: generos.map(([k, n]) => [k, k, n] as const),
    porTerritorio: territorios.map(([k, n]) => [k, k, n] as const),
    porRango: porRango.map(([k, l, n]) => [k, rangoLabel(k) === l ? l : l, n] as const),
    quien: { artista: inRange.length - terceros, terceros },
  };
}
