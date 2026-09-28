"use client";

import { useState } from "react";
import { registrarAccesoPrivado } from "@/lib/admin/actions";
import { mask } from "@/lib/admin/formato";

export default function CampoSecreto({ proyectoId, valor, que }: { proyectoId: string; valor: string; que: string }) {
  const [revelado, setRevelado] = useState(false);
  if (!valor) return <span className="empty-val">Sin dato</span>;

  return (
    <span className="secret">
      <span className="mono">{revelado ? valor : mask(valor)}</span>
      {revelado ? (
        <button type="button" onClick={() => navigator.clipboard?.writeText(valor)}>Copiar</button>
      ) : (
        <button
          type="button"
          onClick={async () => {
            setRevelado(true);
            await registrarAccesoPrivado(proyectoId, que);
          }}
        >
          Mostrar
        </button>
      )}
    </span>
  );
}
