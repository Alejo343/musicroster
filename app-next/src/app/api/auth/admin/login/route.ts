import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginAdminSchema } from "@/lib/schemas/auth";
import { verificarPassword } from "@/lib/auth/password";
import { firmarSesionAdmin, COOKIE_ADMIN, DURACION_ADMIN } from "@/lib/auth/session";
import { comprobarLimite } from "@/lib/rateLimitRespuesta";
import { limitarTasa } from "@/lib/rateLimit";

export async function POST(request: Request) {
  // Por IP (evita que un solo origen pruebe muchas contraseñas) y por correo (evita que
  // se pruebe una misma cuenta desde varias IPs). Cualquiera de los dos límites basta.
  const limitadoPorIp = comprobarLimite(request, "admin-login", 10, 15 * 60 * 1000);
  if (limitadoPorIp) return limitadoPorIp;

  const json = await request.json().catch(() => null);
  const parsed = loginAdminSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Correo o contraseña inválidos." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const limitePorCorreo = limitarTasa(`admin-login-correo:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!limitePorCorreo.permitido) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos para esta cuenta. Inténtalo de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(limitePorCorreo.reintentarEnSegundos) } },
    );
  }

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
