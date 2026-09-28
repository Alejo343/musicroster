"use client";

import { useState, useTransition } from "react";
import { restablecerDatosPrueba } from "@/lib/admin/actions";

export default function ResetTestDataButton() {
  const [pendiente, iniciar] = useTransition();
  const [hecho, setHecho] = useState(false);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <button
      type="button"
      className="adm-reset"
      disabled={pendiente}
      onClick={() => {
        if (!confirm("¿Restablecer los datos de prueba? Se borran todos los registros actuales.")) return;
        iniciar(async () => {
          await restablecerDatosPrueba();
          setHecho(true);
          setTimeout(() => setHecho(false), 2000);
        });
      }}
    >
      {pendiente ? "Restableciendo…" : hecho ? "Listo." : "Restablecer datos de prueba"}
    </button>
  );
}
