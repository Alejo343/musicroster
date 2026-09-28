import type { Metadata } from "next";
import Script from "next/script";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { leerContenidoEstatico } from "@/lib/contenidoEstatico";

export const metadata: Metadata = {
  title: "FAQ — Billboard MusicRoster",
};

export default function FaqPage() {
  const contenido = leerContenidoEstatico("faq/contenido.html");
  return (
    <>
      <SiteHeader activa="faq" />
      <div dangerouslySetInnerHTML={{ __html: contenido }} />
      <SiteFooter />
      <Script src="/assets/js/main.js" strategy="afterInteractive" />
    </>
  );
}
