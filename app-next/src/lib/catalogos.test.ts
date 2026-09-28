import { describe, expect, it } from "vitest";
import { acento, rangoLabel, MUNICIPIOS_CO, REGIONES, GENEROS } from "./catalogos";

describe("acento", () => {
  it("asigna el acento urbano a géneros urbanos", () => {
    expect(acento("Reggaetón")).toBe("--g-urbano");
    expect(acento("Trap")).toBe("--g-urbano");
  });

  it("cae en el acento regional por defecto cuando no reconoce el género", () => {
    expect(acento("Género inventado")).toBe("--g-regional");
    expect(acento("")).toBe("--g-regional");
  });
});

describe("rangoLabel", () => {
  it("devuelve la etiqueta legible del rango", () => {
    expect(rangoLabel("menos_2m")).toBe("Menos de $2 M");
    expect(rangoLabel("segun_evento")).toBe("Cotización según las características del evento");
  });

  it("devuelve el valor crudo si no hay coincidencia, y un guion si no hay valor", () => {
    expect(rangoLabel("codigo_desconocido")).toBe("codigo_desconocido");
    expect(rangoLabel(null)).toBe("—");
    expect(rangoLabel(undefined)).toBe("—");
  });
});

describe("catálogos de territorio", () => {
  it("trae los municipios DIVIPOLA con [código, nombre]", () => {
    expect(MUNICIPIOS_CO["Antioquia"]).toBeDefined();
    expect(MUNICIPIOS_CO["Antioquia"][0]).toHaveLength(2);
  });

  it("Colombia tiene sus 33 departamentos/distritos como regiones", () => {
    expect(REGIONES["Colombia"]).toHaveLength(33);
  });
});

describe("GENEROS", () => {
  it("incluye 'Otro' como opción de cierre", () => {
    expect(GENEROS[GENEROS.length - 1]).toBe("Otro");
  });
});
