import { describe, expect, it } from "vitest";
import { generarReferencia } from "./referencia";

describe("generarReferencia", () => {
  it("tiene el formato PREFIJO-AAAA-XXXXXX", () => {
    const ref = generarReferencia("MR", 2026);
    expect(ref).toMatch(/^MR-2026-[A-Z0-9]{6}$/);
  });

  it("no usa caracteres ambiguos (0/O, 1/I)", () => {
    const ref = generarReferencia("SC", 2026);
    const sufijo = ref.split("-")[2];
    expect(sufijo).not.toMatch(/[01OI]/);
  });

  it("genera valores distintos entre llamadas", () => {
    const a = generarReferencia("MR");
    const b = generarReferencia("MR");
    expect(a).not.toBe(b);
  });
});
