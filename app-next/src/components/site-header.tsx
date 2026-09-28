// Header común a las páginas públicas (antes duplicado a mano en cada .html — ver CLAUDE.md).
// Un cambio de navegación ahora se hace en un solo lugar.
import Link from "next/link";

type Item = { href: string; label: string; activo?: boolean; claseExtra?: string };

// Los enlaces a rutas aún no portadas (buscar/contratar/registro) quedan como en el sitio
// estático original hasta que lleguen sus fases; los ya portados usan su ruta limpia de Next.js.
const NAV: { href: string; label: string; pagina?: string }[] = [
  { href: "/#inicio", label: "Inicio" },
  { href: "buscar.html", label: "Buscar artistas" },
  { href: "contratar.html", label: "Contratar" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/faq", label: "FAQ", pagina: "faq" },
  { href: "/reglamento", label: "Reglamento", pagina: "reglamento" },
  { href: "/bmic", label: "BMIC", pagina: "bmic" },
];

export type PaginaActiva = "inicio" | "faq" | "reglamento" | "bmic" | "politica-datos" | "registro" | null;

export default function SiteHeader({ activa = null, top = false }: { activa?: PaginaActiva; top?: boolean }) {
  const items: Item[] = NAV.map((n) => ({
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
                <a href={it.href} className={it.claseExtra} aria-current={it.activo ? "page" : undefined}>
                  {it.label}
                </a>
              </li>
            ))}
            <li className="nav-cta-mobile">
              <a href="/registro" aria-current={activa === "registro" ? "page" : undefined}>Regístrate</a>
            </li>
          </ul>
        </nav>

        <a className="btn btn-cta header-cta" href="/registro" aria-current={activa === "registro" ? "page" : undefined}>
          Regístrate
        </a>
        <button className="nav-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menú">
          <span></span>
        </button>
      </div>
    </header>
  );
}
