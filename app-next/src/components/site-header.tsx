// Header común a las páginas públicas (antes duplicado a mano en cada .html — ver CLAUDE.md).
// Un cambio de navegación ahora se hace en un solo lugar.
import Link from "next/link";
import HeaderEfectos from "./header-efectos";

type Item = { href: string; label: string; activo?: boolean; claseExtra?: string };

const NAV: { href: string; label: string; pagina?: string }[] = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/buscar", label: "Buscar artistas", pagina: "buscar" },
  { href: "/contratar", label: "Contratar", pagina: "contratar" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/faq", label: "FAQ", pagina: "faq" },
  { href: "/reglamento", label: "Reglamento", pagina: "reglamento" },
  { href: "/bmic", label: "BMIC", pagina: "bmic" },
];

export type PaginaActiva = "inicio" | "faq" | "reglamento" | "bmic" | "politica-datos" | "registro" | "buscar" | "contratar" | "artista" | "solicitud" | "acceso" | null;

// ocultar: hrefs de NAV que una página no muestra (p. ej. /buscar no enlaza a sí misma ni a "Cómo funciona").
export default function SiteHeader({ activa = null, top = false, ocultar = [] }: { activa?: PaginaActiva; top?: boolean; ocultar?: string[] }) {
  const items: Item[] = NAV.filter((n) => !ocultar.includes(n.href)).map((n) => ({
    href: n.href,
    label: n.label,
    activo: n.pagina === activa,
    claseExtra: n.pagina === "bmic" ? "nav-bmic" : undefined,
  }));

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
                <Link href={it.href} className={it.claseExtra} aria-current={it.activo ? "page" : undefined}>
                  {it.label}
                </Link>
              </li>
            ))}
            <li className="nav-cta-mobile">
              <Link href="/registro" aria-current={activa === "registro" ? "page" : undefined}>Regístrate</Link>
            </li>
          </ul>
        </nav>

        <Link className="btn btn-cta header-cta" href="/registro" aria-current={activa === "registro" ? "page" : undefined}>
          Regístrate
        </Link>
        <button className="nav-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menú">
          <span></span>
        </button>
        <HeaderEfectos />
      </div>
    </header>
  );
}
