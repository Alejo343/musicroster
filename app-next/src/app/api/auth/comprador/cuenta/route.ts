// Crear cuenta de comprador (acceso.html, tab "crear"). No inicia sesión de inmediato:
// se manda el primer enlace mágico para que la sesión quede verificada por el servidor.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearCuentaCompradorSchema } from "@/lib/schemas/auth";
import { crearEnlaceMagico } from "@/lib/auth/magicLink";
import { enviarCorreo } from "@/lib/email";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = crearCuentaCompradorSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errores: parsed.error.flatten() }, { status: 400 });
  }
  const datos = parsed.data;

  const existente = await prisma.buyerAccount.findUnique({ where: { email: datos.email } });
  const cuenta = existente ?? (await prisma.buyerAccount.create({ data: datos }));

  const token = await crearEnlaceMagico(cuenta.id);
  const url = new URL("/api/auth/comprador/verificar", request.url);
  url.searchParams.set("token", token);
  await enviarCorreo({
    to: cuenta.email,
    subject: "Tu acceso a Billboard MusicRoster",
    html: `<p>Hola ${cuenta.nombre},</p><p>Entra con este enlace (vence en 15 minutos): <a href="${url.toString()}">${url.toString()}</a></p>`,
  });

  return NextResponse.json({ ok: true });
}
