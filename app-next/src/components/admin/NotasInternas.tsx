"use client";

import { useRef, useTransition } from "react";
import { agregarNota } from "@/lib/admin/actions";
import { fmtDateTime } from "@/lib/admin/formato";

export default function NotasInternas({ proyectoId, notas }: { proyectoId: string; notas: { texto: string; autor: string; fecha: Date }[] }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <div className="card-head"><h3>Notas internas</h3></div>
      <form
        className="field"
        onSubmit={(e) => {
          e.preventDefault();
          const texto = ref.current?.value.trim();
          if (!texto) { ref.current?.focus(); return; }
          iniciar(async () => {
            await agregarNota(proyectoId, texto);
            if (ref.current) ref.current.value = "";
          });
        }}
      >
        <textarea ref={ref} rows={2} placeholder="Escribe una nota para el equipo" aria-label="Nueva nota interna" />
        <button type="submit" className="btn btn-dark btn-sm" style={{ justifySelf: "end" }} disabled={pendiente}>Agregar nota</button>
      </form>
      <div className="notes">
        {notas.length === 0 && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Sin notas. Solo las ve el equipo.</p>}
        {notas.slice().reverse().map((n, i) => (
          <div className="note" key={i}>{n.texto}<small>{n.autor} · {fmtDateTime(n.fecha)}</small></div>
        ))}
      </div>
    </>
  );
}
