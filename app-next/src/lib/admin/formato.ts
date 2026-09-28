// Formato compartido del panel de administración — mismas reglas que hoy assets/js/admin.js.
export const fmtDate = (fecha: Date) => {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (fecha.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return fecha.toLocaleDateString("es-CO", opts).replace(/ de /g, " ");
};

export const fmtDateTime = (fecha: Date) =>
  fecha.toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function ago(fecha: Date): string {
  const m = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export function initials(nombre: string): string {
  return nombre
    .replace(/^(los|las|la|el|dj|dúo|orquesta|grupo|combo|conjunto|colectivo)\s+/i, "")
    .split(/\s+/)
    .filter((w) => !/^(y|de|del|la|las|los|el|&)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const mask = (n: string) => `•••• ${String(n).slice(-4)}`;

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export const lugar = (r: { ciudadActual: string; paisResidencia: string; regionResidencia: string }) =>
  `${r.ciudadActual}, ${r.paisResidencia === "Colombia" ? r.regionResidencia : r.paisResidencia}`;

export const regionDe = (r: { paisResidencia: string; regionResidencia: string }) =>
  r.paisResidencia === "Colombia" ? r.regionResidencia : r.paisResidencia;
