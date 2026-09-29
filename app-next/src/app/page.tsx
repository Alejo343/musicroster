import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import LandingEfectos from "@/components/landing-efectos";
import { leerContenidoEstatico } from "@/lib/contenidoEstatico";

export const metadata: Metadata = {
  title: "Billboard MusicRoster — Registra tu proyecto musical",
  description:
    "El directorio que registra e identifica proyectos musicales para conectarlos con las oportunidades de la industria musical. Registro gratuito para artistas.",
};

export default function Home() {
  const contenido = leerContenidoEstatico("contenido.html");
  return (
    <>
      <SiteHeader activa="inicio" top />
      <div dangerouslySetInnerHTML={{ __html: contenido }} />
      <SiteFooter />
      <LandingEfectos />
    </>
  );
}
