import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginAdminSchema } from "@/lib/schemas/auth";
import { verificarPassword } from "@/lib/auth/password";
import { firmarSesionAdmin, COOKIE_ADMIN, DURACION_ADMIN } from "@/lib/auth/session";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginAdminSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Correo o contraseña inválidos." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const valido = admin ? await verificarPassword(password, admin.passwordHash) : false;
  if (!admin || !valido) {
    return NextResponse.json({ ok: false, error: "Correo o contraseña inválidos." }, { status: 401 });
  }

  const sesion = await firmarSesionAdmin({ sub: admin.id, email: admin.email, rol: admin.rol, nombre: admin.nombre });
  const respuesta = NextResponse.json({ ok: true, rol: admin.rol });
  respuesta.cookies.set(COOKIE_ADMIN, sesion, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_ADMIN,
  });
  return respuesta;
}
