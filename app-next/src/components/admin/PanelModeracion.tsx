"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cambiarEstado } from "@/lib/admin/actions";
import { useModalMotivo } from "./useModalMotivo";
import { ESTADOS_REGISTRO } from "@/lib/catalogos";

type Estado = keyof typeof ESTADOS_REGISTRO;

const ACCIONES: Record<Estado, Estado[]> = {
  pendiente: ["aprobado", "correccion", "rechazado"],
  correccion: ["aprobado", "rechazado", "pendiente"],
  aprobado: ["correccion", "pendiente", "rechazado"],
  rechazado: ["pendiente"],
};

const BOTON: Record<Estado, { texto: string; clase: string }> = {
  aprobado: { texto: "Aprobar y publicar", clase: "btn-ok" },
  correccion: { texto: "Pedir corrección", clase: "btn-ghost" },
  rechazado: { texto: "Rechazar", clase: "btn-danger" },
  pendiente: { texto: "Volver a pendiente", clase: "btn-ghost" },
};

export default function PanelModeracion({
  proyectoId, estado, motivo, ultimaAccionTexto,
}: {
  proyectoId: string; estado: Estado; motivo: string | null; ultimaAccionTexto: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const { pedirConfirmacion, modal } = useModalMotivo();

  const cambiar = async (nuevo: Estado) => {
    const res = await pedirConfirmacion(nuevo, 1);
    if (!res) return;
    iniciar(async () => {
      await cambiarEstado([proyectoId], nuevo, res.motivo);
      router.refresh();
    });
  };

  return (
    <>
      {modal}
      <div className="card-head"><h3>Moderación</h3></div>
      <div className="mod-status">
        <span className={`badge st-${estado}`}>{ESTADOS_REGISTRO[estado]}</span>
        <small className="muted">{ultimaAccionTexto}</small>
      </div>
      <div className="mod-actions">
        {ACCIONES[estado].map((a) => (
          <button key={a} type="button" className={`btn ${BOTON[a].clase}`} disabled={pendiente} onClick={() => cambiar(a)}>{BOTON[a].texto}</button>
        ))}
      </div>
      {motivo && <div className="mod-reason"><b>Motivo</b>{motivo}</div>}
      {estado === "aprobado" && <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>El perfil está visible en el buscador.</p>}
    </>
  );
}
