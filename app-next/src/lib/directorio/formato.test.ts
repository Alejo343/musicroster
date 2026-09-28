import { describe, expect, it } from "vitest";
import { iniciales, lugar } from "./formato";

describe("iniciales", () => {
  it("ignora artículos y palabras de relleno", () => {
    expect(iniciales("Los Caimanes del Atrato")).toBe("CA");
    expect(iniciales("La Tribu del Manglar")).toBe("TM");
  });

  it("usa las 2 primeras palabras útiles", () => {
    expect(iniciales("Kalé")).toBe("K");
    expect(iniciales("Orquesta La Suprema")).toBe("S");
  });

  it("si todas las palabras son de relleno, usa las originales igual", () => {
    expect(iniciales("DJ Gran")).toBe("DG");
  });
});

describe("lugar", () => {
  it("omite la región si es igual a la ciudad (p. ej. Bogotá D.C.)", () => {
    expect(lugar({ pais: "Colombia", region: "Bogotá D.C.", ciudad: "Bogotá D.C." })).toBe("Bogotá D.C.");
  });

  it("incluye región cuando difiere de la ciudad", () => {
    expect(lugar({ pais: "Colombia", region: "Valle del Cauca", ciudad: "Cali" })).toBe("Cali, Valle del Cauca");
  });

  it("agrega el país solo si no es Colombia", () => {
    expect(lugar({ pais: "México", region: "Ciudad de México", ciudad: "Ciudad de México" })).toBe("Ciudad de México, México");
  });
});
