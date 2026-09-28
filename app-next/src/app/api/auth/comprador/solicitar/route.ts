// Enlace mágico para "ingresar" (acceso.html, tab "ingresar"): la cuenta debe existir ya.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { solicitarEnlaceSchema } from "@/lib/schemas/auth";
import { crearEnlaceMagico } from "@/lib/auth/magicLink";
import { enviarCorreo } from "@/lib/email";
import { comprobarLimite } from "@/lib/rateLimitRespuesta";

export async function POST(request: Request) {
  const limitado = comprobarLimite(request, "comprador-solicitar", 5, 15 * 60 * 1000);
  if (limitado) return limitado;

  const json = await request.json().catch(() => null);
  const parsed = solicitarEnlaceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errores: parsed.error.flatten() }, { status: 400 });
  }
  const { email, volver } = parsed.data;

  const cuenta = await prisma.buyerAccount.findUnique({ where: { email } });
  // No se revela si el correo existe o no (evita enumerar cuentas): siempre se responde ok.
  if (cuenta) {
    const token = await crearEnlaceMagico(cuenta.id);
    const url = new URL("/api/auth/comprador/verificar", request.url);
    url.searchParams.set("token", token);
    if (volver) url.searchParams.set("volver", volver);
    await enviarCorreo({
      to: cuenta.email,
      subject: "Tu acceso a Billboard MusicRoster",
      html: `<p>Entra con este enlace (vence en 15 minutos): <a href="${url.toString()}">${url.toString()}</a></p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
