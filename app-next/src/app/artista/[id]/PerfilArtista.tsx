"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Portada from "@/components/directorio/Portada";
import BotonGuardar from "@/components/directorio/BotonGuardar";
import TarjetaProyecto from "@/components/directorio/TarjetaProyecto";
import BarraSeleccion from "@/components/directorio/BarraSeleccion";
import { iniciales, lugar } from "@/lib/directorio/formato";
import { PLATAFORMAS_MUSICA, PLATAFORMAS_REDES } from "@/lib/catalogos";
import type { Enlace, PerfilPublico } from "@/lib/directorio/perfilPublico";

const ESCALA = ["< 2", "2–5", "5–10", "10–20", "20–50", "50–100", "100+"];

function nombrePlataforma(k: string): string {
  return (PLATAFORMAS_MUSICA.find(([v]) => v === k) ?? PLATAFORMAS_REDES.find(([v]) => v === k))?.[1] ?? k;
}

function hrefRed(url: string, plataforma: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const u = url.replace(/^@/, "");
  const mapa: Record<string, string> = {
    instagram: `https://www.instagram.com/${u}`, tiktok: `https://www.tiktok.com/@${u}`,
    youtube: `https://www.youtube.com/@${u}`, facebook: `https://www.facebook.com/${u}`,
  };
  return mapa[plataforma] ?? "#";
}
const corta = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Enlaces({ lista }: { lista: Enlace[] }) {
  return (
    <div className="pf-links">
      {lista.map((l, i) => (
        <a className="pf-link" href={hrefRed(l.url, l.plataforma)} target="_blank" rel="noopener" key={i}>
          <span className="pf-link-ico" aria-hidden="true">{nombrePlataforma(l.plataforma)[0]}</span>
          <span className="pf-link-txt"><b>{nombrePlataforma(l.plataforma)}</b><small>{corta(l.url)}</small></span>
        </a>
      ))}
    </div>
  );
}

