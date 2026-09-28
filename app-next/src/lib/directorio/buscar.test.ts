import { describe, expect, it } from "vitest";
import { buscarPerfiles, conteo, generosConConteo, similares } from "./buscar";
import type { PerfilPublico } from "./perfilPublico";

function perfil(overrides: Partial<PerfilPublico>): PerfilPublico {
  return {
    id: "MR-2026-AAAAAA",
    creado: new Date("2026-01-01"),
    nombre: "Kalé",
    tipo: "solista",
    tipoLabel: "Artista solista",
    individual: true,
    genero: "Urbano",
    otrosGeneros: [],
    acento: "--g-urbano",
    nacionalidad: "Colombia",
    residencia: { pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" },
    origen: { pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" },
    titular: "Andrés Rivas",
    integrantes: [],
    musica: [{ plataforma: "spotify", url: "https://open.spotify.com/artist/kale" }],
    redes: [],
    foto: null,
    rango: "5m_10m",
    rangoLabel: "$5 M – $10 M",
    rangoIndex: 2,
    contacto: { nombre: "Andrés Rivas", whatsapp: "+57 300 000 0000", email: "booking@kale.com" },
    publicado: new Date("2026-01-02"),
    ...overrides,
  };
}

describe("buscarPerfiles", () => {
  const base = [
    perfil({ id: "a", nombre: "Kalé", genero: "Urbano", residencia: { pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" }, origen: { pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" }, rango: "5m_10m", rangoIndex: 2 }),
    perfil({ id: "b", nombre: "Orquesta La Suprema", genero: "Salsa", residencia: { pais: "Colombia", region: "Bogotá D.C.", ciudad: "Bogotá D.C." }, origen: { pais: "Colombia", region: "Bogotá D.C.", ciudad: "Bogotá D.C." }, rango: "mas_100m", rangoIndex: 6 }),
    perfil({ id: "c", nombre: "El Moncho", genero: "Vallenato", residencia: { pais: "Colombia", region: "Cesar", ciudad: "Valledupar" }, origen: { pais: "Colombia", region: "Cesar", ciudad: "Valledupar" }, rango: "segun_evento", rangoIndex: 7 }),
  ];

  it("filtra por texto en nombre y ciudad", () => {
    expect(buscarPerfiles(base, { q: "cali" }).map((p) => p.id)).toEqual(["a"]);
  });

  it("filtra por tipo", () => {
    const r = buscarPerfiles(base, { tipos: ["solista"] });
    expect(r.every((p) => p.tipo === "solista")).toBe(true);
  });

  it("filtra por género principal o asociado", () => {
    const conAsociado = [perfil({ id: "d", genero: "Pop", otrosGeneros: ["Salsa"] })];
    expect(buscarPerfiles(conAsociado, { genero: "Salsa" }).map((p) => p.id)).toEqual(["d"]);
  });

  it("filtra por región de residencia", () => {
    expect(buscarPerfiles(base, { region: "Cesar" }).map((p) => p.id)).toEqual(["c"]);
  });

  it("filtra por región de origen cuando territorio=origen", () => {
    const conOrigenDistinto = [perfil({ id: "e", origen: { pais: "Colombia", region: "Chocó", ciudad: "Quibdó" } })];
    expect(buscarPerfiles(conOrigenDistinto, { territorio: "origen", region: "Chocó" }).map((p) => p.id)).toEqual(["e"]);
    expect(buscarPerfiles(conOrigenDistinto, { territorio: "residencia", region: "Chocó" })).toHaveLength(0);
  });

  it("presupuesto: excluye por encima del tope pero respeta segúnEvento", () => {
    const tope1 = buscarPerfiles(base, { presupuesto: "1" }); // Hasta $5 M -> índice tope 1
    expect(tope1.map((p) => p.id).sort()).toEqual(["c"].sort()); // solo el "según evento" (si segunEvento no es false)
  });

  it("presupuesto: excluye 'según evento' si segunEvento=false", () => {
    const r = buscarPerfiles(base, { presupuesto: "1", segunEvento: false });
    expect(r).toHaveLength(0);
  });

  it("orden por nombre A-Z", () => {
    const r = buscarPerfiles(base, { orden: "nombre" });
    expect(r.map((p) => p.nombre)).toEqual(["El Moncho", "Kalé", "Orquesta La Suprema"]);
  });

  it("orden por rango ascendente deja 'según evento' al final", () => {
    const r = buscarPerfiles(base, { orden: "rango_asc" });
    expect(r[r.length - 1].id).toBe("c");
  });
});

describe("conteo / generosConConteo", () => {
  it("cuenta ocurrencias y ordena de mayor a menor", () => {
    const perfiles = [perfil({ genero: "Salsa" }), perfil({ genero: "Salsa" }), perfil({ genero: "Pop" })];
    expect(conteo(perfiles, (p) => p.genero)).toEqual([["Salsa", 2], ["Pop", 1]]);
  });

  it("generosConConteo incluye principal y asociados, pero solo géneros que son principales en algún perfil", () => {
    const perfiles = [perfil({ genero: "Salsa", otrosGeneros: ["Urbano"] }), perfil({ genero: "Pop" })];
    const g = generosConConteo(perfiles);
    expect(g.find(([nombre]) => nombre === "Salsa")).toBeTruthy();
    expect(g.find(([nombre]) => nombre === "Urbano")).toBeFalsy(); // nunca es principal
  });
});

describe("similares", () => {
  it("prioriza mismo acento + mismo género + misma región", () => {
    const base = perfil({ id: "base", acento: "--g-urbano", genero: "Urbano", residencia: { pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" } });
    const igual = perfil({ id: "igual", acento: "--g-urbano", genero: "Urbano", residencia: { pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" } });
    const distinto = perfil({ id: "distinto", acento: "--g-rock", genero: "Rock", residencia: { pais: "Colombia", region: "Bogotá D.C.", ciudad: "Bogotá D.C." } });
    const r = similares([base, igual, distinto], "base");
    expect(r.map((p) => p.id)).toEqual(["igual"]);
  });

  it("devuelve vacío si el perfil base no existe", () => {
    expect(similares([perfil({ id: "x" })], "no-existe")).toEqual([]);
  });
});
