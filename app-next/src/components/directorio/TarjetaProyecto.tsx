import Link from "next/link";
import Portada from "./Portada";
import BotonGuardar from "./BotonGuardar";
import { lugar } from "@/lib/directorio/formato";
import type { PerfilPublico } from "@/lib/directorio/perfilPublico";

// link=false → versión decorativa sin enlaces ni botón de guardar (para el landing de /contratar).
export default function TarjetaProyecto({ p, link = true }: { p: PerfilPublico; link?: boolean }) {
  const cuerpo = (
    <>
      <Portada p={p} />
      <div className="pcard-body">
        <p className="pcard-meta">{p.tipoLabel} · {p.genero}</p>
        <h3>{p.nombre}</h3>
        <p className="pcard-place">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
          <span>{lugar(p.residencia)}</span>
        </p>
        <p className="pcard-rango"><span>Rango</span>{p.rangoLabel}</p>
      </div>
    </>
  );

  if (!link) {
    return <div className="pcard"><div className="pcard-link">{cuerpo}</div></div>;
  }

  return (
    <article className="pcard">
      <Link className="pcard-link" href={`/artista/${encodeURIComponent(p.id)}`}>{cuerpo}</Link>
      <BotonGuardar id={p.id} nombre={p.nombre} />
    </article>
  );
}
