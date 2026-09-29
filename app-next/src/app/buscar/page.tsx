import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { obtenerPerfilesPublicos } from "@/lib/directorio/perfilPublico";
import { requireComprador } from "@/lib/comprador/auth";
import BuscarApp from "./BuscarApp";

export const metadata: Metadata = {
  title: "Buscar artistas — Billboard MusicRoster",
  description: "Directorio de proyectos musicales: busca por nombre, género, tipo de proyecto, territorio y rango de contratación, y contacta directamente.",
};

export default async function BuscarPage() {
  const cuenta = await requireComprador("/buscar");
  const todos = await obtenerPerfilesPublicos();

  return (
    <>
      <SiteHeader ocultar={["/buscar", "/#como-funciona"]} />
      <main>
        <BuscarApp todos={todos} sesion={{ email: cuenta.email, nombre: cuenta.nombre }} />
      </main>
      <SiteFooter />
    </>
  );
}
