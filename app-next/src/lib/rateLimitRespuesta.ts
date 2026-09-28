import { NextResponse } from "next/server";
import { limitarTasa, ipDeSolicitud } from "./rateLimit";

/** Devuelve una respuesta 429 si se superó el límite, o null si puede continuar. */
export function comprobarLimite(request: Request, ruta: string, limite: number, ventanaMs: number): NextResponse | null {
  const ip = ipDeSolicitud(request);
  const r = limitarTasa(`${ruta}:${ip}`, limite, ventanaMs);
  if (r.permitido) return null;
  return NextResponse.json(
    { ok: false, error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." },
    { status: 429, headers: { "Retry-After": String(r.reintentarEnSegundos) } },
  );
}
