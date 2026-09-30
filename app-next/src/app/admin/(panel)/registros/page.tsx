import Link from "next/link";
import { obtenerTodos } from "@/lib/admin/queries";
import { idsConDuplicadoAbierto } from "@/lib/admin/duplicados";
import { calcularLista, filtrosPorDefecto, opcionesFiltro, regionDe, type FiltrosLista } from "@/lib/admin/registrosLista";
import { fmtDate, fmtDateTime, lugar } from "@/lib/admin/formato";
import { ESTADOS_REGISTRO, acento } from "@/lib/catalogos";
import { requireAdmin } from "@/lib/admin/auth";
import FiltrosRegistros from "@/components/admin/FiltrosRegistros";
import RegistrosTabla, { type FilaRegistro } from "@/components/admin/RegistrosTabla";

type Query = Record<string, string | undefined>;

export default async function RegistrosPage({ searchParams }: { searchParams: Promise<Query> }) {
  const sp = await searchParams;
  const sesion = await requireAdmin();
  const todos = await obtenerTodos();
  const dup = await idsConDuplicadoAbierto(todos);

  const f: FiltrosLista = {
    ...filtrosPorDefecto(),
    estado: sp.estado ?? "todos",
    q: sp.q ?? "",
    tipo: sp.tipo ?? "todos",
    genero: sp.genero ?? "todos",
    region: sp.region ?? "todos",
    rango: sp.rango ?? "todos",
    sort: (sp.sort as FiltrosLista["sort"]) ?? "creado",
    dir: sp.dir === "1" ? 1 : -1,
    page: Number(sp.page ?? 1),
  };

  const registrosLista = todos.map((r) => ({
    id: r.id, creado: r.creado, estado: r.estado, tipo: r.tipo, genero: r.generoPrincipal, region: regionDe(r), rango: r.rangoContratacion,
    nombreProyecto: r.nombreProyecto, nombreCompleto: r.nombreCompleto, contactoNombre: r.contactoNombre, contactoEmail: r.contactoEmail,
    ciudad: r.ciudadActual, miembros: r.miembros.map((m) => m.nombre),
  }));
  const { counts, visibles, pages, page, slice } = calcularLista(registrosLista, f);
  const { generos, regiones } = opcionesFiltro(registrosLista);

  const porId = new Map(todos.map((r) => [r.id, r]));
  const filas: FilaRegistro[] = slice.map((r) => {
    const full = porId.get(r.id)!;
    return {
      id: r.id, nombreProyecto: r.nombreProyecto, tipo: r.tipo, numMiembros: full.miembros.length, genero: r.genero, acento: acento(r.genero), lugar: lugar(full), rango: r.rango,
      creadoIso: r.creado.toISOString(), creadoLabel: fmtDate(r.creado), creadoTitulo: fmtDateTime(r.creado), estado: r.estado, duplicado: dup.has(r.id),
    };
  });

  const from = visibles.length ? (page - 1) * 15 + 1 : 0;
  const hasta = Math.min(page * 15, visibles.length);

  const TABS: [string, string][] = [["todos", "Todos"], ...Object.entries(ESTADOS_REGISTRO)];
  const qsSinEstado = (estado: string) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.tipo && sp.tipo !== "todos") p.set("tipo", sp.tipo);
    if (sp.genero && sp.genero !== "todos") p.set("genero", sp.genero);
    if (sp.region && sp.region !== "todos") p.set("region", sp.region);
    if (sp.rango && sp.rango !== "todos") p.set("rango", sp.rango);
    if (estado !== "todos") p.set("estado", estado);
    const s = p.toString();
    return `/admin/registros${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <header className="adm-top">
        <div>
          <h1>Registros</h1>
          <span className="sub">Todas las respuestas del cuestionario de registro</span>
        </div>
        <div className="adm-top-actions">
          <a className="btn btn-ghost" href={`/api/admin/exportar?${new URLSearchParams(Object.entries(f).filter(([k, v]) => ["estado", "q", "tipo", "genero", "region", "rango"].includes(k) && v !== "todos" && v).map(([k, v]) => [k, String(v)])).toString()}`}>
            Exportar{visibles.length !== todos.length ? ` (${visibles.length})` : ""}
          </a>
          {sesion.rol === "admin" && (
            <a className="btn btn-ghost" href={`/api/admin/exportar?completo=1&${new URLSearchParams(Object.entries(f).filter(([k, v]) => ["estado", "q", "tipo", "genero", "region", "rango"].includes(k) && v !== "todos" && v).map(([k, v]) => [k, String(v)])).toString()}`}>
              Exportar completo
            </a>
          )}
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Estado del registro">
        {TABS.map(([k, l]) => (
          <Link key={k} href={qsSinEstado(k)} role="tab" aria-selected={f.estado === k}>
            {l}<span className="n">{counts[k] ?? 0}</span>
          </Link>
        ))}
      </div>

      <FiltrosRegistros generos={generos} regiones={regiones} />

      <RegistrosTabla filas={filas} sort={f.sort} dir={f.dir} page={page} pages={pages} from={from} hasta={hasta} total={visibles.length} />
    </>
  );
}
