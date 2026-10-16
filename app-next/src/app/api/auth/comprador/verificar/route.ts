import { NextResponse } from "next/server";
import { consumirEnlaceMagico, destinoSeguro } from "@/lib/auth/magicLink";
import { firmarSesionComprador, COOKIE_COMPRADOR, DURACION_COMPRADOR } from "@/lib/auth/session";
import { urlPublica } from "@/lib/urlPublica";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const volver = destinoSeguro(url.searchParams.get("volver"));

  if (!token) {
    return NextResponse.redirect(urlPublica("/acceso?error=enlace_invalido", request));
  }

  const resultado = await consumirEnlaceMagico(token);
  if (!resultado.ok) {
    return NextResponse.redirect(urlPublica(`/acceso?error=${resultado.razon}`, request));
  }

  const sesion = await firmarSesionComprador({ sub: resultado.buyerAccountId, email: resultado.email });
  const respuesta = NextResponse.redirect(urlPublica(volver, request));
  respuesta.cookies.set(COOKIE_COMPRADOR, sesion, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_COMPRADOR,
  });
  return respuesta;
}
