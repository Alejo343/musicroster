import { describe, expect, it } from "vitest";
import { leerContenidoEstatico } from "./contenidoEstatico";

describe("contenido estático portado", () => {
  it("cada página trae su <main> completo", () => {
    for (const ruta of ["contenido.html", "reglamento/contenido.html", "politica-datos/contenido.html", "faq/contenido.html"]) {
      const html = leerContenidoEstatico(ruta);
      expect(html).toContain("<main>");
      expect(html.length).toBeGreaterThan(100);
    }
  });

  // Guarda contra un cambio accidental que borre los pendientes de NGNART (ver CLAUDE.md:
  // "reemplazar todos los .tbd" solo cuando lleguen esos datos, no antes).
  it('conserva los 3 pendientes .tbd del reglamento y los 11 de la política de datos', () => {
    const reglamento = leerContenidoEstatico("reglamento/contenido.html");
    const politica = leerContenidoEstatico("politica-datos/contenido.html");
    expect((reglamento.match(/class="tbd"/g) ?? []).length).toBe(3);
    expect((politica.match(/class="tbd"/g) ?? []).length).toBe(11);
  });

  it("reescribió los enlaces internos ya portados (reglamento/política/inicio)", () => {
    const reglamento = leerContenidoEstatico("reglamento/contenido.html");
    expect(reglamento).toContain('href="/politica-datos"');
    expect(reglamento).not.toContain('href="politica-datos.html"');

    const faq = leerContenidoEstatico("faq/contenido.html");
    expect(faq).toContain('href="https://bmic.billboard.com.co/"');
    expect(faq).not.toContain('href="bmic.html"');
  });
});
