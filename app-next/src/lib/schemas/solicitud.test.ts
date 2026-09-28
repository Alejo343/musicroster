import { describe, expect, it } from "vitest";
import { solicitudSchema } from "./solicitud";

const base = {
  proyectos: ["MR-2026-AAAAAA"],
  tipoEvento: "concierto" as const,
  fecha: "2026-12-24",
  ciudad: "Cali",
  mensaje: "Concierto de fin de año para 500 personas.",
  solicitanteNombre: "María Pérez",
  solicitanteEmail: "maria@empresa.com",
  solicitanteWhatsapp: "+57 300 000 0000",
  aceptaDatos: true as const,
  aceptaRango: true as const,
  aceptaReglamento: true as const,
};

describe("solicitudSchema", () => {
  it("acepta una solicitud completa", () => {
    expect(solicitudSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza sin proyectos destinatarios", () => {
    const r = solicitudSchema.safeParse({ ...base, proyectos: [] });
    expect(r.success).toBe(false);
  });

  it("exige fecha salvo que sea flexible", () => {
    const sinFecha = { ...base, fecha: undefined };
    expect(solicitudSchema.safeParse(sinFecha).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...sinFecha, fechaFlexible: true }).success).toBe(true);
  });

  it("rechaza si falta alguna aceptación", () => {
    expect(solicitudSchema.safeParse({ ...base, aceptaReglamento: false }).success).toBe(false);
  });
});
