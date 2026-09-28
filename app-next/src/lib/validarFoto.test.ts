import { describe, expect, it } from "vitest";
import { validarFoto } from "./validarFoto";

describe("validarFoto", () => {
  it("exige una fotografía", () => {
    expect(validarFoto(null)).toMatch(/sube la fotografía/i);
    expect(validarFoto(undefined)).toMatch(/sube la fotografía/i);
  });

  it("rechaza tipos de archivo no permitidos", () => {
    expect(validarFoto({ type: "application/pdf", size: 1000 })).toMatch(/JPG, PNG o WEBP/);
    expect(validarFoto({ type: "image/gif", size: 1000 })).toMatch(/JPG, PNG o WEBP/);
  });

  it("rechaza archivos de más de 5 MB", () => {
    expect(validarFoto({ type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/supera 5 MB/);
  });

  it("acepta JPG/PNG/WEBP dentro del límite", () => {
    expect(validarFoto({ type: "image/jpeg", size: 1024 })).toBeNull();
    expect(validarFoto({ type: "image/png", size: 5 * 1024 * 1024 })).toBeNull();
    expect(validarFoto({ type: "image/webp", size: 1024 })).toBeNull();
  });
});
