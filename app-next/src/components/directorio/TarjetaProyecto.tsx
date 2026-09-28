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
        <p className="pcard-place">{lugar(p.residencia)}</p>
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
