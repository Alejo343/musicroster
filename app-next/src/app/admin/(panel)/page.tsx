import Link from "next/link";
import { obtenerTodos } from "@/lib/admin/queries";
import { idsConDuplicadoAbierto, contarCasosAbiertos } from "@/lib/admin/duplicados";
import { computeResumen } from "@/lib/admin/resumen";
import { ago, fmtDate, lugar, plural } from "@/lib/admin/formato";
import { TIPOS_PROYECTO, ESTADOS_REGISTRO, acento } from "@/lib/catalogos";

const RANGOS_PERIODO = [
  [7, "7 días"],
  [30, "30 días"],
  [90, "90 días"],
  [0, "Todo"],
] as const;

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "var(--cta)",
  correccion: "var(--st-correccion)",
  aprobado: "var(--st-aprobado)",
  rechazado: "var(--st-rechazado)",
};

function Hbars({ entries, href }: { entries: readonly (readonly [string, string, number])[]; href: (k: string) => string }) {
  if (!entries.length) return <p className="muted">Sin registros en este periodo.</p>;
  const max = Math.max(...entries.map((e) => e[2]));
  return (
    <div className="hbars">
      {entries.map(([k, label, n]) => (
        <Link className="hbar" href={href(k)} key={k}>
          <span className="name" title={label}>{label}</span>
          <span className="track"><i style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="val">{n}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function ResumenPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = rangeParam !== undefined ? Number(rangeParam) : 30;

  const todos = await obtenerTodos();
  const [dup, casosAbiertos] = await Promise.all([idsConDuplicadoAbierto(todos), contarCasosAbiertos(todos)]);
  const r = computeResumen(todos, range);

  const topDia = Math.ceil(r.dias.pico / (r.dias.pico <= 4 ? 1 : r.dias.pico <= 10 ? 2 : 5)) * (r.dias.pico <= 4 ? 1 : r.dias.pico <= 10 ? 2 : 5);

  return (
    <>
      <header className="adm-top">
        <div>
          <h1>Resumen</h1>
          <span className="sub">Registros de Billboard MusicRoster · {r.periodo}</span>
        </div>
        <div className="adm-top-actions">
          <div className="seg" role="group" aria-label="Periodo">
            {RANGOS_PERIODO.map(([v, l]) => (
              <Link key={v} href={`/admin?range=${v}`} aria-pressed={range === v}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="kpis">
        <div className="card kpi">
          <span className="lbl">Registros</span>
          <span className="num">{r.kpis.total}</span>
          <span className="foot">{r.kpis.totalDelta === null ? r.periodo : `${r.kpis.totalDelta >= 0 ? "+" : ""}${r.kpis.totalDelta}% frente al periodo anterior`}</span>
        </div>
        <Link className="card kpi hot" href="/admin/registros?estado=pendiente">
          <span className="lbl">Pendientes de revisión</span>
          <span className="num">{r.kpis.pendientes}</span>
          <span className="foot">{r.kpis.pendientes ? `El más antiguo espera desde ${ago(r.kpis.pendienteMasAntiguoFecha)}` : "Nada por revisar"}</span>
        </Link>
        <div className="card kpi">
          <span className="lbl">Publicados</span>
          <span className="num">{r.kpis.publicados}</span>
          <span className="foot">{r.kpis.total ? `${r.kpis.publicadosPct}% de los registros del periodo` : r.periodo}</span>
        </div>
        <Link className="card kpi" href="/admin/verificacion">
          <span className="lbl">Posibles duplicados</span>
          <span className="num">{casosAbiertos}</span>
          <span className="foot">{casosAbiertos ? "Casos abiertos por revisar" : "Sin casos abiertos"}</span>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="card span-8">
          <div className="card-head">
            <h2>Registros por día</h2>
            <span className="meta">{plural(r.kpis.total, "registro", "registros")} · pico de {r.dias.pico} en un día</span>
          </div>
          <div className="vbars">
            {r.dias.buckets.map((b, i) => (
              <div className={`col${b.n ? "" : " zero"}`} key={i} title={`${fmtDate(b.fecha)}: ${plural(b.n, "registro", "registros")}`}>
                <i style={{ height: `${(b.n / topDia) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="vbars-axis">
            <span>{fmtDate(r.dias.buckets[0].fecha)}</span>
            <span>{fmtDate(r.dias.buckets[Math.floor(r.dias.buckets.length / 2)].fecha)}</span>
            <span>{fmtDate(r.dias.buckets[r.dias.buckets.length - 1].fecha)}</span>
          </div>
        </section>

        <section className="card span-4">
          <div className="card-head"><h2>Estado</h2><span className="meta">registros del periodo</span></div>
          <div className="stack" aria-hidden="true">
            {r.estados.filter((e) => e.n).map((e) => (
              <i key={e.estado} style={{ flex: e.n, background: COLOR_ESTADO[e.estado] }} title={`${ESTADOS_REGISTRO[e.estado as keyof typeof ESTADOS_REGISTRO]}: ${e.n}`} />
            ))}
          </div>
          <div className="stack-legend">
            {r.estados.map((e) => (
              <Link href={`/admin/registros?estado=${e.estado}`} key={e.estado}>
                <span className="sw" style={{ background: COLOR_ESTADO[e.estado] }} />
                {ESTADOS_REGISTRO[e.estado as keyof typeof ESTADOS_REGISTRO]}
                <span className="n">{e.n}</span>
                <span className="p">{e.pct}%</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card span-4">
          <div className="card-head"><h2>Tipo de proyecto</h2></div>
          <Hbars entries={r.porTipo} href={(k) => `/admin/registros?tipo=${k}`} />
        </section>

        <section className="card span-4">
          <div className="card-head"><h2>Género principal</h2><span className="meta">los 8 más frecuentes</span></div>
          <Hbars entries={r.porGenero} href={(k) => `/admin/registros?genero=${encodeURIComponent(k)}`} />
        </section>

        <section className="card span-4">
          <div className="card-head"><h2>Territorio</h2><span className="meta">residencia actual</span></div>
          <Hbars entries={r.porTerritorio} href={(k) => `/admin/registros?region=${encodeURIComponent(k)}`} />
        </section>

        <section className="card span-6">
          <div className="card-head"><h2>Rango de contratación</h2><span className="meta">COP</span></div>
          <Hbars entries={r.porRango} href={(k) => `/admin/registros?rango=${k}`} />
        </section>

        <section className="card span-6">
          <div className="card-head"><h2>Quién hace el registro</h2></div>
          <div className="split">
            <div><strong>{r.quien.artista}</strong><span>El propio artista</span></div>
            <div><strong>{r.quien.terceros}</strong><span>Un tercero (integrante, manager, equipo…)</span></div>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: "14px 0 0" }}>
            Cuando registra un tercero, conviene confirmar que los datos de identificación corresponden al artista o a los integrantes.
          </p>
        </section>

        <section className="card span-12 table-card">
          <div className="card-head" style={{ padding: "20px 22px 0" }}>
            <h2>Últimos registros</h2>
            <Link className="meta" href="/admin/registros">Ver todos →</Link>
          </div>
          <div className="table-wrap">
            <table className="rt">
              <thead><tr><th>Proyecto</th><th>Ciudad</th><th>Registrado</th><th>Estado</th></tr></thead>
              <tbody>
                {todos.slice(0, 6).map((reg) => (
                  <tr key={reg.id}>
                    <td className="col-proj">
                      <div className="proj">
                        <span className="avatar" style={{ ["--c" as string]: `var(${acento(reg.generoPrincipal)})` }}>
                          {reg.nombreProyecto.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong><Link href={`/admin/registros/${reg.id}`}>{reg.nombreProyecto}</Link></strong>
                          <small>{TIPOS_PROYECTO[reg.tipo as keyof typeof TIPOS_PROYECTO]} · {reg.generoPrincipal}</small>
                        </div>
                      </div>
                    </td>
                    <td data-l="Ciudad">{lugar(reg)}</td>
                    <td data-l="Registrado" className="nowrap">{ago(reg.creado)}</td>
                    <td>
                      <span className={`badge st-${reg.estado}`}>{ESTADOS_REGISTRO[reg.estado as keyof typeof ESTADOS_REGISTRO]}</span>
                      {dup.has(reg.id) && <span className="flag">Duplicado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
