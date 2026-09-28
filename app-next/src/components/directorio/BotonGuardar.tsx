"use client";

import { useCarrito } from "@/lib/directorio/useCarrito";

export default function BotonGuardar({ id, nombre, conEtiqueta = false }: { id: string; nombre: string; conEtiqueta?: boolean }) {
  const { ids, toggle } = useCarrito();
  const on = ids.includes(id);

  return (
    <button
      type="button"
      className={`pcard-save${on ? " is-on" : ""}${conEtiqueta ? " btn btn-ghost btn-lg pf-save" : ""}`}
      aria-pressed={on}
      aria-label={conEtiqueta ? undefined : `${on ? "Quitar de" : "Agregar a"} tu lista: ${nombre}`}
      onClick={(e) => { e.preventDefault(); toggle(id); }}
    >
      {conEtiqueta ? <span>{on ? "En tu lista" : "Agregar a mi lista"}</span> : null}
    </button>
  );
}
