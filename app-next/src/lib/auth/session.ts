// Sesiones firmadas (JWT compacto, HS256) para compradores y administradores.
// El proxy (src/proxy.ts) solo verifica firma + expiración, sin tocar la base de datos
// (ver nota de rendimiento en la doc de Next.js sobre no depender de módulos compartidos
// pesados dentro de Proxy); cada Server Function/route handler vuelve a verificar la sesión.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_COMPRADOR = "mr_comprador_sesion";
export const COOKIE_ADMIN = "mr_admin_sesion";

export const DURACION_COMPRADOR = 60 * 60 * 24 * 30; // 30 días: sin contraseña, sesión larga por conveniencia
export const DURACION_ADMIN = 60 * 60 * 12; // 12 horas: cuenta con contraseña real, sesión más corta

async function claveSecreta(): Promise<Uint8Array> {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) throw new Error("Falta configurar AUTH_SECRET.");
  // Se deriva una clave de 32 bytes con SHA-256 para que AUTH_SECRET pueda ser cualquier frase,
  // usando Web Crypto (disponible tanto en runtime Node como Edge).
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secreto));
  return new Uint8Array(digest);
}

export type SesionComprador = { sub: string; email: string };
export type SesionAdmin = { sub: string; email: string; rol: "moderador" | "admin"; nombre: string };

export async function firmarSesionComprador(datos: SesionComprador): Promise<string> {
  const clave = await claveSecreta();
  return new SignJWT({ ...datos, tipo: "comprador" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_COMPRADOR}s`)
    .sign(clave);
}

export async function firmarSesionAdmin(datos: SesionAdmin): Promise<string> {
  const clave = await claveSecreta();
  return new SignJWT({ ...datos, tipo: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_ADMIN}s`)
    .sign(clave);
}

export async function verificarSesionComprador(token: string | undefined): Promise<SesionComprador | null> {
  if (!token) return null;
  try {
    const clave = await claveSecreta();
    const { payload } = await jwtVerify(token, clave);
    if (payload.tipo !== "comprador" || typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function verificarSesionAdmin(token: string | undefined): Promise<SesionAdmin | null> {
  if (!token) return null;
  try {
    const clave = await claveSecreta();
    const { payload } = await jwtVerify(token, clave);
    if (payload.tipo !== "admin" || typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    const rol = payload.rol === "admin" ? "admin" : "moderador";
    return { sub: payload.sub, email: payload.email, rol, nombre: typeof payload.nombre === "string" ? payload.nombre : payload.email };
  } catch {
    return null;
  }
}
