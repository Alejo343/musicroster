import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { leerContenidoEstatico } from "@/lib/contenidoEstatico";

export const metadata: Metadata = {
  title: "BMIC — Billboard MusicRoster",
};

export default function BmicPage() {
  const contenido = leerContenidoEstatico("bmic/contenido.html");
  return (
    <>
      <SiteHeader activa="bmic" />
      <div dangerouslySetInnerHTML={{ __html: contenido }} />
      <SiteFooter />
    </>
  );
}
