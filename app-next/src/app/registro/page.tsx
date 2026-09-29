import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import RegistroForm from "./RegistroForm";

export const metadata: Metadata = {
  title: "Registra tu proyecto — Billboard MusicRoster",
  description: "Registra tu proyecto musical en Billboard MusicRoster. El registro es gratuito.",
};

export default function RegistroPage() {
  return (
    <div className="reg-page">
      <SiteHeader activa="registro" />
      <section className="reg-hero">
        <div className="wrap">
          <p className="kicker">
            <span className="num">●</span> Registro
          </p>
          <h1 className="display">
            Registra tu proyecto en <span>Billboard MusicRoster</span>
          </h1>
          <ul className="reg-hero-notes">
            <li className="hl">El registro es gratuito</li>
            <li>🚨 Nadie debe cobrarte por hacerlo</li>
          </ul>
          <p>La información que suministres permitirá identificar correctamente tu proyecto dentro de Billboard MusicRoster.</p>
        </div>
      </section>
      <RegistroForm />
      <SiteFooter />
    </div>
  );
}
