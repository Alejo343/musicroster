"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarEstado } from "@/lib/admin/actions";
import { useModalMotivo } from "./useModalMotivo";
import { ESTADOS_REGISTRO, rangoLabel, TIPOS_PROYECTO } from "@/lib/catalogos";

export type FilaRegistro = {
  id: string;
  nombreProyecto: string;
  tipo: string;
  numMiembros: number;
  genero: string;
  ciudad: string;
  rango: string;
  creadoIso: string;
  creadoLabel: string;
  creadoTitulo: string;
  estado: keyof typeof ESTADOS_REGISTRO;
  duplicado: boolean;
};

export default function RegistrosTabla({
  filas, sort, dir, page, pages, from, hasta, total,
}: {
  filas: FilaRegistro[]; sort: string; dir: number; page: number; pages: number; from: number; hasta: number; total: number;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const router = useRouter();
  const params = useSearchParams();
  const [pendiente, iniciar] = useTransition();
  const { pedirConfirmacion, modal } = useModalMotivo();

  const toggle = (id: string) => setSel((prev) => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });
  const todosMarcados = filas.length > 0 && filas.every((f) => sel.has(f.id));

  const linkOrden = (campo: string) => {
    const p = new URLSearchParams(params.toString());
    p.set("sort", campo);
    p.set("dir", sort === campo && dir > 0 ? "-1" : campo === "nombre" && sort !== campo ? "1" : sort === campo ? "1" : "-1");
    return `/admin/registros?${p.toString()}`;
  };

  const linkPagina = (n: number) => {
    const p = new URLSearchParams(params.toString());
    p.set("page", String(n));
    return `/admin/registros?${p.toString()}`;
  };

  const flecha = (campo: string) => (sort === campo ? (dir > 0 ? "↑" : "↓") : "");

  const aplicarBulk = async (estado: "aprobado" | "correccion" | "rechazado") => {
    const ids = [...sel];
    const res = await pedirConfirmacion(estado, ids.length);
    if (!res) return;
    iniciar(async () => {
      await cambiarEstado(ids, estado, res.motivo);
      setSel(new Set());
      router.refresh();
    });
  };

  return (
    <>
      {modal}
      {sel.size > 0 && (
        <div className="bulk">
          <strong>{sel.size} {sel.size === 1 ? "registro seleccionado" : "registros seleccionados"}</strong>
          <button type="button" className="btn btn-ok btn-sm" disabled={pendiente} onClick={() => aplicarBulk("aprobado")}>Aprobar y publicar</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => aplicarBulk("correccion")}>Pedir corrección</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => aplicarBulk("rechazado")}>Rechazar</button>
          <a className="btn btn-ghost btn-sm" href={`/api/admin/exportar?ids=${[...sel].join(",")}`}>Exportar</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSel(new Set())}>Quitar selección</button>
        </div>
      )}

      <div className="card table-card">
        <div className="table-wrap">
          <table className="rt">
            <thead>
              <tr>
                <th className="chk">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar los registros de esta página"
                    checked={todosMarcados}
                    onChange={(e) => {
                      const marcar = e.target.checked;
                      setSel((prev) => {
                        const s = new Set(prev);
                        filas.forEach((f) => { if (marcar) s.add(f.id); else s.delete(f.id); });
                        return s;
                      });
                    }}
                  />
                </th>
                <th><Link href={linkOrden("nombre")}>Proyecto <span className="arr">{flecha("nombre")}</span></Link></th>
                <th>Tipo</th>
                <th>Género</th>
                <th>Ciudad</th>
                <th>Rango</th>
                <th><Link href={linkOrden("creado")}>Registrado <span className="arr">{flecha("creado")}</span></Link></th>
                <th><Link href={linkOrden("estado")}>Estado <span className="arr">{flecha("estado")}</span></Link></th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr><td colSpan={8}><div className="empty"><strong>No hay registros con estos filtros</strong>Prueba con otro estado o limpia los filtros.</div></td></tr>
              )}
              {filas.map((f) => (
                <tr key={f.id} className={sel.has(f.id) ? "is-selected" : ""}>
                  <td className="chk"><input type="checkbox" aria-label={`Seleccionar ${f.nombreProyecto}`} checked={sel.has(f.id)} onChange={() => toggle(f.id)} /></td>
                  <td className="col-proj">
                    <div className="proj">
                      <div>
                        <strong><Link href={`/admin/registros/${f.id}`}>{f.nombreProyecto}</Link></strong>
                        <small className="mono">{f.id}</small>
                      </div>
                    </div>
                  </td>
                  <td data-l="Tipo" className="nowrap">{TIPOS_PROYECTO[f.tipo as keyof typeof TIPOS_PROYECTO]}{f.numMiembros > 0 && <span className="muted"> · {f.numMiembros}</span>}</td>
                  <td data-l="Género">{f.genero}</td>
                  <td data-l="Ciudad">{f.ciudad}</td>
                  <td data-l="Rango" className="nowrap">{rangoLabel(f.rango)}</td>
                  <td data-l="Registrado" className="nowrap" title={f.creadoTitulo}>{f.creadoLabel}</td>
                  <td>
                    <span className={`badge st-${f.estado}`}>{ESTADOS_REGISTRO[f.estado]}</span>
                    {f.duplicado && <span className="flag">Duplicado</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>{total ? `${from}–${hasta} de ${total}` : "0 de 0"}</span>
          <div className="pages">
            <Link href={linkPagina(Math.max(1, page - 1))} aria-disabled={page === 1}>‹</Link>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span>…</span>}
                  <Link href={linkPagina(p)} aria-current={p === page ? "page" : undefined}>{p}</Link>
                </span>
              ))}
            <Link href={linkPagina(Math.min(pages, page + 1))} aria-disabled={page === pages}>›</Link>
          </div>
        </div>
      </div>
    </>
  );
}
