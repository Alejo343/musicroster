// Header común a las páginas públicas (antes duplicado a mano en cada .html — ver CLAUDE.md).
// Un cambio de navegación ahora se hace en un solo lugar.
import Link from "next/link";
import HeaderEfectos from "./header-efectos";
import { BMIC_URL } from "@/lib/enlaces";

type Item = { href: string; label: string; activo?: boolean; claseExtra?: string; externo?: boolean };

const NAV: { href: string; label: string; pagina?: string; externo?: boolean }[] = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/contratar", label: "Contratar", pagina: "contratar" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/faq", label: "FAQ", pagina: "faq" },
  { href: "/reglamento", label: "Reglamento", pagina: "reglamento" },
  { href: BMIC_URL, label: "BMIC", externo: true },
];

export type PaginaActiva = "inicio" | "faq" | "reglamento" | "politica-datos" | "registro" | "buscar" | "contratar" | "artista" | "solicitud" | "acceso" | null;

// ocultar: hrefs que una página no muestra (p. ej. /buscar no enlaza a sí misma ni a "Cómo funciona").
// Las dos acciones principales van fuera del menú, como botones: "Buscar artistas" (quien contrata)
// y "Registrar proyecto" (artistas, la acción principal, en amarillo).
export default function SiteHeader({ activa = null, top = false, ocultar = [] }: { activa?: PaginaActiva; top?: boolean; ocultar?: string[] }) {
  const items: Item[] = NAV.filter((n) => !ocultar.includes(n.href)).map((n) => ({
    href: n.href,
    label: n.label,
    activo: n.pagina === activa,
    claseExtra: n.href === BMIC_URL ? "nav-bmic" : undefined,
    externo: n.externo,
  }));
  const conBuscar = !ocultar.includes("/buscar");

  return (
    <header className="site-header" id={top ? "top" : undefined}>
      <div className="wrap">
        <Link className="brand" href="/" aria-label="Billboard MusicRoster — Inicio">
          <span className="brand-bb">
            billboard<sup>®</sup>
          </span>
          <span className="brand-mr">
            MUSICROSTER<sup>®</sup>
          </span>
        </Link>

        <nav className="main-nav" id="main-nav" aria-label="Principal">
          <ul>
            {items.map((it) => (
              <li key={it.href}>
                {it.externo ? (
                  <a href={it.href} className={it.claseExtra} target="_blank" rel="noopener">
                    {it.label}
                  </a>
                ) : (
                  <Link href={it.href} className={it.claseExtra} aria-current={it.activo ? "page" : undefined}>
                    {it.label}
                  </Link>
                )}
              </li>
            ))}
            {conBuscar && (
              <li className="nav-cta-mobile nav-cta-sec">
                <Link href="/buscar" aria-current={activa === "buscar" ? "page" : undefined}>Buscar artistas</Link>
              </li>
            )}
            <li className="nav-cta-mobile">
              <Link href="/registro" aria-current={activa === "registro" ? "page" : undefined}>Registrar proyecto</Link>
            </li>
          </ul>
        </nav>

        <div className="header-ctas">
          {conBuscar && (
            <Link className="btn btn-ghost header-cta" href="/buscar" aria-current={activa === "buscar" ? "page" : undefined}>
              Buscar artistas
            </Link>
          )}
          <Link className="btn btn-cta header-cta" href="/registro" aria-current={activa === "registro" ? "page" : undefined}>
            Registrar proyecto
          </Link>
        </div>
        <button className="nav-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menú">
          <span></span>
        </button>
        <HeaderEfectos />
      </div>
    </header>
  );
}
