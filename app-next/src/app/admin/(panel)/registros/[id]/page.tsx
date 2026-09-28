import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerTodos, obtenerUno } from "@/lib/admin/queries";
import { calcularDuplicados } from "@/lib/admin/duplicados";
import { ago, fmtDateTime, lugar } from "@/lib/admin/formato";
import {
  TIPOS_PROYECTO, TIPOS_DOCUMENTO, ROLES_INTEGRANTE, PLATAFORMAS_MUSICA, PLATAFORMAS_REDES,
  RANGOS_CONTRATACION, QUIEN_REGISTRA, GENEROS, DECLARACIONES, rangoLabel, acento,
} from "@/lib/catalogos";
import SeccionEditable, { type CampoSeccion } from "@/components/admin/SeccionEditable";
import PanelModeracion from "@/components/admin/PanelModeracion";
import NotasInternas from "@/components/admin/NotasInternas";
import CampoSecreto from "@/components/admin/CampoSecreto";

const val = (v: string | null | undefined) => (v ? v : <span className="empty-val">Sin dato</span>);
const plataformaLabel = (k: string) => (PLATAFORMAS_MUSICA.find(([v]) => v === k) ?? PLATAFORMAS_REDES.find(([v]) => v === k))?.[1] ?? k;
const enlace = (url: string) => {
  const href = /^https?:\/\//.test(url) ? url : url.startsWith("@") ? null : `https://${url}`;
  return href ? <a href={href} target="_blank" rel="noopener">{url}</a> : url;
};

