"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCarrito } from "@/lib/directorio/useCarrito";
import { iniciales } from "@/lib/directorio/formato";

// mapa: datos mínimos (nombre, acento) de los perfiles visibles en esta página, para poder
// pintar las iniciales de la selección sin otra ida al servidor.
export default function BarraSeleccion({ mapa }: { mapa: Record<string, { nombre: string; acento: string }> }) {
  const { ids } = useCarrito();

  // Deja espacio bajo el footer para que la barra fija no lo tape (body.has-sel-bar en globals.css).
  useEffect(() => {
    document.body.classList.toggle("has-sel-bar", ids.length > 0);
    return () => document.body.classList.remove("has-sel-bar");
  }, [ids.length]);

  if (!ids.length) return null;

  const ultimos = ids.slice(-4).filter((id) => mapa[id]);

  return (
    <div className="sel-bar">
      <div className="wrap">
        <div className="sel-bar-faces" aria-hidden="true">
          {ultimos.map((id) => (
            <span key={id} style={{ ["--a" as string]: `var(${mapa[id].acento})` }}>{iniciales(mapa[id].nombre)}</span>
          ))}
        </div>
        <p><b>{ids.length}</b> <span>{ids.length === 1 ? "proyecto en tu lista" : "proyectos en tu lista"}</span></p>
        <Link className="btn btn-cta" href="/solicitud">Solicitar disponibilidad</Link>
      </div>
    </div>
  );
}
