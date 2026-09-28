import { beforeEach, describe, expect, it, vi } from "vitest";
import { limitarTasa, _reiniciarLimitador, ipDeSolicitud } from "./rateLimit";

beforeEach(() => {
  _reiniciarLimitador();
  vi.useRealTimers();
});

describe("limitarTasa", () => {
  it("permite hasta el límite dentro de la ventana", () => {
    const clave = "test:1.1.1.1";
    for (let i = 0; i < 3; i++) {
      expect(limitarTasa(clave, 3, 60_000).permitido).toBe(true);
    }
  });

  it("bloquea al superar el límite", () => {
    const clave = "test:2.2.2.2";
    for (let i = 0; i < 3; i++) limitarTasa(clave, 3, 60_000);
    const r = limitarTasa(clave, 3, 60_000);
    expect(r.permitido).toBe(false);
    expect(r.reintentarEnSegundos).toBeGreaterThan(0);
  });

  it("no mezcla contadores entre claves distintas (rutas o IPs diferentes)", () => {
    const a = "registro:1.1.1.1";
    const b = "solicitud:1.1.1.1";
    for (let i = 0; i < 5; i++) limitarTasa(a, 5, 60_000);
    expect(limitarTasa(b, 5, 60_000).permitido).toBe(true);
  });

  it("reabre la ventana una vez que expira", () => {
    vi.useFakeTimers();
    const clave = "test:3.3.3.3";
    limitarTasa(clave, 1, 1000);
    expect(limitarTasa(clave, 1, 1000).permitido).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(limitarTasa(clave, 1, 1000).permitido).toBe(true);
    vi.useRealTimers();
  });
});

describe("ipDeSolicitud", () => {
  it("toma la primera IP de X-Forwarded-For", () => {
    const req = new Request("http://localhost/", { headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" } });
    expect(ipDeSolicitud(req)).toBe("9.9.9.9");
  });

  it("usa X-Real-IP si no hay X-Forwarded-For", () => {
    const req = new Request("http://localhost/", { headers: { "x-real-ip": "8.8.8.8" } });
    expect(ipDeSolicitud(req)).toBe("8.8.8.8");
  });

  it("devuelve 'desconocida' si no hay ningún encabezado", () => {
    const req = new Request("http://localhost/");
    expect(ipDeSolicitud(req)).toBe("desconocida");
  });
});
