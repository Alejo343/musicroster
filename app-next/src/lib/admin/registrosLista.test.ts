import { describe, expect, it } from "vitest";
import { calcularLista, filtrosPorDefecto, opcionesFiltro, type RegistroLista } from "./registrosLista";

function rec(overrides: Partial<RegistroLista>): RegistroLista {
  return {
    id: "MR-2026-AAAAAA",
    creado: new Date("2026-01-01"),
    estado: "pendiente",
    tipo: "solista",
    genero: "Salsa",
    region: "Valle del Cauca",
    rango: "5m_10m",
    nombreProyecto: "Kalé",
    nombreCompleto: "Andrés Rivas",
    contactoNombre: "Andrés Rivas",
    contactoEmail: "booking@kale.com",
    ciudad: "Cali",
    miembros: [],
    ...overrides,
  };
}

describe("calcularLista", () => {
  it("filtra por estado", () => {
    const todos = [rec({ id: "a", estado: "pendiente" }), rec({ id: "b", estado: "aprobado" })];
    const r = calcularLista(todos, { ...filtrosPorDefecto(), estado: "aprobado" });
    expect(r.visibles.map((x) => x.id)).toEqual(["b"]);
  });

  it("cuenta por estado considerando los demás filtros pero no el de estado", () => {
    const todos = [rec({ id: "a", estado: "pendiente", tipo: "solista" }), rec({ id: "b", estado: "aprobado", tipo: "dj" })];
    const r = calcularLista(todos, { ...filtrosPorDefecto(), tipo: "solista" });
    expect(r.counts.todos).toBe(1);
    expect(r.counts.pendiente).toBe(1);
    expect(r.counts.aprobado).toBeUndefined();
  });

  it("busca por texto en varios campos, con todas las palabras requeridas", () => {
    const todos = [rec({ id: "a", nombreProyecto: "Kalé", ciudad: "Cali" }), rec({ id: "b", nombreProyecto: "Otro", ciudad: "Bogotá" })];
    const r = calcularLista(todos, { ...filtrosPorDefecto(), q: "kale cali" });
    expect(r.visibles.map((x) => x.id)).toEqual(["a"]);
  });

  it("ignora tildes y mayúsculas en la búsqueda", () => {
    const todos = [rec({ id: "a", nombreProyecto: "Ñañas del Río" })];
    const r = calcularLista(todos, { ...filtrosPorDefecto(), q: "nanas del rio" });
    expect(r.visibles.map((x) => x.id)).toEqual(["a"]);
  });

  it("pagina de a 15 y recorta la página fuera de rango", () => {
    const todos = Array.from({ length: 20 }, (_, i) => rec({ id: `r${i}`, creado: new Date(2026, 0, i + 1) }));
    const r = calcularLista(todos, { ...filtrosPorDefecto(), page: 99 });
    expect(r.pages).toBe(2);
    expect(r.page).toBe(2);
    expect(r.slice).toHaveLength(5);
  });

  it("ordena por nombre ascendente cuando se pide", () => {
    const todos = [rec({ id: "a", nombreProyecto: "Zeta" }), rec({ id: "b", nombreProyecto: "Alfa" })];
    const r = calcularLista(todos, { ...filtrosPorDefecto(), sort: "nombre", dir: 1 });
    expect(r.visibles.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("opcionesFiltro", () => {
  it("devuelve géneros y regiones únicos y ordenados", () => {
    const todos = [rec({ genero: "Rock", region: "Bogotá D.C." }), rec({ genero: "Salsa", region: "Bogotá D.C." })];
    const o = opcionesFiltro(todos);
    expect(o.generos).toEqual(["Rock", "Salsa"]);
    expect(o.regiones).toEqual(["Bogotá D.C."]);
  });
});