export default async function DetalleRegistroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await obtenerUno(id);
  if (!rec) notFound();

  const todos = await obtenerTodos();
  const idx = todos.findIndex((r) => r.id === id);
  const anterior = todos[idx - 1];
  const siguiente = todos[idx + 1];

  const esTercero = rec.quienRegistra !== "artista";
  const individual = rec.identidad === "individual";

  const ultimaAccion = [...rec.historial].reverse().find((h) => !h.privado && h.autor !== "Formulario web");

  const casos = (await calcularDuplicados(todos)).filter((c) => !c.dismissed && !c.resolved && c.items.some((x) => x.id === rec.id));
  const NOMBRE_KIND: Record<string, string> = { documento: "el mismo número de documento", nombre: "el mismo nombre de proyecto", email: "el mismo correo de contacto" };

  // ---- Secciones (mismo orden que registro.html) ----
  const seccion1: CampoSeccion[] = [
    { label: "Tipo de proyecto", publico: true, mostrar: `${TIPOS_PROYECTO[rec.tipo as keyof typeof TIPOS_PROYECTO]}${rec.tipo === "otro" ? ` · ${rec.otroComposicion === "colectivo" ? "varias personas" : "una persona"}` : ""}` },
    ...(rec.tipo === "otro" ? [{ clave: "otroDescripcion", label: "¿Qué tipo de proyecto es?", publico: true, mostrar: val(rec.otroDescripcion), input: { tipo: "text" as const, valor: rec.otroDescripcion ?? "" } }] : []),
    { clave: "nombreProyecto", label: "Nombre artístico", publico: true, full: rec.tipo !== "otro", mostrar: rec.nombreProyecto, input: { tipo: "text" as const, valor: rec.nombreProyecto } },
  ];

  const seccion2: CampoSeccion[] = [
    { clave: "generoPrincipal", label: "Género principal", publico: true, mostrar: <span className="chip main">{rec.generoPrincipal}</span>, input: { tipo: "select" as const, opciones: GENEROS.map((g) => [g, g] as [string, string]), valor: rec.generoPrincipal } },
    { label: "Otros géneros", publico: true, mostrar: rec.otrosGeneros.length ? <div className="chips-row">{rec.otrosGeneros.map((g) => <span className="chip" key={g}>{g}</span>)}</div> : val(null) },
    ...(rec.otroGenero ? [{ clave: "otroGenero", label: "Otro género", publico: true, mostrar: rec.otroGenero, input: { tipo: "text" as const, valor: rec.otroGenero } }] : []),
  ];

  const seccion3: CampoSeccion[] = [
    { clave: "nacionalidad", label: "Nacionalidad", publico: true, full: true, mostrar: rec.nacionalidad, input: { tipo: "text" as const, valor: rec.nacionalidad } },
    { clave: "paisResidencia", label: "País de residencia", publico: true, mostrar: rec.paisResidencia, input: { tipo: "text" as const, valor: rec.paisResidencia } },
    { clave: "regionResidencia", label: "Departamento / región", publico: true, mostrar: rec.regionResidencia, input: { tipo: "text" as const, valor: rec.regionResidencia } },
    { clave: "ciudadActual", label: "Ciudad o municipio actual", publico: true, full: true, mostrar: rec.ciudadActual, input: { tipo: "text" as const, valor: rec.ciudadActual } },
    { clave: "paisOrigen", label: "País de origen", publico: true, mostrar: rec.paisOrigen, input: { tipo: "text" as const, valor: rec.paisOrigen } },
    { clave: "regionOrigen", label: "Región de origen", publico: true, mostrar: rec.regionOrigen, input: { tipo: "text" as const, valor: rec.regionOrigen } },
    { clave: "ciudadOrigen", label: "Ciudad de origen", publico: true, full: true, mostrar: rec.ciudadOrigen, input: { tipo: "text" as const, valor: rec.ciudadOrigen } },
  ];

  const seccion4: CampoSeccion[] = individual ? [
    { clave: "nombreCompleto", label: "Nombre completo", publico: true, full: true, mostrar: val(rec.nombreCompleto), input: { tipo: "text" as const, valor: rec.nombreCompleto ?? "" } },
    { clave: "tipoDocumento", label: "Tipo de documento", publico: false, mostrar: val(rec.tipoDocumento ? TIPOS_DOCUMENTO[rec.tipoDocumento as keyof typeof TIPOS_DOCUMENTO] : null), input: { tipo: "select" as const, opciones: Object.entries(TIPOS_DOCUMENTO) as [string, string][], valor: rec.tipoDocumento ?? "" } },
    { clave: "numeroDocumento", label: "Número de documento", publico: false, mostrar: <CampoSecreto proyectoId={rec.id} valor={rec.numeroDocumento ?? ""} que="Número de documento del titular" />, input: { tipo: "text" as const, valor: rec.numeroDocumento ?? "" } },
    { clave: "paisExpedicion", label: "País de expedición", publico: false, full: true, mostrar: val(rec.paisExpedicion), input: { tipo: "text" as const, valor: rec.paisExpedicion ?? "" } },
  ] : [];

  const seccion5: CampoSeccion[] = [
    { clave: "enlaceMusical", label: `Enlace principal · ${plataformaLabel(rec.plataformaMusical)}`, publico: true, full: true, mostrar: enlace(rec.enlaceMusical), input: { tipo: "url" as const, valor: rec.enlaceMusical } },
    { label: "Otros enlaces musicales", publico: true, full: true, mostrar: (rec.otrosEnlaces as { plataforma: string; url: string }[]).length ? (
      <div className="links-list">{(rec.otrosEnlaces as { plataforma: string; url: string }[]).map((l, i) => <a key={i} href={/^https?:/.test(l.url) ? l.url : "#"} target="_blank" rel="noopener"><em>{plataformaLabel(l.plataforma)}</em><span>{l.url}</span></a>)}</div>
    ) : val(null) },
    { clave: "redSocial", label: `Red social principal · ${plataformaLabel(rec.redSocialTipo)}`, publico: true, mostrar: enlace(rec.redSocial), input: { tipo: "text" as const, valor: rec.redSocial } },
    { label: "Otras redes", publico: true, mostrar: (rec.otrasRedes as { plataforma: string; url: string }[]).length ? (
      <div className="links-list">{(rec.otrasRedes as { plataforma: string; url: string }[]).map((l, i) => <a key={i} href={/^https?:/.test(l.url) ? l.url : "#"} target="_blank" rel="noopener"><em>{plataformaLabel(l.plataforma)}</em><span>{l.url}</span></a>)}</div>
    ) : val(null) },
    { label: "Fotografía oficial", publico: true, full: true, mostrar: rec.foto ? <a href={rec.foto} target="_blank" rel="noopener">Ver fotografía</a> : val(null) },
  ];

  const seccion6: CampoSeccion[] = [
    { clave: "rangoContratacion", label: "Rango de contratación", publico: true, full: true, mostrar: rangoLabel(rec.rangoContratacion), input: { tipo: "select" as const, opciones: RANGOS_CONTRATACION.map(([v, l]) => [v, l] as [string, string]), valor: rec.rangoContratacion } },
    { clave: "contactoNombre", label: "Contacto", publico: true, full: true, mostrar: rec.contactoNombre, input: { tipo: "text" as const, valor: rec.contactoNombre } },
    { clave: "contactoWhatsapp", label: "WhatsApp", publico: true, mostrar: <a href={`https://wa.me/${rec.contactoWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">{rec.contactoWhatsapp}</a>, input: { tipo: "tel" as const, valor: rec.contactoWhatsapp } },
    { clave: "contactoEmail", label: "Correo", publico: true, mostrar: <a href={`mailto:${rec.contactoEmail}`}>{rec.contactoEmail}</a>, input: { tipo: "email" as const, valor: rec.contactoEmail } },
  ];

  const seccion7: CampoSeccion[] = [
    { label: "Quién hizo el registro", publico: false, full: rec.quienRegistra === "artista", mostrar: QUIEN_REGISTRA[rec.quienRegistra as keyof typeof QUIEN_REGISTRA] ?? rec.quienRegistra },
    ...(esTercero ? [
      { clave: "registranteNombre", label: "Nombre de quien diligencia", publico: false, mostrar: val(rec.registranteNombre), input: { tipo: "text" as const, valor: rec.registranteNombre ?? "" } },
      { clave: "registranteEmail", label: "Correo", publico: false, mostrar: val(rec.registranteEmail), input: { tipo: "email" as const, valor: rec.registranteEmail ?? "" } },
      { clave: "registranteWhatsapp", label: "WhatsApp", publico: false, mostrar: val(rec.registranteWhatsapp), input: { tipo: "tel" as const, valor: rec.registranteWhatsapp ?? "" } },
    ] : []),
    { label: "Enviado", publico: false, mostrar: fmtDateTime(rec.creado) },
  ];

  const declaracionesList = (
    <>
      <h3 style={{ margin: "22px 0 10px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Declaraciones aceptadas</h3>
      <ul className="decls">
        {DECLARACIONES.filter(([k]) => k !== "declIntegrantes" || rec[k as keyof typeof rec]).map(([k, l]) => (
          <li key={k} className={rec[k as keyof typeof rec] ? "" : "off"}>{l}</li>
        ))}
      </ul>
    </>
  );

  const miembrosTabla = rec.miembros.length > 0 && (
    <table className="members-t">
      <thead><tr><th>Nombre</th><th>Rol</th><th>Documento</th><th>Expedición</th></tr></thead>
      <tbody>
        {rec.miembros.map((m) => (
          <tr key={m.id}>
            <td><strong>{m.nombre}</strong>{m.esLider && <span className="lead-tag">{rec.tipo === "orquesta" ? "Director" : "Líder"}</span>}</td>
            <td>{m.rol === "otro" ? m.rolOtro || "Otro" : ROLES_INTEGRANTE[m.rol as keyof typeof ROLES_INTEGRANTE]}</td>
            <td><span className="muted">{m.tipoDocumento}</span> <CampoSecreto proyectoId={rec.id} valor={m.numeroDocumento} que={`Documento de ${m.nombre}`} /></td>
            <td>{m.paisExpedicion}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <header className="adm-top">
        <div>
          <div className="adm-crumb"><Link href="/admin/registros">Registros</Link> / <span className="mono">{rec.id}</span></div>
          <h1>Detalle del registro</h1>
        </div>
        <div className="adm-top-actions pn">
          {anterior && <Link className="btn btn-ghost btn-sm" href={`/admin/registros/${anterior.id}`}>← Anterior</Link>}
          {siguiente && <Link className="btn btn-ghost btn-sm" href={`/admin/registros/${siguiente.id}`}>Siguiente →</Link>}
        </div>
      </header>

      <div className="card det-hero">
        <span className="avatar lg" style={{ ["--c" as string]: `var(${acento(rec.generoPrincipal)})` }}>{rec.nombreProyecto.slice(0, 2).toUpperCase()}</span>
        <div className="info">
          <span className={`badge st-${rec.estado}`}>{rec.estado}</span>
          <h2>{rec.nombreProyecto}</h2>
          <div className="line">
            <span><b>{TIPOS_PROYECTO[rec.tipo as keyof typeof TIPOS_PROYECTO]}</b></span>
            <span>{rec.generoPrincipal}</span>
            <span>{lugar(rec)}</span>
            <span className="mono">{rec.id}</span>
            <span>Registrado {ago(rec.creado)}{esTercero ? ` por ${(QUIEN_REGISTRA[rec.quienRegistra as keyof typeof QUIEN_REGISTRA] ?? rec.quienRegistra).toLowerCase()}` : ""}</span>
          </div>
        </div>
      </div>

      <div className="det-grid">
        <div className="det-main">
          <SeccionEditable proyectoId={rec.id} numero={1} titulo="Proyecto" campos={seccion1} mismoPublico accionEtiqueta="proyecto" />
          <SeccionEditable proyectoId={rec.id} numero={2} titulo="Géneros" campos={seccion2} mismoPublico accionEtiqueta="géneros" />
          <SeccionEditable proyectoId={rec.id} numero={3} titulo="Territorio" campos={seccion3} mismoPublico accionEtiqueta="territorio" />
          <SeccionEditable proyectoId={rec.id} numero={4} titulo={individual ? "Identidad del titular" : `Miembros oficiales · ${rec.miembros.length}`} campos={seccion4} accionEtiqueta="identidad" extra={miembrosTabla} />
          <SeccionEditable proyectoId={rec.id} numero={5} titulo="Presencia musical e imagen" campos={seccion5} mismoPublico accionEtiqueta="presencia musical" />
          <SeccionEditable proyectoId={rec.id} numero={6} titulo="Contratación" campos={seccion6} mismoPublico accionEtiqueta="contratación" />
          <SeccionEditable proyectoId={rec.id} numero={7} titulo="Registro y autorizaciones" campos={seccion7} accionEtiqueta="registro y autorizaciones" declaraciones={declaracionesList} />
        </div>

        <aside aria-label="Moderación del registro">
          <section className="card">
            <PanelModeracion
              proyectoId={rec.id}
              estado={rec.estado}
              motivo={rec.motivo}
              ultimaAccionTexto={ultimaAccion ? `${ultimaAccion.autor} · ${ago(ultimaAccion.fecha)}` : `En cola ${ago(rec.creado)}`}
            />
          </section>

          {(casos.length > 0 || esTercero) && (
            <section className="card">
              <div className="card-head"><h3>Alertas</h3></div>
              {casos.map((c) => {
                const otros = c.items.filter((x) => x.id !== rec.id);
                return (
                  <div className="alert" key={c.key}>
                    <div>
                      Comparte {c.kinds.map((k) => NOMBRE_KIND[k]).join(", ")} con {otros.map((o, i) => (
                        <span key={o.id}>{i > 0 && ", "}<Link href={`/admin/registros/${o.id}`}>{o.nombreProyecto}</Link> ({o.estado})</span>
                      ))}. <Link href={`/admin/verificacion#${encodeURIComponent(c.key)}`}>Revisar caso →</Link>
                    </div>
                  </div>
                );
              })}
              {esTercero && (
                <div className="alert info">
                  <div>Lo registró un tercero ({(QUIEN_REGISTRA[rec.quienRegistra as keyof typeof QUIEN_REGISTRA] ?? rec.quienRegistra).toLowerCase()}). Confirma que los datos de identificación corresponden al artista o a los integrantes.</div>
                </div>
              )}
            </section>
          )}

          <section className="card" aria-labelledby="h-notas">
            <NotasInternas proyectoId={rec.id} notas={rec.notas} />
          </section>

          <section className="card" aria-labelledby="h-hist">
            <div className="card-head"><h3 id="h-hist">Historial</h3></div>
            <ol className="timeline">
              {[...rec.historial].reverse().map((h) => (
                <li key={h.id} className={h.privado ? "priv" : ""}>
                  <strong>{h.accion}</strong>{h.detalle ? <>{h.detalle}<br /></> : null}
                  <small>{h.autor} · {fmtDateTime(h.fecha)}</small>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
