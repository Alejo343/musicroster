// El proxy (src/proxy.ts) ya protege /admin/*, pero la doc de Next.js 16 advierte no confiar
// solo en el Proxy: cada Server Component/Server Action del panel vuelve a verificar la sesión.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, verificarSesionAdmin, type SesionAdmin } from "@/lib/auth/session";

export async function requireAdmin(): Promise<SesionAdmin> {
  const jar = await cookies();
  const sesion = await verificarSesionAdmin(jar.get(COOKIE_ADMIN)?.value);
  if (!sesion) redirect("/admin/login");
  return sesion;
}

export async function requireRolAdmin(): Promise<SesionAdmin> {
  const sesion = await requireAdmin();
  if (sesion.rol !== "admin") redirect("/admin");
  return sesion;
}
