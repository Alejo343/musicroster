import { describe, expect, it } from "vitest";
import { registroSchema, identidadDe } from "./registro";

const base = {
  tipo: "solista" as const,
  nombreProyecto: "Kalé",
  generoPrincipal: "Urbano",
  otrosGeneros: [],
  nacionalidad: "Colombia",
  paisResidencia: "Colombia",
  regionResidencia: "Valle del Cauca",
  ciudadActual: "Cali",
  paisOrigen: "Colombia",
  regionOrigen: "Valle del Cauca",
  ciudadOrigen: "Cali",
  nombreCompleto: "Andrés Rivas Mosquera",
  tipoDocumento: "CC" as const,
  numeroDocumento: "1023456789",
  paisExpedicion: "Colombia",
  plataformaMusical: "spotify" as const,
  enlaceMusical: "https://open.spotify.com/artist/kale",
  redSocialTipo: "instagram" as const,
  redSocial: "@kale",
  rangoContratacion: "5m_10m",
  contactoNombre: "Andrés Rivas",
  contactoWhatsapp: "+57 300 000 0000",
  contactoEmail: "booking@kale.com",
  quienRegistra: "artista",
  declInfo: true as const,
  declAutorizado: true as const,
  declMayoria: true as const,
  declDatos: true as const,
  declReglamento: true as const,
};

describe("registroSchema — solista", () => {
  it("acepta un registro individual completo", () => {
    const r = registroSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rechaza si falta el documento del titular individual", () => {
    const r = registroSchema.safeParse({ ...base, numeroDocumento: undefined });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes("numeroDocumento"))).toBe(true);
  });

  it("rechaza si alguna declaración obligatoria es false", () => {
    const r = registroSchema.safeParse({ ...base, declMayoria: false });
    expect(r.success).toBe(false);
  });
});

describe("registroSchema — agrupación", () => {
  const miembro = (n: string) => ({
    nombre: n,
    tipoDocumento: "CC" as const,
    numeroDocumento: "10000000",
    paisExpedicion: "Colombia",
    rol: "voz" as const,
  });

  const colectivo = {
    ...base,
    tipo: "agrupacion" as const,
    nombreCompleto: undefined,
    tipoDocumento: undefined,
    numeroDocumento: undefined,
    paisExpedicion: undefined,
    miembros: [miembro("Uno"), miembro("Dos")],
    liderIndex: 0,
    declIntegrantes: true,
  };

  it("acepta una agrupación con 2+ integrantes y líder señalado", () => {
    const r = registroSchema.safeParse(colectivo);
    expect(r.success).toBe(true);
  });

  it("rechaza una agrupación con un solo integrante", () => {
    const r = registroSchema.safeParse({ ...colectivo, miembros: [miembro("Uno")], liderIndex: 0 });
    expect(r.success).toBe(false);
  });

  it("rechaza si no se marca la autorización de los integrantes", () => {
    const r = registroSchema.safeParse({ ...colectivo, declIntegrantes: false });
    expect(r.success).toBe(false);
  });
});

describe("identidadDe", () => {
  it("solista y dj son siempre individual", () => {
    expect(identidadDe("solista")).toBe("individual");
    expect(identidadDe("dj")).toBe("individual");
  });

  it("agrupacion, duo y orquesta son siempre colectivo", () => {
    expect(identidadDe("agrupacion")).toBe("colectivo");
    expect(identidadDe("duo")).toBe("colectivo");
    expect(identidadDe("orquesta")).toBe("colectivo");
  });

  it("'otro' depende de otroComposicion", () => {
    expect(identidadDe("otro", "individual")).toBe("individual");
    expect(identidadDe("otro", "colectivo")).toBe("colectivo");
    expect(identidadDe("otro")).toBeUndefined();
  });

  // Regresión: en el formulario, antes de elegir un tipo, `tipo` es undefined.
  // identidadDe NO debe interpretar eso como "colectivo" (causaba que el paso de
  // identidad agregara integrantes fantasma incluso para un registro individual).
  it("no confunde 'sin tipo elegido todavía' con colectivo", () => {
    expect(identidadDe(undefined as unknown as string)).toBeUndefined();
    expect(identidadDe("")).toBeUndefined();
  });
});
