import { beforeAll, describe, expect, it } from "vitest";
import { firmarSesionAdmin, firmarSesionComprador, verificarSesionAdmin, verificarSesionComprador } from "./session";

beforeAll(() => {
  process.env.AUTH_SECRET = "secreto-de-prueba-no-usar-en-produccion";
});

describe("sesión de comprador", () => {
  it("firma y verifica un token válido", async () => {
    const token = await firmarSesionComprador({ sub: "buyer_1", email: "maria@empresa.com" });
    const sesion = await verificarSesionComprador(token);
    expect(sesion).toEqual({ sub: "buyer_1", email: "maria@empresa.com" });
  });

  it("rechaza un token vacío o manipulado", async () => {
    expect(await verificarSesionComprador(undefined)).toBeNull();
    const token = await firmarSesionComprador({ sub: "buyer_1", email: "maria@empresa.com" });
    expect(await verificarSesionComprador(`${token}x`)).toBeNull();
  });

  it("no confunde un token de admin con uno de comprador", async () => {
    const tokenAdmin = await firmarSesionAdmin({ sub: "admin_1", email: "laura@musicroster.dev", rol: "moderador" });
    expect(await verificarSesionComprador(tokenAdmin)).toBeNull();
  });
});

describe("sesión de admin", () => {
  it("firma y verifica un token válido, con el rol incluido", async () => {
    const token = await firmarSesionAdmin({ sub: "admin_2", email: "oscar@musicroster.dev", rol: "admin" });
    const sesion = await verificarSesionAdmin(token);
    expect(sesion).toEqual({ sub: "admin_2", email: "oscar@musicroster.dev", rol: "admin" });
  });

  it("no confunde un token de comprador con uno de admin", async () => {
    const tokenComprador = await firmarSesionComprador({ sub: "buyer_1", email: "maria@empresa.com" });
    expect(await verificarSesionAdmin(tokenComprador)).toBeNull();
  });
});
