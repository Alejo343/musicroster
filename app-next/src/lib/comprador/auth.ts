// El proxy (src/proxy.ts) ya protege /buscar, /artista y /solicitud, pero la doc de
// Next.js 16 advierte no confiar solo en el Proxy: cada Server Component/Server Function
// del directorio vuelve a verificar la sesión.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_COMPRADOR, verificarSesionComprador } from "@/lib/auth/session";

export async function obtenerSesionComprador() {
  const jar = await cookies();
  return verificarSesionComprador(jar.get(COOKIE_COMPRADOR)?.value);
}

export async function requireComprador(volver: string) {
  const sesion = await obtenerSesionComprador();
  if (!sesion) redirect(`/acceso?volver=${encodeURIComponent(volver)}`);
  const cuenta = await prisma.buyerAccount.findUnique({ where: { id: sesion.sub } });
  if (!cuenta) redirect(`/acceso?volver=${encodeURIComponent(volver)}`);
  return cuenta;
}
