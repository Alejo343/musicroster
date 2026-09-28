"use client";

import { useState } from "react";
import { actualizarSeccion } from "@/lib/admin/actions";

export type CampoSeccion = {
  clave?: string;
  label: string;
  publico: boolean;
  full?: boolean;
  mostrar: React.ReactNode;
  input?: { tipo: "text" | "url" | "tel" | "email"; valor: string } | { tipo: "select"; opciones: [string, string][]; valor: string };
};

const Visibilidad = ({ pub }: { pub: boolean }) =>
  pub ? <span className="vis pub" title="Se muestra en el perfil público">Público</span> : <span className="vis priv" title="Solo lo ve el equipo de MusicRoster">Privado</span>;

export default function SeccionEditable({
  proyectoId, numero, titulo, campos, mismoPublico, accionEtiqueta, extra, declaraciones,
}: {
  proyectoId: string; numero: number; titulo: string; campos: CampoSeccion[]; mismoPublico?: boolean; accionEtiqueta: string;
  extra?: React.ReactNode; declaraciones?: React.ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(campos.filter((c) => c.clave && c.input).map((c) => [c.clave!, c.input!.valor])),
  );
  const [guardando, setGuardando] = useState(false);
  const puedeEditar = campos.some((c) => c.input);

  const guardar = async () => {
    const patch: Record<string, string> = {};
    const labels: string[] = [];
    campos.forEach((c) => {
      if (!c.clave || !c.input) return;
      const nuevo = valores[c.clave] ?? "";
      if (nuevo.trim() !== (c.input.valor ?? "").trim()) { patch[c.clave] = nuevo.trim(); labels.push(c.label); }
    });
    if (Object.keys(patch).length) {
      setGuardando(true);
      await actualizarSeccion(proyectoId, patch, `Editó ${accionEtiqueta}`, labels.join(", "));
      setGuardando(false);
    }
    setEditando(false);
  };

  return (
    <section className="card">
      <div className="card-head">
        <span className="sec-n">{numero}</span>
        <h3>{titulo}</h3>
        {mismoPublico && <Visibilidad pub={campos[0]?.publico ?? true} />}
        {puedeEditar && (
          editando ? (
            <span className="edit-btn" style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditando(false)} disabled={guardando}>Cancelar</button>
              <button type="button" className="btn btn-dark btn-sm" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
            </span>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm edit-btn" onClick={() => setEditando(true)}>Editar</button>
          )
        )}
      </div>

      {extra}

      {campos.length > 0 && (
        editando ? (
          <div className="field-grid kv-edit">
            {campos.map((c, i) => {
              if (!c.input) {
                return (
                  <div className={c.full ? "full" : ""} key={i}>
                    <dt>{c.label} {!mismoPublico && <Visibilidad pub={c.publico} />}</dt>
                    <dd>{c.mostrar}</dd>
                  </div>
                );
              }
              return (
                <div className={`field ${c.full ? "full" : ""}`} key={i}>
                  <label>{c.label} {!mismoPublico && <Visibilidad pub={c.publico} />}</label>
                  {c.input.tipo === "select" ? (
                    <select value={valores[c.clave!] ?? ""} onChange={(e) => setValores((v) => ({ ...v, [c.clave!]: e.target.value }))}>
                      {c.input.opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : (
                    <input type={c.input.tipo} value={valores[c.clave!] ?? ""} onChange={(e) => setValores((v) => ({ ...v, [c.clave!]: e.target.value }))} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <dl className="kv">
            {campos.map((c, i) => (
              <div className={c.full ? "full" : ""} key={i}>
                <dt>{c.label} {!mismoPublico && <Visibilidad pub={c.publico} />}</dt>
                <dd>{c.mostrar}</dd>
              </div>
            ))}
          </dl>
        )
      )}

      {declaraciones}
    </section>
  );
}
