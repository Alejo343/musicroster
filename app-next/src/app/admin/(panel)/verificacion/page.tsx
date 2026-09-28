import Link from "next/link";
import { obtenerTodos } from "@/lib/admin/queries";
import { calcularDuplicados, type Kind } from "@/lib/admin/duplicados";
import { fmtDateTime, mask } from "@/lib/admin/formato";
import { ESTADOS_REGISTRO, acento } from "@/lib/catalogos";
import { BotonesCaso, BotonRechazarDuplicado } from "@/components/admin/CasoDuplicadoAcciones";

const KIND_INFO: Record<Kind, [string, string]> = {
  documento: ["Mismo número de documento", "Una misma persona aparece en más de un registro. Puede ser un integrante que también es solista (válido) o una suplantación."],
  nombre: ["Mismo nombre de proyecto", "El proyecto pudo registrarse dos veces, por ejemplo una vez el artista y otra su manager."],
  email: ["Mismo correo de contacto", "Varios proyectos comparten contacto. Suele ser un mismo manager o sello: revisa que no sea un duplicado."],
};

export default async function VerificacionPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "cerrados" ? "cerrados" : "abiertos";

  const todos = await obtenerTodos();
  const casos = await calcularDuplicados(todos);
  const abiertos = casos.filter((c) => !c.dismissed && !c.resolved);
  const cerrados = casos.filter((c) => c.dismissed || c.resolved);
  const lista = tab === "abiertos" ? abiertos : cerrados;

  return (
    <>
      <header className="adm-top">
        <div>
          <h1>Verificación</h1>
          <span className="sub">Registros que comparten documento, nombre del proyecto o contacto</span>
        </div>
      </header>

      <div className="alert info" style={{ marginBottom: 18 }}>
        <div>
          Una coincidencia no siempre es un error: un integrante puede tener también un proyecto solista y un manager puede llevar varios artistas.
          Revisa cada caso y marca <b>No es duplicado</b> o rechaza el registro que sobra. Los documentos se muestran enmascarados; para verlos
          completos abre el registro.
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Casos">
        <Link href="/admin/verificacion?tab=abiertos" role="tab" aria-selected={tab === "abiertos"}>Por revisar<span className="n">{abiertos.length}</span></Link>
        <Link href="/admin/verificacion?tab=cerrados" role="tab" aria-selected={tab === "cerrados"}>Resueltos<span className="n">{cerrados.length}</span></Link>
      </div>

      <div>
        {lista.length === 0 && (
          <div className="card empty">
            <strong>{tab === "abiertos" ? "No hay casos por revisar" : "Aún no hay casos resueltos"}</strong>
            {tab === "abiertos" && "Cuando dos registros compartan documento, nombre o contacto aparecerán aquí."}
          </div>
        )}
        {lista.map((c) => {
          const titulo = KIND_INFO[c.kind][0];
          const ayuda = KIND_INFO[c.kinds.includes("nombre") ? "nombre" : c.kind][1];
          return (
            <section className={`card vgroup ${tab === "cerrados" ? "resolved" : ""}`} id={c.key} key={c.key}>
              <div className="vgroup-head">
                <span className="flag">{c.kinds.length > 1 ? `${c.kinds.length} coincidencias` : "Coincidencia"}</span>
                <h3>{titulo}{c.kinds.slice(1).map((k) => ` + ${KIND_INFO[k][0].toLowerCase()}`).join("")}</h3>
                <div className="actions">
                  <BotonesCaso caseKey={c.key} dismissed={c.dismissed} resolved={c.resolved} />
                </div>
                <p>{ayuda}</p>
              </div>
              <div className="vcols">
                {c.items.map((r, i) => {
                  const docs = c.docs[r.id] ?? [];
                  const coincideEmail = c.kinds.includes("email");
                  return (
                    <div className="vcol" key={r.id}>
                      <div className="proj">
                        <span className="avatar" style={{ ["--c" as string]: `var(${acento(r.generoPrincipal)})` }}>{r.nombreProyecto.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong><Link href={`/admin/registros/${r.id}`}>{r.nombreProyecto}</Link></strong>
                          <small className="mono">{r.id}</small>
                        </div>
                      </div>
                      <dl>
                        <div><dt>Estado</dt><dd><span className={`badge st-${r.estado}`}>{ESTADOS_REGISTRO[r.estado]}</span></dd></div>
                        <div><dt>Registrado</dt><dd>{fmtDateTime(r.creado)}{i === 0 && <span className="muted"> · primero</span>}</dd></div>
                        <div><dt>Tipo</dt><dd>{r.tipo} · {r.generoPrincipal}</dd></div>
                        {docs.length > 0 && (
                          <div>
                            <dt>{docs.length > 1 ? `${docs.length} documentos coinciden` : "Documento que coincide"}</dt>
                            {docs.slice(0, 2).map((d, di) => (
                              <span key={di}>
                                <dd className="match mono">{d.tipo} {mask(d.numero)}</dd>
                                <dd style={{ fontWeight: 500 }}>{d.persona}{r.identidad === "colectivo" ? " (integrante)" : " (titular)"}</dd>
                              </span>
                            ))}
                            {docs.length > 2 && <dd className="muted" style={{ fontWeight: 500 }}>y {docs.length - 2} más</dd>}
                          </div>
                        )}
                        <div><dt>Contacto</dt><dd className={coincideEmail ? "match" : ""}>{r.contactoEmail}</dd></div>
                        <div><dt>Registrado por</dt><dd>{r.quienRegistra}{r.registranteNombre ? ` · ${r.registranteNombre}` : ""}</dd></div>
                      </dl>
                      {!c.dismissed && !c.resolved && r.estado !== "rechazado" && (
                        <BotonRechazarDuplicado id={r.id} nombreOriginal={c.items.find((x) => x.id !== r.id)?.id ?? ""} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
