import { describe, expect, it } from "vitest";
import { computeResumen, type RegistroResumen } from "./resumen";

const DAY = 86400000;
const hace = (dias: number): Date => new Date(Date.now() - dias * DAY);

function rec(overrides: Partial<RegistroResumen>): RegistroResumen {
  return {
    id: "MR-2026-TEST01",
    creado: hace(1),
    estado: "pendiente",
    tipo: "solista",
    generoPrincipal: "Salsa",
    paisResidencia: "Colombia",
    regionResidencia: "Valle del Cauca",
    ciudadActual: "Cali",
    rangoContratacion: "5m_10m",
    quienRegistra: "artista",
    nombreProyecto: "Prueba",
    ...overrides,
  };
}

describe("computeResumen", () => {
  it("cuenta solo lo que cae dentro del rango de días", () => {
    const todos = [rec({ id: "a", creado: hace(2) }), rec({ id: "b", creado: hace(40) })];
    const r = computeResumen(todos, 30);
    expect(r.kpis.total).toBe(1);
  });

  it("con rango 0 (Todo) incluye todos los registros", () => {
    const todos = [rec({ id: "a", creado: hace(2) }), rec({ id: "b", creado: hace(400) })];
    const r = computeResumen(todos, 0);
    expect(r.kpis.total).toBe(2);
  });

  it("calcula pendientes sin importar el rango elegido", () => {
    const todos = [rec({ id: "a", estado: "pendiente", creado: hace(100) })];
    const r = computeResumen(todos, 7);
    expect(r.kpis.pendientes).toBe(1);
  });

  it("agrupa por estado con el orden pendiente/correccion/aprobado/rechazado", () => {
    const todos = [rec({ id: "a", estado: "aprobado" }), rec({ id: "b", estado: "pendiente" })];
    const r = computeResumen(todos, 30);
    expect(r.estados.map((e) => e.estado)).toEqual(["pendiente", "correccion", "aprobado", "rechazado"]);
    expect(r.estados.find((e) => e.estado === "aprobado")?.n).toBe(1);
  });

  it("separa quién registra: artista vs. terceros", () => {
    const todos = [rec({ id: "a", quienRegistra: "artista" }), rec({ id: "b", quienRegistra: "manager" })];
    const r = computeResumen(todos, 30);
    expect(r.quien).toEqual({ artista: 1, terceros: 1 });
  });

  it("el pico de la gráfica de días nunca es menor que 1 (evita división por cero)", () => {
    const r = computeResumen([], 7);
    expect(r.dias.pico).toBeGreaterThanOrEqual(1);
    expect(r.dias.buckets).toHaveLength(7);
  });
});
