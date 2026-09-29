import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { obtenerPerfilesPublicos } from "@/lib/directorio/perfilPublico";
import { obtenerSesionComprador } from "@/lib/comprador/auth";
import { destinoSeguro } from "@/lib/auth/magicLink";
import AccesoForm from "./AccesoForm";

export const metadata: Metadata = {
  title: "Acceso — Billboard MusicRoster",
  description: "Crea una cuenta gratuita o ingresa para buscar y contratar proyectos musicales en Billboard MusicRoster.",
};

export default async function AccesoPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  const sesion = await obtenerSesionComprador();
  const perfiles = await obtenerPerfilesPublicos();

  return (
    <div className="acc-page">
      <SiteHeader />
      <main className="acc">
        {sesion ? (
          <section className="acc-panel" style={{ margin: "0 auto" }}>
            <div className="acc-box acc-view acc-done">
              <div className="confirm-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" strokeWidth={3} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </div>
              <h2>Ya ingresaste</h2>
              <p className="acc-sub">Estás usando la cuenta de <b>{sesion.email}</b>.</p>
              <div className="acc-done-ctas">
                <Link className="btn btn-ink btn-lg" href={destinoSeguro(volver)}>Empezar a buscar</Link>
              </div>
            </div>
          </section>
        ) : (
          <AccesoForm preview={perfiles.slice(0, 6)} total={perfiles.length} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
