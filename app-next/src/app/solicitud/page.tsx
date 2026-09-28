import type { Metadata } from "next";
import Script from "next/script";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { obtenerPerfilesPublicos } from "@/lib/directorio/perfilPublico";
import { requireComprador } from "@/lib/comprador/auth";
import SolicitudForm from "./SolicitudForm";

export const metadata: Metadata = {
  title: "Solicitud de contratación — Billboard MusicRoster",
  description: "Cuéntanos tu evento una sola vez y la solicitud llega al contacto de cada proyecto que elegiste.",
};

export default async function SolicitudPage() {
  const cuenta = await requireComprador("/solicitud");
  const todos = await obtenerPerfilesPublicos();
  const mapa = Object.fromEntries(todos.map((p) => [p.id, { nombre: p.nombre, genero: p.genero, rangoLabel: p.rangoLabel, acento: p.acento }]));

  return (
    <>
      <SiteHeader />
      <main>
        <section className="reg-hero">
          <div className="wrap">
            <p className="kicker">Para quienes contratan</p>
            <h1 className="display">Solicitud de <span>contratación</span></h1>
            <p>Cuéntanos tu evento una sola vez y la solicitud llega al contacto de cada proyecto que elegiste para que te respondan con disponibilidad y condiciones.</p>
            <ul className="reg-hero-notes">
              <li className="hl">Uno o varios proyectos a la vez</li>
              <li>Enviarla no te obliga a contratar</li>
              <li>Cualquier costo se informa antes de comprometerte</li>
            </ul>
          </div>
        </section>
        <SolicitudForm mapa={mapa} cuenta={{ nombre: cuenta.nombre, email: cuenta.email, whatsapp: cuenta.whatsapp, organizacion: cuenta.organizacion, cargo: cuenta.cargo, sector: cuenta.sector }} />
      </main>
      <SiteFooter />
      <Script src="/assets/js/main.js" strategy="afterInteractive" />
    </>
  );
}
