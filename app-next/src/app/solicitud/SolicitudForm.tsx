"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCarrito } from "@/lib/directorio/useCarrito";
import { carrito } from "@/lib/directorio/carrito";
import { iniciales } from "@/lib/directorio/formato";
import { TIPOS_EVENTO, SECTORES_SOLICITANTE, AFOROS, DURACIONES, QUE_INCLUYE } from "@/lib/schemas/solicitud";

type ProyectoMin = { nombre: string; genero: string; rangoLabel: string; acento: string };
type Cuenta = { nombre: string; email: string; whatsapp: string; organizacion: string | null; cargo: string | null; sector: string | null };

export default function SolicitudForm({ mapa, cuenta }: { mapa: Record<string, ProyectoMin>; cuenta: Cuenta }) {
  const params = useSearchParams();
  const { ids, remove, clear } = useCarrito();
  const formRef = useRef<HTMLFormElement>(null);
  const [intentado, setIntentado] = useState(false);
  const [errores, setErrores] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<{ ref: string; nombres: string[] } | null>(null);
  const [tipoEvento, setTipoEvento] = useState("");
  const agregado = useRef(false);

  useEffect(() => {
    const id = params.get("id");
    if (id && mapa[id] && !agregado.current) {
      agregado.current = true;
      carrito.add(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validar = (): boolean => {
    const f = formRef.current;
    if (!f) return false;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? "";
    const checked = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.checked ?? false;
    const e: Record<string, boolean> = {};
    e.tipoEvento = !tipoEvento;
    e.fecha = !checked("fechaFlexible") && !val("fecha");
    e.ciudad = !val("ciudad");
    e.mensaje = !val("mensaje");
    e.nombre = !val("nombre");
    e.aforo = !val("aforo");
    e.sector = !val("sector");
    e.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email"));
    e.whatsapp = val("whatsapp").replace(/\D/g, "").length < 7;
    e.aceptaDatos = !checked("aceptaDatos");
    e.aceptaRango = !checked("aceptaRango");
    e.aceptaReglamento = !checked("aceptaReglamento");
    setErrores(e);
    return !Object.values(e).some(Boolean);
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIntentado(true);
    if (!validar()) return;
    setEnviando(true);
    setErrorEnvio(null);
    const f = new FormData(e.currentTarget);
    const txt = (k: string) => String(f.get(k) ?? "").trim();
    const cuerpo = {
      proyectos: ids,
      tipoEvento: txt("tipoEvento"),
      fecha: f.get("fechaFlexible") ? undefined : txt("fecha"),
      fechaFlexible: !!f.get("fechaFlexible"),
      ciudad: txt("ciudad"),
      lugar: txt("lugar") || undefined,
      aforo: txt("aforo"),
      duracion: txt("duracion") || undefined,
      presupuesto: txt("presupuesto") || undefined,
      incluye: f.getAll("incluye"),
      mensaje: txt("mensaje"),
      solicitanteNombre: txt("nombre"),
      solicitanteSector: txt("sector"),
      solicitanteOrganizacion: txt("organizacion") || undefined,
      solicitanteCargo: txt("cargo") || undefined,
      solicitanteEmail: txt("email"),
      solicitanteWhatsapp: txt("whatsapp"),
      aceptaDatos: !!f.get("aceptaDatos"),
      aceptaRango: !!f.get("aceptaRango"),
      aceptaReglamento: !!f.get("aceptaReglamento"),
    };
    try {
      const res = await fetch("/api/solicitud", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error();
      setConfirmacion({ ref: json.ref, nombres: ids.map((id) => mapa[id]?.nombre).filter(Boolean) as string[] });
      clear();
    } catch {
      setErrorEnvio("No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (confirmacion) {
    return (
      <section className="confirm" aria-live="polite">
        <div className="confirm-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" strokeWidth={3} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <p className="step-eyebrow">Solicitud enviada</p>
        <h2>Tu solicitud va en camino</h2>
        <p className="code">Referencia <b>{confirmacion.ref}</b></p>
        {confirmacion.nombres.length > 0 && (
          <ul className="sol-sent">{confirmacion.nombres.map((n) => <li key={n}>{n}</li>)}</ul>
        )}
        <p>
          {confirmacion.nombres.length
            ? "La solicitud llega al contacto para contratación de cada proyecto, que te responderá con disponibilidad y condiciones al correo o WhatsApp que indicaste."
            : "El equipo de MusicRoster revisará tu evento y te escribirá con opciones de proyectos."}{" "}
          Guarda la referencia para hacerle seguimiento.
        </p>
        <div className="confirm-ctas">
          <Link className="btn btn-cta" href="/buscar">Seguir buscando</Link>
          <Link className="btn btn-ghost" href="/contratar">Cómo funciona</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="wrap reg-layout" id="sol-layout">
      <aside className="reg-aside sol-aside">
        <p className="sol-aside-title">Proyectos en tu solicitud <b>{ids.length || ""}</b></p>
        <ul className="sol-picks">
          {ids.length === 0 && <li className="sol-picks-empty">Tu lista está vacía. Puedes enviarla así y te sugerimos proyectos.</li>}
          {ids.filter((id) => mapa[id]).map((id) => {
            const p = mapa[id];
            return (
              <li key={id} style={{ ["--a" as string]: `var(${p.acento})` }}>
                <span className="sol-pick-ini" aria-hidden="true">{iniciales(p.nombre)}</span>
                <span className="sol-pick-txt"><Link href={`/artista/${encodeURIComponent(id)}`}>{p.nombre}</Link><small>{p.genero} · {p.rangoLabel}</small></span>
                <button type="button" className="sol-pick-x" aria-label={`Quitar ${p.nombre}`} onClick={() => remove(id)}>×</button>
              </li>
            );
          })}
        </ul>
        <Link className="btn-add" href="/buscar">Agregar proyectos</Link>
        <div className="reg-aside-note">
          <strong>¿Aún no sabes a quién contratar?</strong>
          Envía la solicitud sin proyectos: el equipo de MusicRoster puede sugerirte opciones según tu evento.
        </div>
      </aside>

      <form className="reg-form" ref={formRef} noValidate onSubmit={enviar}>
        <h2 className="subhead">1 · Tu evento</h2>

        <div className={`field full choice-group${intentado && errores.tipoEvento ? " invalid" : ""}`}>
          <span className="label">Tipo de evento</span>
          <div className="choice-grid cols-3">
            {TIPOS_EVENTO.map(([v, l, d]) => (
              <label className="choice" key={v}>
                <input type="radio" name="tipoEvento" value={v} checked={tipoEvento === v} onChange={() => setTipoEvento(v)} />
                <span className="card"><strong>{l}</strong><small>{d}</small></span>
              </label>
            ))}
          </div>
          {intentado && errores.tipoEvento && <p className="err">Elige el tipo de evento.</p>}
        </div>

        <div className="field-grid sol-grid">
          <div className={`field${intentado && errores.fecha ? " invalid" : ""}`}>
            <label htmlFor="fecha">Fecha</label>
            <input type="date" id="fecha" name="fecha" min={new Date().toISOString().slice(0, 10)} />
            <label className="dir-check"><input type="checkbox" name="fechaFlexible" id="fechaFlexible" /> La fecha es flexible o aún no está definida</label>
            {intentado && errores.fecha && <p className="err">Indica la fecha o marca que es flexible.</p>}
          </div>
          <div className={`field${intentado && errores.ciudad ? " invalid" : ""}`}>
            <label htmlFor="ciudad">Ciudad del evento</label>
            <input type="text" id="ciudad" name="ciudad" placeholder="Ej.: Cali, Valle del Cauca" autoComplete="address-level2" />
            {intentado && errores.ciudad && <p className="err">Indica la ciudad.</p>}
          </div>
          <div className="field">
            <label htmlFor="lugar">Lugar <span className="opt">(opcional)</span></label>
            <input type="text" id="lugar" name="lugar" placeholder="Teatro, coliseo, hotel, plaza…" />
          </div>
          <div className={`field${intentado && errores.aforo ? " invalid" : ""}`}>
            <label htmlFor="aforo">Asistentes esperados</label>
            <select id="aforo" name="aforo" defaultValue="">
              <option value="">Selecciona</option>
              {AFOROS.map((a) => <option key={a}>{a}</option>)}
            </select>
            {intentado && errores.aforo && <p className="err">Elige un aproximado.</p>}
          </div>
          <div className="field">
            <label htmlFor="duracion">Duración de la presentación</label>
            <select id="duracion" name="duracion" defaultValue="Por definir">
              {DURACIONES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="presupuesto">Presupuesto por proyecto</label>
            <select id="presupuesto" name="presupuesto" defaultValue="por_definir">
              <option value="por_definir">Aún no lo sé</option>
            </select>
            <span className="hint">En pesos colombianos. Ayuda a que te respondan con opciones realistas.</span>
          </div>
          <div className="field full">
            <span className="label">El evento ofrece <span className="opt">(opcional)</span></span>
            <div className="tag-choices">
              {QUE_INCLUYE.map((o) => <label key={o}><input type="checkbox" name="incluye" value={o} /><span>{o}</span></label>)}
            </div>
          </div>
          <div className={`field full${intentado && errores.mensaje ? " invalid" : ""}`}>
            <label htmlFor="mensaje">Detalles para los artistas</label>
            <textarea id="mensaje" name="mensaje" rows={4} maxLength={1500} placeholder="Formato que buscas, horario, público, repertorio, si es un evento abierto o privado…" />
            {intentado && errores.mensaje && <p className="err">Cuéntales un poco del evento.</p>}
          </div>
        </div>

        <h2 className="subhead">2 · Quién solicita</h2>
        <div className="field-grid">
          <div className={`field${intentado && errores.nombre ? " invalid" : ""}`}>
            <label htmlFor="nombre">Nombre completo</label>
            <input type="text" id="nombre" name="nombre" autoComplete="name" defaultValue={cuenta.nombre} />
            {intentado && errores.nombre && <p className="err">Escribe tu nombre.</p>}
          </div>
          <div className={`field${intentado && errores.sector ? " invalid" : ""}`}>
            <label htmlFor="sector">Sector</label>
            <select id="sector" name="sector" defaultValue={cuenta.sector ?? ""}>
              <option value="">Selecciona</option>
              {SECTORES_SOLICITANTE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {intentado && errores.sector && <p className="err">Elige el sector.</p>}
          </div>
          <div className="field">
            <label htmlFor="organizacion">Organización <span className="opt">(si aplica)</span></label>
            <input type="text" id="organizacion" name="organizacion" autoComplete="organization" defaultValue={cuenta.organizacion ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="cargo">Cargo <span className="opt">(opcional)</span></label>
            <input type="text" id="cargo" name="cargo" autoComplete="organization-title" defaultValue={cuenta.cargo ?? ""} />
          </div>
          <div className={`field${intentado && errores.email ? " invalid" : ""}`}>
            <label htmlFor="email">Correo electrónico</label>
            <input type="email" id="email" name="email" autoComplete="email" defaultValue={cuenta.email} />
            {intentado && errores.email && <p className="err">Escribe un correo válido.</p>}
          </div>
          <div className={`field${intentado && errores.whatsapp ? " invalid" : ""}`}>
            <label htmlFor="whatsapp">WhatsApp</label>
            <input type="tel" id="whatsapp" name="whatsapp" autoComplete="tel" placeholder="+57 300 000 0000" defaultValue={cuenta.whatsapp} />
            {intentado && errores.whatsapp && <p className="err">Escribe un número de contacto.</p>}
          </div>
        </div>

        <h2 className="subhead">3 · Aceptaciones</h2>
        <div className="checks">
          <label className={`check${intentado && errores.aceptaDatos ? " invalid" : ""}`}><input type="checkbox" name="aceptaDatos" /><span>Autorizo el tratamiento de mis datos para gestionar esta solicitud y que se compartan con el contacto de los proyectos a los que la dirijo, según la <a href="/politica-datos" target="_blank">Política de datos</a>.</span></label>
          <label className={`check${intentado && errores.aceptaRango ? " invalid" : ""}`}><input type="checkbox" name="aceptaRango" /><span>Entiendo que el rango de contratación de cada perfil es orientativo y que enviar la solicitud no obliga a ninguna de las partes.</span></label>
          <label className={`check${intentado && errores.aceptaReglamento ? " invalid" : ""}`}><input type="checkbox" name="aceptaReglamento" /><span>Usaré los datos de contacto de los artistas solo para esta oportunidad y acepto el <a href="/reglamento#art-30" target="_blank">Reglamento</a> de MusicRoster.</span></label>
        </div>

        {errorEnvio && <p className="err" style={{ display: "block" }}>{errorEnvio}</p>}

        <div className="reg-nav">
          <Link className="btn btn-back" href="/buscar">Seguir buscando</Link>
          <span className="spacer" />
          <div className="btn-submit-wrap">
            <button className="btn btn-cta btn-lg" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar solicitud"}</button>
            <small>{ids.length ? `Llegará a ${ids.length} ${ids.length === 1 ? "proyecto" : "proyectos"}` : "La recibe el equipo de MusicRoster"}</small>
          </div>
        </div>
      </form>
    </div>
  );
}
