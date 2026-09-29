"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TarjetaProyecto from "@/components/directorio/TarjetaProyecto";
import BarraSeleccion from "@/components/directorio/BarraSeleccion";
import { buscarPerfiles, conteo, generosConConteo, type FiltrosBusqueda } from "@/lib/directorio/buscar";
import { iniciales } from "@/lib/directorio/formato";
import type { PerfilPublico } from "@/lib/directorio/perfilPublico";
import { TIPOS_PROYECTO } from "@/lib/catalogos";

const PRESUPUESTOS: [string, string][] = [
  ["0", "Hasta $2 M"], ["1", "Hasta $5 M"], ["2", "Hasta $10 M"], ["3", "Hasta $20 M"], ["4", "Hasta $50 M"], ["5", "Hasta $100 M"],
];
const POR_PAGINA = 24;

type Sesion = { email: string; nombre: string | null };

export default function BuscarApp({ todos, sesion }: { todos: PerfilPublico[]; sesion: Sesion }) {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [tipos, setTipos] = useState<string[]>((params.get("tipo") ?? "").split(",").filter(Boolean));
  const [genero, setGenero] = useState(params.get("genero") ?? "");
  const [territorio, setTerritorio] = useState<"residencia" | "origen">(params.get("territorio") === "origen" ? "origen" : "residencia");
  const [region, setRegion] = useState(params.get("region") ?? "");
  const [presupuesto, setPresupuesto] = useState(params.get("presupuesto") ?? "");
  const [segunEvento, setSegunEvento] = useState(params.get("segun") !== "0");
  const [orden, setOrden] = useState(params.get("orden") ?? "relevancia");
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const tiposConConteo = useMemo(() => conteo(todos, (p) => p.tipo), [todos]);
  const generos = useMemo(() => generosConConteo(todos), [todos]);
  const regiones = useMemo(() => conteo(todos, (p) => p[territorio].region), [todos, territorio]);
  const generosRapidos = useMemo(() => generos.slice(0, 8), [generos]);

  const filtros: FiltrosBusqueda = useMemo(
    () => ({ q, tipos, genero, territorio, region, presupuesto, segunEvento, orden: orden as FiltrosBusqueda["orden"] }),
    [q, tipos, genero, territorio, region, presupuesto, segunEvento, orden],
  );
  const resultados = useMemo(() => buscarPerfiles(todos, filtros), [todos, filtros]);

  // Sincroniza la URL para poder compartir/recargar la búsqueda, sin recargar la página.
  useEffect(() => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (tipos.length) u.set("tipo", tipos.join(","));
    if (genero) u.set("genero", genero);
    if (region) { u.set("region", region); if (territorio === "origen") u.set("territorio", "origen"); }
    if (presupuesto) { u.set("presupuesto", presupuesto); if (!segunEvento) u.set("segun", "0"); }
    if (orden !== "relevancia") u.set("orden", orden);
    const qs = u.toString();
    router.replace(qs ? `/buscar?${qs}` : "/buscar", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tipos, genero, territorio, region, presupuesto, segunEvento, orden]);

  // Con el panel de filtros abierto en móvil, bloquea el scroll de fondo (body.filters-open en globals.css).
  useEffect(() => {
    document.body.classList.toggle("filters-open", filtrosAbiertos);
    return () => document.body.classList.remove("filters-open");
  }, [filtrosAbiertos]);

  const cambiarFiltro = () => setVisibles(POR_PAGINA);

  const activos: [string, () => void][] = [];
  tipos.forEach((t) => activos.push([TIPOS_PROYECTO[t as keyof typeof TIPOS_PROYECTO], () => { setTipos((x) => x.filter((v) => v !== t)); cambiarFiltro(); }]));
  if (genero) activos.push([genero, () => { setGenero(""); cambiarFiltro(); }]);
  if (region) activos.push([`${territorio === "origen" ? "De" : "En"} ${region}`, () => { setRegion(""); cambiarFiltro(); }]);
  if (presupuesto) activos.push([PRESUPUESTOS.find((x) => x[0] === presupuesto)?.[1] ?? "", () => { setPresupuesto(""); cambiarFiltro(); }]);

  const limpiar = () => {
    setTipos([]); setGenero(""); setRegion(""); setPresupuesto(""); setSegunEvento(true);
    cambiarFiltro();
  };

  const mapa = useMemo(() => Object.fromEntries(todos.map((p) => [p.id, { nombre: p.nombre, acento: p.acento }])), [todos]);

  return (
    <>
      <section className="dir-hero">
        <div className="wrap">
          <div className="dir-hero-top">
            <p className="kicker">Directorio · Para quienes contratan</p>
            <p className="dir-cuenta">
              <span className="dir-cuenta-av" aria-hidden="true">{iniciales(sesion.nombre || sesion.email)}</span>
              <span>{(sesion.nombre ?? "").split(" ")[0] || sesion.email}</span>
              <button
                type="button"
                onClick={async () => { await fetch("/api/auth/comprador/salir", { method: "POST" }); router.push("/contratar"); router.refresh(); }}
              >
                Cerrar sesión
              </button>
            </p>
          </div>
          <h1 className="display">Encuentra el <span>proyecto</span> para tu evento</h1>
          <form className="dir-search" role="search" onSubmit={(e) => { e.preventDefault(); cambiarFiltro(); }}>
            <label className="sr-only" htmlFor="q">Buscar</label>
            <input type="search" id="q" placeholder="Nombre del proyecto, integrante o ciudad" autoComplete="off" value={q} onChange={(e) => { setQ(e.target.value); cambiarFiltro(); }} />
            <button className="btn btn-cta" type="submit">Buscar</button>
          </form>
          <div className="dir-quick" aria-label="Géneros con más proyectos">
            <span>Explora</span>
            <ul className="dir-quick-list">
              {generosRapidos.map(([g]) => (
                <li key={g}>
                  <a href="#" className={genero === g ? "is-on" : ""} onClick={(e) => { e.preventDefault(); setGenero(genero === g ? "" : g); cambiarFiltro(); }}>{g}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="dir-body">
        <div className="wrap dir-layout">
          <aside className={`dir-filters${filtrosAbiertos ? " is-open" : ""}`} aria-label="Filtros">
            <div className="dir-filters-head">
              <strong>Filtros</strong>
              <button className="btn-remove" type="button" onClick={limpiar}>Limpiar</button>
            </div>

            <fieldset className="dir-group">
              <legend>Tipo de proyecto</legend>
              <div className="tag-choices">
                {tiposConConteo.map(([k, n]) => (
                  <label key={k}>
                    <input
                      type="checkbox"
                      checked={tipos.includes(k)}
                      onChange={(e) => { setTipos((x) => (e.target.checked ? [...x, k] : x.filter((v) => v !== k))); cambiarFiltro(); }}
                    />
                    <span>{TIPOS_PROYECTO[k as keyof typeof TIPOS_PROYECTO]} <small>{n}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="dir-group field">
              <label htmlFor="f-genero">Género</label>
              <select id="f-genero" value={genero} onChange={(e) => { setGenero(e.target.value); cambiarFiltro(); }}>
                <option value="">Todos los géneros</option>
                {generos.map(([g, n]) => <option key={g} value={g}>{g} · {n}</option>)}
              </select>
            </div>

            <fieldset className="dir-group">
              <legend>Territorio</legend>
              <div className="dir-seg" role="radiogroup" aria-label="Buscar por">
                <label><input type="radio" checked={territorio === "residencia"} onChange={() => { setTerritorio("residencia"); setRegion(""); }} /><span>Dónde vive</span></label>
                <label><input type="radio" checked={territorio === "origen"} onChange={() => { setTerritorio("origen"); setRegion(""); }} /><span>De dónde es</span></label>
              </div>
              <div className="field">
                <label className="sr-only" htmlFor="f-region">Departamento o región</label>
                <select id="f-region" value={region} onChange={(e) => { setRegion(e.target.value); cambiarFiltro(); }}>
                  <option value="">Todo el territorio</option>
                  {regiones.map(([r, n]) => <option key={r} value={r}>{r} · {n}</option>)}
                </select>
              </div>
            </fieldset>

            <fieldset className="dir-group">
              <legend>Presupuesto por presentación</legend>
              <div className="field">
                <label className="sr-only" htmlFor="f-presupuesto">Presupuesto</label>
                <select id="f-presupuesto" value={presupuesto} onChange={(e) => { setPresupuesto(e.target.value); cambiarFiltro(); }}>
                  <option value="">Cualquier presupuesto</option>
                  {PRESUPUESTOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <label className="dir-check"><input type="checkbox" checked={segunEvento} onChange={(e) => { setSegunEvento(e.target.checked); cambiarFiltro(); }} /> Incluir los que cotizan según el evento</label>
              <p className="dir-hint">Valores en pesos colombianos. El rango es orientativo y se negocia con cada proyecto.</p>
            </fieldset>

            <button className="btn btn-ink dir-filters-done" type="button" onClick={() => setFiltrosAbiertos(false)}>
              {resultados.length ? `Ver ${resultados.length} ${resultados.length === 1 ? "proyecto" : "proyectos"}` : "Sin resultados"}
            </button>
          </aside>

          <div className="dir-results">
            <div className="dir-toolbar">
              <button className="btn dir-filters-toggle" type="button" aria-expanded={filtrosAbiertos} onClick={() => setFiltrosAbiertos(true)}>
                Filtros {activos.length > 0 && <b>{activos.length}</b>}
              </button>
              <p className="dir-count" aria-live="polite">
                <b>{resultados.length}</b> {resultados.length === 1 ? "proyecto" : "proyectos"}{q ? ` para "${q}"` : ""}
              </p>
              <div className="field dir-sort">
                <label className="sr-only" htmlFor="orden">Ordenar</label>
                <select id="orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="relevancia">Más relevantes</option>
                  <option value="recientes">Más recientes</option>
                  <option value="nombre">Nombre A–Z</option>
                  <option value="rango_asc">Rango: menor a mayor</option>
                  <option value="rango_desc">Rango: mayor a menor</option>
                </select>
              </div>
            </div>

            {activos.length > 0 && (
              <ul className="dir-active" aria-label="Filtros aplicados">
                {activos.map(([label, quitar], i) => (
                  <li key={i}><button type="button" onClick={quitar} aria-label={`Quitar filtro: ${label}`}>{label}<span aria-hidden="true">×</span></button></li>
                ))}
              </ul>
            )}

            <div className="pgrid">
              {resultados.slice(0, visibles).map((p) => <TarjetaProyecto p={p} key={p.id} />)}
            </div>

            {resultados.length === 0 && (
              <div className="dir-empty">
                <strong>No hay proyectos con esos filtros</strong>
                <p>Prueba con otro género, amplía el territorio o el presupuesto. También puedes enviarnos una solicitud y te ayudamos a encontrar opciones.</p>
                <div className="dir-empty-ctas">
                  <button className="btn btn-ink" type="button" onClick={limpiar}>Quitar filtros</button>
                  <Link className="btn btn-line" href="/solicitud">Enviar una solicitud</Link>
                </div>
              </div>
            )}

            {resultados.length > visibles && (
              <div className="dir-more">
                <button className="btn btn-line" type="button" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
                  Ver más proyectos ({resultados.length - visibles})
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <BarraSeleccion mapa={mapa} />
    </>
  );
}
