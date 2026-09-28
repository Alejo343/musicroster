import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./magicLink";

describe("destinoSeguro", () => {
  it("acepta una ruta interna", () => {
    expect(destinoSeguro("/buscar?genero=Salsa")).toBe("/buscar?genero=Salsa");
  });

  it("usa el valor por defecto si no hay volver", () => {
    expect(destinoSeguro(null)).toBe("/buscar");
    expect(destinoSeguro(undefined)).toBe("/buscar");
  });

  it("rechaza intentos de redirección abierta a otro host", () => {
    expect(destinoSeguro("https://evil.com")).toBe("/buscar");
    expect(destinoSeguro("//evil.com")).toBe("/buscar");
    expect(destinoSeguro("evil.com")).toBe("/buscar");
  });
});