export default function PerfilArtista({ p, similares, mapa }: { p: PerfilPublico; similares: PerfilPublico[]; mapa: Record<string, { nombre: string; acento: string }> }) {
  const [volver, setVolver] = useState<{ href: string; texto: string }>({ href: "/buscar", texto: "Ir al directorio" });
  const [compartirTexto, setCompartirTexto] = useState("Copiar enlace");

  useEffect(() => {
    // document.referrer no existe durante el render en servidor (ni en el primer render
    // en cliente, para que no haya desajuste de hidratación): solo se puede leer aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (document.referrer.includes("/buscar")) setVolver({ href: document.referrer, texto: "Volver a los resultados" });
  }, []);

  const origen = lugar(p.origen);
  const origenDistinto = origen && origen !== lugar(p.residencia);
  const generos = [p.genero, ...p.otrosGeneros.filter((g) => g !== p.genero)];
  const digitos = p.contacto.whatsapp.replace(/\D/g, "");
  const saludo = `Hola, vi el perfil de ${p.nombre} en Billboard MusicRoster y quiero consultar por una presentación.`;
  const segun = p.rango === "segun_evento";

  return (
    <>
      <section className="pf-hero" style={{ ["--a" as string]: `var(${p.acento})` }}>
        <div className="wrap">
          <Link className="pf-back" href={volver.href}>{volver.texto}</Link>
          <div className="pf-hero-grid">
            <Portada p={p} clase="cover-lg" />
            <div className="pf-head">
              <p className="kicker">{p.tipoLabel}{p.integrantes.length ? ` · ${p.integrantes.length} ${p.integrantes.length === 1 ? "integrante" : "integrantes"}` : ""}</p>
              <h1 className="display pf-name">{p.nombre}</h1>
              <ul className="pf-genres">{generos.map((g) => <li key={g}>{g}</li>)}</ul>
              <p className="pf-place">Vive en <b>{lugar(p.residencia)}</b>{origenDistinto ? <> · Origen <b>{origen}</b></> : null}</p>
              <div className="pf-actions">
                <Link className="btn btn-cta btn-lg" href={`/solicitud?id=${encodeURIComponent(p.id)}`}>Solicitar contratación →</Link>
                <BotonGuardar id={p.id} nombre={p.nombre} conEtiqueta />
                <button
                  className="pf-share"
                  type="button"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(window.location.href); setCompartirTexto("Enlace copiado"); }
                    catch { setCompartirTexto("Copia la dirección del navegador"); }
                    setTimeout(() => setCompartirTexto("Copiar enlace"), 2400);
                  }}
                >
                  <span>{compartirTexto}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pf-body on-paper">
        <div className="wrap pf-grid">
          <div className="pf-main">
            <section className="pf-sec">
              <h2>{p.individual ? "Escúchalo" : "Escúchalos"}</h2>
              <Enlaces lista={p.musica} />
              {p.redes.length > 0 && <><h3 className="pf-sub">Redes</h3><Enlaces lista={p.redes} /></>}
            </section>

            <section className="pf-sec">
              <h2>{p.individual ? "El artista" : "Integrantes"}</h2>
              <ul className="pf-people">
                {p.individual ? (
                  <li>
                    <span className="pf-av" style={{ ["--a" as string]: `var(${p.acento})` }}>{iniciales(p.titular)}</span>
                    <span><b>{p.titular}</b><small>{p.tipo === "dj" ? "DJ" : "Artista solista"}</small></span>
                  </li>
                ) : p.integrantes.map((m, i) => (
                  <li key={i}>
                    <span className="pf-av" style={{ ["--a" as string]: `var(${p.acento})` }}>{iniciales(m.nombre)}</span>
                    <span><b>{m.nombre}</b><small>{m.rol}</small></span>
                    {m.lider && <em className="pf-badge">{/director/i.test(m.rol) ? "Director" : "Líder"}</em>}
                  </li>
                ))}
              </ul>
            </section>

            <section className="pf-sec">
              <h2>Territorio</h2>
              <dl className="pf-dl">
                <div><dt>Vive en</dt><dd>{lugar(p.residencia)}</dd></div>
                <div><dt>Origen del proyecto</dt><dd>{origen || "—"}</dd></div>
                <div><dt>Nacionalidad</dt><dd>{p.nacionalidad}</dd></div>
              </dl>
              <Link className="pf-more-link" href={`/buscar?region=${encodeURIComponent(p.residencia.region)}`}>Más proyectos en {p.residencia.region} →</Link>
            </section>
          </div>

          <aside className="pf-side">
            <div className="pf-card">
              <p className="pf-card-k">Rango de contratación</p>
              <p className="pf-rango">{segun ? "Cotiza según el evento" : p.rangoLabel}</p>
              <ol className={`pf-scale${segun ? " is-off" : ""}`} aria-hidden="true">
                {ESCALA.map((l, i) => <li className={i === p.rangoIndex ? "on" : ""} key={l}><i />{l}</li>)}
              </ol>
              <p className="pf-card-note">Por presentación en vivo, en millones de pesos colombianos. Es orientativo: el valor final depende de la fecha, la ciudad, la duración, el formato y la logística.</p>
            </div>

            <div className="pf-card">
              <p className="pf-card-k">Contacto para contratación</p>
              <p className="pf-contact-name">{p.contacto.nombre}</p>
              <a className="pf-cbtn" href={`https://wa.me/${digitos}?text=${encodeURIComponent(saludo)}`} target="_blank" rel="noopener">
                <span><small>WhatsApp</small>{p.contacto.whatsapp}</span>
              </a>
              <a className="pf-cbtn" href={`mailto:${p.contacto.email}?subject=${encodeURIComponent(`Contratación de ${p.nombre} (vía MusicRoster)`)}`}>
                <span><small>Correo</small>{p.contacto.email}</span>
              </a>
              <p className="pf-card-note">Usa estos datos solo para oportunidades de contratación. No se permiten envíos masivos ni publicidad (<Link href="/reglamento#art-45">Reglamento, Art. 45</Link>).</p>
            </div>

            <p className="pf-ref">Registro <b>{p.id}</b><br />Publicado tras revisión administrativa de MusicRoster</p>
          </aside>
        </div>

        {similares.length > 0 && (
          <div className="wrap pf-similar">
            <h2 className="display">También te puede interesar</h2>
            <div className="pgrid">{similares.map((x) => <TarjetaProyecto p={x} key={x.id} />)}</div>
          </div>
        )}
      </section>

      <BarraSeleccion mapa={mapa} />
    </>
  );
}
