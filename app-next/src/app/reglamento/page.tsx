import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { leerContenidoEstatico } from "@/lib/contenidoEstatico";

export const metadata: Metadata = {
  title: "Reglamento — Billboard MusicRoster",
  description:
    "Reglamento de Billboard MusicRoster: condiciones de registro, publicación, uso y operación del directorio de proyectos musicales.",
};

export default function ReglamentoPage() {
  const contenido = leerContenidoEstatico("reglamento/contenido.html");
  return (
    <>
      <SiteHeader activa="reglamento" />
      <div dangerouslySetInnerHTML={{ __html: contenido }} />
      <SiteFooter />
    </>
  );
}
