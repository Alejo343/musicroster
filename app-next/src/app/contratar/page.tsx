import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import TarjetaProyecto from "@/components/directorio/TarjetaProyecto";
import { obtenerPerfilesPublicos } from "@/lib/directorio/perfilPublico";
import { conteo, generosConConteo } from "@/lib/directorio/buscar";
import { RANGOS_CONTRATACION } from "@/lib/catalogos";

export const metadata: Metadata = {
  title: "Para quienes contratan — Billboard MusicRoster",
  description: "Busca proyectos musicales de todo el territorio por género, formato, ciudad y rango de contratación, y contáctalos directamente.",
};

export default async function ContratarPage() {
  const todos = await obtenerPerfilesPublicos();

  const vistos = new Set<string>();
  const muestra = todos.filter((p) => !vistos.has(p.acento) && vistos.add(p.acento)).slice(0, 3);

  const stats: [number, string][] = [
    [todos.length, "proyectos publicados"],
    [generosConConteo(todos).length, "géneros"],
    [conteo(todos, (p) => p.residencia.ciudad).length, "ciudades y municipios"],
    [conteo(todos, (p) => p.residencia.region).length, "departamentos y regiones"],
  ];

  const ejemplo = todos.find((p) => p.integrantes.length >= 3 && p.otrosGeneros.length) ?? todos[0];
  const porRango = Object.fromEntries(conteo(todos, (p) => p.rango));
  const maxRango = Math.max(1, ...Object.values(porRango));
  const generosDestacados = generosConConteo(todos).slice(0, 12);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="ct-hero">
          <div className="wrap ct-hero-grid">
            <div>
              <p className="kicker">Para quienes contratan</p>
              <h1 className="display ct-title">Encuentra.<br />Escucha.<br /><span>Contrata.</span></h1>
              <p className="ct-lead">Festivales, marcas, entidades públicas, venues y organizadores de eventos: busca proyectos musicales de todo el territorio por género, formato, ciudad y rango de contratación, y contáctalos directamente.</p>
              <div className="hero-ctas">
                <Link className="btn btn-cta btn-lg" href="/buscar">Buscar artistas</Link>
                <Link className="btn btn-ghost btn-lg" href="/acceso">Crear cuenta gratis</Link>
              </div>
              <p className="ct-login">Para buscar necesitas una cuenta gratuita. ¿Ya tienes una? <Link href="/acceso#ingresar">Ingresa</Link></p>
            </div>
            <div className="ct-stack" aria-hidden="true">
              {muestra.map((p) => <TarjetaProyecto p={p} link={false} key={p.id} />)}
            </div>
          </div>
          <div className="wrap">
            <dl className="ct-stats">
              {stats.map(([n, l]) => <div key={l}><dt>{l}</dt><dd>{n}</dd></div>)}
            </dl>
          </div>
        </section>

        <section className="fold on-paper ct-how">
          <div className="wrap">
            <p className="kicker"><span className="num">01</span> Cómo contratar</p>
            <h2 className="display ct-h2">Del buscador <em>al escenario</em></h2>
            <ol className="ct-steps">
              <li><span className="step-num">01</span><h3>Busca</h3><p>Crea tu cuenta gratis y filtra por género, tipo de proyecto, dónde vive o de dónde es, y por lo que puedes pagar por presentación.</p></li>
              <li><span className="step-num">02</span><h3>Revisa el perfil</h3><p>Escucha su música, conoce a sus integrantes y su territorio, y mira su rango de contratación antes de escribir.</p></li>
              <li><span className="step-num">03</span><h3>Contacta</h3><p>Escríbeles directo por WhatsApp o correo, o arma una lista y envía <strong>una sola solicitud</strong> a varios proyectos a la vez.</p></li>
            </ol>
          </div>
        </section>

        <section className="fold ct-profile">
          <div className="wrap ct-profile-grid">
            <div>
              <p className="kicker"><span className="num">02</span> Cada perfil</p>
              <h2 className="display ct-h2">Lo que necesitas <em>para decidir</em></h2>
              <ul className="ct-fields">
                <li><b>Música</b> Enlaces a sus plataformas y redes.</li>
                <li><b>Quiénes son</b> Nombre del solista, o integrantes con su rol y quién lidera.</li>
                <li><b>Territorio</b> Dónde vive el proyecto y de dónde viene.</li>
                <li><b>Rango</b> Cuánto cobra aproximadamente por una presentación en vivo.</li>
                <li><b>Contacto</b> Nombre, WhatsApp y correo de quien atiende las contrataciones.</li>
              </ul>
              <p className="ct-note">Cada registro pasa por una revisión administrativa para prevenir duplicados y suplantaciones antes de publicarse. No es una evaluación artística: la decisión es tuya.</p>
            </div>
            {ejemplo && <div className="ct-sample"><TarjetaProyecto p={ejemplo} /></div>}
          </div>
        </section>

        <section className="fold on-paper ct-range">
          <div className="wrap ct-range-grid">
            <div>
              <p className="kicker"><span className="num">03</span> Rango de contratación</p>
              <h2 className="display ct-h2">Un punto de partida, <em>no un precio</em></h2>
              <p>Cada proyecto informa cuánto cobra aproximadamente por una presentación en vivo, en pesos colombianos. Es una referencia para que sepas si vale la pena escribir; el valor final se negocia.</p>
              <p>Puede cambiar según:</p>
              <ul className="chips ct-chips">
                <li>Ciudad y país</li><li>Fecha</li><li>Duración</li><li>Formato</li><li>Número de integrantes</li>
                <li>Transporte</li><li>Alojamiento</li><li>Producción técnica</li><li>Exclusividad</li><li>Tipo de evento</li>
              </ul>
            </div>
            <figure className="ct-bars">
              <figcaption><strong>Proyectos por rango</strong><span>Directorio actual</span></figcaption>
              <ol>
                {RANGOS_CONTRATACION.map(([v, l]) => {
                  const n = porRango[v] ?? 0;
                  return <li key={v}><span>{l}</span><i style={{ ["--w" as string]: `${Math.round((n / maxRango) * 100)}%` }} /><b>{n}</b></li>;
                })}
              </ol>
            </figure>
          </div>
        </section>

        <section className="fold ct-who">
          <div className="wrap">
            <p className="kicker"><span className="num">04</span> Quién contrata</p>
            <h2 className="display ct-h2">Hecho para <em>cada comprador</em></h2>
            <div className="ct-buyers">
              <article className="ct-buyer" style={{ ["--c" as string]: "var(--g-salsa)" }}>
                <span className="u-tag">Industria</span>
                <h3>Festivales, promotores y booking</h3>
                <p>Arma carteles por género y territorio, descubre proyectos nuevos y cuadra fechas con quien atiende las contrataciones.</p>
              </article>
              <article className="ct-buyer" style={{ ["--c" as string]: "var(--g-vallenato)" }}>
                <span className="u-tag">Sector público</span>
                <h3>Alcaldías, gobernaciones y entidades culturales</h3>
                <p>Identifica la oferta musical de un municipio o región para la programación local.</p>
                <p className="ct-buyer-note">MusicRoster no reemplaza los procesos de contratación pública ni garantiza selección.</p>
              </article>
              <article className="ct-buyer" style={{ ["--c" as string]: "var(--g-popular)" }}>
                <span className="u-tag">Privados</span>
                <h3>Marcas, hoteles y eventos</h3>
                <p>Encuentra el formato adecuado para un evento corporativo, social o de temporada, dentro de tu presupuesto.</p>
              </article>
              <article className="ct-buyer" style={{ ["--c" as string]: "var(--g-electronica)" }}>
                <span className="u-tag">Internacional</span>
                <h3>Compradores y festivales de otros países</h3>
                <p>Descubre música colombiana por región de origen y conecta con los proyectos que quieres llevar a tu escenario.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="fold on-paper ct-rules">
          <div className="wrap ct-rules-grid">
            <div>
              <p className="kicker"><span className="num">05</span> Buenas prácticas</p>
              <h2 className="display ct-h2">Contacta <em>con respeto</em></h2>
            </div>
            <ul className="ct-rule-list">
              <li><b>Solo para oportunidades reales.</b> Los datos de contacto se publican para que puedas contratar. No los uses para envíos masivos, publicidad ni otros fines.</li>
              <li><b>Nada de copiar el directorio.</b> Está prohibido descargar, extraer o revender perfiles y listados de contacto.</li>
              <li><b>Condiciones claras.</b> Si una oportunidad llega por MusicRoster con condiciones conocidas y aceptadas, respétalas hasta el final.</li>
              <li><b>El artista decide.</b> Estar en el directorio no obliga a ningún proyecto a aceptar una propuesta.</li>
            </ul>
            <div className="doc-links">
              <Link href="/reglamento#art-30">Reglamento · Conexiones</Link>
              <Link href="/reglamento#art-45">Reglamento · Base de datos</Link>
              <Link href="/politica-datos">Política de datos</Link>
            </div>
          </div>
        </section>

        <section className="fold ct-finale">
          <div className="wrap">
            <h2 className="display">¿Qué suena en<br /><span>tu evento?</span></h2>
            <ul className="dir-quick-list ct-genres" aria-label="Explorar por género">
              {generosDestacados.map(([g, n]) => (
                <li key={g}><Link href={`/buscar?genero=${encodeURIComponent(g)}`}>{g} <small>{n}</small></Link></li>
              ))}
            </ul>
            <div className="finale-ctas">
              <Link className="btn btn-cta btn-lg" href="/buscar">Buscar artistas</Link>
              <Link className="btn btn-ghost btn-lg" href="/solicitud">Enviar una solicitud</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
