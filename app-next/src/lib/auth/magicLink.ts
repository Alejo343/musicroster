import { randomBytes } from "node:crypto";
import { prisma } from "../prisma";

const DURACION_MS = 15 * 60 * 1000; // 15 minutos

export async function crearEnlaceMagico(buyerAccountId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.magicLinkToken.create({
    data: { token, buyerAccountId, expiraEn: new Date(Date.now() + DURACION_MS) },
  });
  return token;
}

export type ResultadoConsumo =
  | { ok: true; buyerAccountId: string; email: string }
  | { ok: false; razon: "invalido" | "expirado" | "usado" };

export async function consumirEnlaceMagico(token: string): Promise<ResultadoConsumo> {
  const registro = await prisma.magicLinkToken.findUnique({
    where: { token },
    include: { buyerAccount: true },
  });
  if (!registro) return { ok: false, razon: "invalido" };
  if (registro.usadoEn) return { ok: false, razon: "usado" };
  if (registro.expiraEn.getTime() < Date.now()) return { ok: false, razon: "expirado" };

  await prisma.magicLinkToken.update({ where: { token }, data: { usadoEn: new Date() } });
  return { ok: true, buyerAccountId: registro.buyerAccountId, email: registro.buyerAccount.email };
}

// Evita redirecciones abiertas: solo se acepta una ruta interna que empiece por "/".
export function destinoSeguro(volver: string | null | undefined, porDefecto = "/buscar"): string {
  if (!volver) return porDefecto;
  if (!volver.startsWith("/") || volver.startsWith("//")) return porDefecto;
  return volver;
}
