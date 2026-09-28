import { describe, expect, it } from "vitest";
import { solicitudSchema } from "./solicitud";

const base = {
  proyectos: ["MR-2026-AAAAAA"],
  tipoEvento: "festival" as const,
  fecha: "2026-12-24",
  ciudad: "Cali",
  aforo: "500 – 2.000" as const,
  mensaje: "Concierto de fin de año para 500 personas.",
  solicitanteNombre: "María Pérez",
  solicitanteSector: "industria" as const,
  solicitanteEmail: "maria@empresa.com",
  solicitanteWhatsapp: "+57 300 000 0000",
  aceptaDatos: true as const,
  aceptaRango: true as const,
  aceptaReglamento: true as const,
};

describe("solicitudSchema", () => {
  it("acepta una solicitud completa", () => {
    const r = solicitudSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("acepta una solicitud SIN proyectos destinatarios (va al equipo de MusicRoster)", () => {
    // El propio formulario lo ofrece: "Envía la solicitud sin proyectos".
    const r = solicitudSchema.safeParse({ ...base, proyectos: [] });
    expect(r.success).toBe(true);
  });

  it("exige fecha salvo que sea flexible", () => {
    const sinFecha = { ...base, fecha: undefined };
    expect(solicitudSchema.safeParse(sinFecha).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...sinFecha, fechaFlexible: true }).success).toBe(true);
  });

  it("exige un aforo válido", () => {
    expect(solicitudSchema.safeParse({ ...base, aforo: "un montón" }).success).toBe(false);
  });

  it("exige un sector válido", () => {
    expect(solicitudSchema.safeParse({ ...base, solicitanteSector: "" }).success).toBe(false);
  });

  it("rechaza si falta alguna aceptación", () => {
    expect(solicitudSchema.safeParse({ ...base, aceptaReglamento: false }).success).toBe(false);
  });
});
