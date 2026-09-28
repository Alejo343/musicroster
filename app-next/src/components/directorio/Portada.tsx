import { iniciales } from "@/lib/directorio/formato";
import type { PerfilPublico } from "@/lib/directorio/perfilPublico";

// Portada tipográfica (sin fotografía real): color del género, iniciales y un punto
// por integrante — igual que hoy cover() en assets/js/contratar.js.
export default function Portada({ p, clase = "" }: { p: PerfilPublico; clase?: string }) {
  const n = Math.min(p.individual ? 1 : p.integrantes.length, 12);
  const s = n === 1 ? 34 : n === 2 ? 24 : n <= 5 ? 15 : 10;

  return (
    <div className={`cover ${clase}`} style={{ ["--a" as string]: `var(${p.acento})` }}>
      <span className="cover-genre">{p.genero}</span>
      {p.tipo === "dj" ? (
        <span className="cover-glyph is-dj" />
      ) : (
        <span className="cover-glyph" style={{ ["--s" as string]: `${s}px` }}>
          {Array.from({ length: n }, (_, i) => <i key={i} />)}
        </span>
      )}
      <span className="cover-ini">{iniciales(p.nombre)}</span>
    </div>
  );
}
