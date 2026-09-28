"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import TarjetaProyecto from "@/components/directorio/TarjetaProyecto";
import type { PerfilPublico } from "@/lib/directorio/perfilPublico";

type Tab = "crear" | "ingresar";

export default function AccesoForm({ preview, total }: { preview: PerfilPublico[]; total: number }) {
  const params = useSearchParams();
  const volver = params.get("volver") ?? "";
  const [tab, setTab] = useState<Tab>(typeof window !== "undefined" && window.location.hash === "#ingresar" ? "ingresar" : "crear");
  const [enviado, setEnviado] = useState<{ email: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (enviado) {
    return (
      <div className="acc-view acc-done" aria-live="polite">
        <div className="confirm-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" strokeWidth={3} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h2>Revisa tu correo</h2>
        <p className="acc-sub">
          Te enviamos un enlace de acceso a <b>{enviado.email}</b>. Ábrelo desde este mismo dispositivo para entrar — vence en 15 minutos.
        </p>
        <p className="acc-sub">¿No te llegó? Revisa spam o <button type="button" className="link-btn" onClick={() => setEnviado(null)}>inténtalo de nuevo</button>.</p>
      </div>
    );
  }

  const enviar = async (endpoint: string, body: Record<string, unknown>, email: string) => {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, volver }) });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "No pudimos procesar la solicitud. Revisa los datos e inténtalo de nuevo.");
        return;
      }
      setEnviado({ email });
    } catch {
      setError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <section className="acc-art">
        <div className="acc-art-copy">
          <p className="kicker">Para quienes buscan y contratan</p>
          <h1 className="display">El directorio <span>se abre</span> con tu cuenta</h1>
          <ul className="acc-perks">
            <li><b>Busca</b> por género, tipo de proyecto, territorio y presupuesto.</li>
            <li><b>Contacta</b> directo: WhatsApp y correo de quien atiende las contrataciones.</li>
            <li><b>Solicita</b> disponibilidad a varios proyectos con una sola solicitud.</li>
          </ul>
          <p className="acc-free"><b>$0</b> La cuenta para buscar es gratuita.</p>
        </div>
        <div className="acc-preview" aria-hidden="true">
          <div className="acc-preview-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <span>salsa · Cali</span>
          </div>
          <div className="acc-preview-grid">
            {preview.map((p) => <TarjetaProyecto p={p} link={false} key={p.id} />)}
          </div>
          <div className="acc-lock">
            <span><strong>{total} proyectos esperando</strong></span>
          </div>
        </div>
      </section>

      <section className="acc-panel">
        <div className="acc-box">
          <div className="acc-tabs" role="tablist" aria-label="Acceso">
            <button type="button" role="tab" aria-selected={tab === "crear"} onClick={() => setTab("crear")}>Crear cuenta</button>
            <button type="button" role="tab" aria-selected={tab === "ingresar"} onClick={() => setTab("ingresar")}>Ingresar</button>
          </div>

          {tab === "crear" && (
            <div className="acc-view" role="tabpanel">
              <h2>Crea tu cuenta</h2>
              <p className="acc-sub">
                {volver ? "Para ver el directorio necesitas una cuenta. Es gratis y te toma un minuto." : "Te toma un minuto. Solo la usamos para darte acceso y gestionar tus solicitudes."}
              </p>
              <form
                className="acc-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const val = (n: string) => String(f.get(n) ?? "").trim();
                  enviar("/api/auth/comprador/cuenta", {
                    nombre: val("nombre"), email: val("email"), whatsapp: val("whatsapp"), sector: f.get("sector"),
                    organizacion: val("organizacion"), cargo: val("cargo"), pais: val("pais"), ciudad: val("ciudad"),
                  }, val("email"));
                }}
              >
                <div className="field">
                  <span className="label">¿Para quién buscas?</span>
                  <div className="acc-sectors">
                    <label><input type="radio" name="sector" value="industria" defaultChecked /><span>Industria musical</span></label>
                    <label><input type="radio" name="sector" value="publico" /><span>Entidad pública</span></label>
                    <label><input type="radio" name="sector" value="privado" /><span>Empresa o marca</span></label>
                    <label><input type="radio" name="sector" value="social" /><span>Evento particular</span></label>
                    <label><input type="radio" name="sector" value="internacional" /><span>Internacional</span></label>
                  </div>
                </div>
                <div className="field-grid">
                  <div className="field full">
                    <label htmlFor="c-nombre">Nombre completo</label>
                    <input type="text" id="c-nombre" name="nombre" autoComplete="name" required />
                  </div>
                  <div className="field">
                    <label htmlFor="c-org">Organización <span className="opt">(si aplica)</span></label>
                    <input type="text" id="c-org" name="organizacion" autoComplete="organization" placeholder="Festival, empresa, alcaldía…" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-cargo">Cargo <span className="opt">(opcional)</span></label>
                    <input type="text" id="c-cargo" name="cargo" autoComplete="organization-title" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">Correo electrónico</label>
                    <input type="email" id="c-email" name="email" autoComplete="email" required />
                  </div>
                  <div className="field">
                    <label htmlFor="c-whatsapp">WhatsApp</label>
                    <input type="tel" id="c-whatsapp" name="whatsapp" autoComplete="tel" placeholder="+57 300 000 0000" required />
                  </div>
                  <div className="field">
                    <label htmlFor="c-pais">País</label>
                    <input type="text" id="c-pais" name="pais" autoComplete="country-name" defaultValue="Colombia" required />
                  </div>
                  <div className="field">
                    <label htmlFor="c-ciudad">Ciudad</label>
                    <input type="text" id="c-ciudad" name="ciudad" autoComplete="address-level2" required />
                  </div>
                </div>
                <div className="checks">
                  <label className="check"><input type="checkbox" name="acepta_datos" required /><span>Autorizo el tratamiento de mis datos para crear mi cuenta y gestionar mis solicitudes, según la <a href="/politica-datos" target="_blank">Política de datos</a>.</span></label>
                  <label className="check"><input type="checkbox" name="acepta_uso" required /><span>Usaré los datos de contacto de los artistas solo para oportunidades de contratación, sin envíos masivos ni publicidad, y acepto el <a href="/reglamento" target="_blank">Reglamento</a>.</span></label>
                </div>
                {error && <p className="err" style={{ display: "block" }}>{error}</p>}
                <button type="submit" className="btn btn-cta btn-lg acc-submit" disabled={enviando}>{enviando ? "Enviando…" : "Crear cuenta"}</button>
              </form>
              <p className="acc-switch">¿Ya tienes cuenta? <button type="button" className="link-btn" onClick={() => setTab("ingresar")}>Ingresa</button></p>
            </div>
          )}

          {tab === "ingresar" && (
            <div className="acc-view" role="tabpanel">
              <h2>Ingresa a tu cuenta</h2>
              <p className="acc-sub">Te mandamos un enlace de acceso a tu correo — no necesitas contraseña.</p>
              <form
                className="acc-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const email = String(f.get("email") ?? "").trim();
                  enviar("/api/auth/comprador/solicitar", { email }, email);
                }}
              >
                <div className="field">
                  <label htmlFor="i-email">Correo electrónico</label>
                  <input type="email" id="i-email" name="email" autoComplete="username" required />
                </div>
                {error && <p className="err" style={{ display: "block" }}>{error}</p>}
                <button type="submit" className="btn btn-cta btn-lg acc-submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviarme el enlace"}</button>
              </form>
              <p className="acc-switch">¿Primera vez? <button type="button" className="link-btn" onClick={() => setTab("crear")}>Crea tu cuenta gratis</button></p>
            </div>
          )}

          <div className="acc-note">
            <span>¿Eres artista? Esta cuenta es para quienes contratan. Para aparecer en el directorio, <a href="/registro">registra tu proyecto</a>.</span>
          </div>
        </div>
      </section>
    </>
  );
}
