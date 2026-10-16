"use client";

import { useCarrito } from "@/lib/directorio/useCarrito";

export default function BotonGuardar({ id, nombre, conEtiqueta = false }: { id: string; nombre: string; conEtiqueta?: boolean }) {
  const { ids, toggle } = useCarrito();
  const on = ids.includes(id);

  // conEtiqueta (perfil de artista): botón en línea "btn btn-ghost pf-save". Sin etiqueta
  // (tarjetas del directorio): círculo "pcard-save" sobre la portada — base distinta, no se mezclan.
  return (
    <button
      type="button"
      className={`${conEtiqueta ? "btn btn-ghost btn-lg pf-save" : "pcard-save"}${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={conEtiqueta ? undefined : `${on ? "Quitar de" : "Agregar a"} tu lista: ${nombre}`}
      onClick={(e) => { e.preventDefault(); toggle(id); }}
    >
      <svg className="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      <svg className="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      {conEtiqueta && <span>{on ? "En tu lista" : "Agregar a mi lista"}</span>}
    </button>
  );
}
