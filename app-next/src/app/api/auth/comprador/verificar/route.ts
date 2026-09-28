import { NextResponse } from "next/server";
import { consumirEnlaceMagico, destinoSeguro } from "@/lib/auth/magicLink";
import { firmarSesionComprador, COOKIE_COMPRADOR, DURACION_COMPRADOR } from "@/lib/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const volver = destinoSeguro(url.searchParams.get("volver"));

  if (!token) {
    return NextResponse.redirect(new URL("/acceso?error=enlace_invalido", url));
  }

  const resultado = await consumirEnlaceMagico(token);
  if (!resultado.ok) {
    return NextResponse.redirect(new URL(`/acceso?error=${resultado.razon}`, url));
  }

  const sesion = await firmarSesionComprador({ sub: resultado.buyerAccountId, email: resultado.email });
  const respuesta = NextResponse.redirect(new URL(volver, url));
  respuesta.cookies.set(COOKIE_COMPRADOR, sesion, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_COMPRADOR,
  });
  return respuesta;
}
