// Proxy de Next.js 16 (reemplaza a middleware.ts, deprecado en esta versión).
// Protege en el servidor lo que hoy protege assets/js/contratar.js solo del lado del cliente
// (redirigiendo a acceso.html?volver=...) y las rutas del panel de administración.
// Nota de la doc de Next.js: el Proxy es una primera barrera, no la única — cada route handler
// vuelve a verificar la sesión antes de tocar datos privados.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_ADMIN, COOKIE_COMPRADOR, verificarSesionAdmin, verificarSesionComprador } from "@/lib/auth/session";

const RUTAS_COMPRADOR = ["/buscar", "/artista", "/solicitud"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const esAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const esComprador = RUTAS_COMPRADOR.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (esAdmin) {
    const sesion = await verificarSesionAdmin(request.cookies.get(COOKIE_ADMIN)?.value);
    if (!sesion) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  if (esComprador) {
    const sesion = await verificarSesionComprador(request.cookies.get(COOKIE_COMPRADOR)?.value);
    if (!sesion) {
      const url = new URL("/acceso", request.url);
      url.searchParams.set("volver", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buscar/:path*", "/artista/:path*", "/solicitud/:path*", "/admin/:path*"],
};
