import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { obtenerPerfilesPublicos, obtenerPerfilPublico } from "@/lib/directorio/perfilPublico";
import { similares as calcularSimilares } from "@/lib/directorio/buscar";
import { requireComprador } from "@/lib/comprador/auth";
import PerfilArtista from "./PerfilArtista";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await obtenerPerfilPublico(id);
  return { title: p ? `${p.nombre} — Billboard MusicRoster` : "Perfil no disponible — Billboard MusicRoster" };
}

export default async function ArtistaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireComprador(`/artista/${id}`);
  const perfil = await obtenerPerfilPublico(id);

  if (!perfil) {
    return (
      <>
        <SiteHeader />
        <main>
          <section className="page-hero">
            <div className="wrap">
              <p className="kicker">Directorio</p>
              <h1 className="display">Perfil no disponible</h1>
              <p>Este proyecto no existe, todavía está en revisión o ya no está publicado.</p>
              <div className="hero-ctas"><Link className="btn btn-cta btn-lg" href="/buscar">Ir al directorio →</Link></div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const todos = await obtenerPerfilesPublicos();
  const sim = calcularSimilares(todos, id, 4);
  const mapa = Object.fromEntries(todos.map((p) => [p.id, { nombre: p.nombre, acento: p.acento }]));

  return (
    <>
      <SiteHeader />
      <main>
        <PerfilArtista p={perfil} similares={sim} mapa={mapa} />
      </main>
      <SiteFooter />
    </>
  );
}
