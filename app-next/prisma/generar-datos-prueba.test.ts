import { describe, expect, it } from "vitest";
import { generate } from "./generar-datos-prueba";

describe("generate()", () => {
  it("es determinista: dos corridas producen los mismos IDs en el mismo orden", () => {
    const a = generate().map((r) => r.id);
    const b = generate().map((r) => r.id);
    expect(a).toEqual(b);
  });

  it("produce 96 registros base + 1 copia duplicada a propósito", () => {
    expect(generate()).toHaveLength(97);
  });

  it("todo registro colectivo tiene al menos 2 integrantes y un líder", () => {
    for (const rec of generate()) {
      if (rec.identidad === "colectivo") {
        expect(rec.miembros.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("arma el caso de duplicado por nombre de proyecto (MR-2026-Q7XK2A)", () => {
    const out = generate();
    const copia = out.find((r) => r.id === "MR-2026-Q7XK2A");
    expect(copia).toBeDefined();
    const original = out.find((r) => r.nombreProyecto.toLowerCase() === copia!.nombreProyecto.toLowerCase() && r.id !== copia!.id);
    expect(original).toBeDefined();
  });

  it("arma el caso de documento repetido entre dos registros individuales", () => {
    const indiv = generate().filter((r) => r.identidad === "individual");
    const numeros = indiv.map((r) => r.numeroDocumento);
    const repetidos = numeros.filter((n, i) => numeros.indexOf(n) !== i);
    expect(repetidos.length).toBeGreaterThan(0);
  });

  it("arma el caso de correo de contacto compartido entre dos proyectos", () => {
    const correos = generate().map((r) => r.contactoEmail);
    expect(correos.filter((e) => e === "booking@palenquemusic.co").length).toBe(2);
  });
});
