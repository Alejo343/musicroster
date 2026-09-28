"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cambiarEstado, descartarDuplicado, reabrirDuplicado } from "@/lib/admin/actions";
import { useModalMotivo } from "./useModalMotivo";

export function BotonesCaso({ caseKey, dismissed, resolved }: { caseKey: string; dismissed: boolean; resolved: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  if (dismissed) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => iniciar(async () => { await reabrirDuplicado(caseKey); router.refresh(); })}>
        Reabrir
      </button>
    );
  }
  if (resolved) return <span className="muted" style={{ fontSize: 13 }}>Resuelto: queda un solo registro activo</span>;
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => iniciar(async () => { await descartarDuplicado(caseKey); router.refresh(); })}>
      No es duplicado
    </button>
  );
}

export function BotonRechazarDuplicado({ id, nombreOriginal }: { id: string; nombreOriginal: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const { pedirConfirmacion, modal } = useModalMotivo();

  return (
    <>
      {modal}
      <button
        type="button"
        className="btn btn-danger btn-sm"
        disabled={pendiente}
        onClick={async () => {
          const res = await pedirConfirmacion("rechazado", 1, `Registro duplicado de ${nombreOriginal}.`);
          if (!res) return;
          iniciar(async () => { await cambiarEstado([id], "rechazado", res.motivo); router.refresh(); });
        }}
      >
        Rechazar como duplicado
      </button>
    </>
  );
}
