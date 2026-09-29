import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { leerContenidoEstatico } from "@/lib/contenidoEstatico";

export const metadata: Metadata = {
  title: "Política de datos — Billboard MusicRoster",
  description: "Política de Tratamiento de Datos Personales de Billboard MusicRoster.",
};

export default function PoliticaDatosPage() {
  const contenido = leerContenidoEstatico("politica-datos/contenido.html");
  return (
    <>
      <SiteHeader activa="politica-datos" />
      <div dangerouslySetInnerHTML={{ __html: contenido }} />
      <SiteFooter />
    </>
  );
}
