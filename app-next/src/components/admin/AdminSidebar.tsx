"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { initials } from "@/lib/admin/formato";
import type { SesionAdmin } from "@/lib/auth/session";
import LogoutButton from "./LogoutButton";
import ResetTestDataButton from "./ResetTestDataButton";

type Props = {
  pendientes: number;
  duplicadosAbiertos: number;
  usuario: SesionAdmin;
};

export default function AdminSidebar({ pendientes, duplicadosAbiertos, usuario }: Props) {
  const pathname = usePathname();
  const activo = (href: string, exacto = false) =>
    (exacto ? pathname === href : pathname.startsWith(href)) ? "page" : undefined;

  return (
    <aside className="adm-side" aria-label="Menú del panel">
      <Link className="brand" href="/admin" aria-label="Billboard MusicRoster — Panel">
        <span className="brand-bb">
          billboard<sup>®</sup>
        </span>
        <span className="brand-mr">
          MUSICROSTER<sup>®</sup>
        </span>
      </Link>
      <span className="adm-tag">Administración</span>
      <nav className="adm-nav">
        <Link href="/admin" aria-current={activo("/admin", true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
          Resumen
        </Link>
        <Link href="/admin/registros" aria-current={activo("/admin/registros")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></svg>
          Registros
          {pendientes > 0 && (
            <span className="count hot" title="Pendientes de revisión">
              {pendientes}
            </span>
          )}
        </Link>
        <Link href="/admin/verificacion" aria-current={activo("/admin/verificacion")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
          Verificación
          {duplicadosAbiertos > 0 && (
            <span className="count hot" title="Posibles duplicados por revisar">
              {duplicadosAbiertos}
            </span>
          )}
        </Link>
        <Link href="/admin/solicitudes" aria-current={activo("/admin/solicitudes")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
          Solicitudes de contratación
        </Link>
        <span className="adm-nav-label">Sitio</span>
        <a href="/" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>
          Ver sitio público
        </a>
        <a href="/registro" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
          Formulario de registro
        </a>
      </nav>
      <div className="adm-side-foot">
        <div className="adm-user">
          <span className="av">{initials(usuario.nombre)}</span>
          <div>
            <strong>{usuario.nombre}</strong>
            <small>{usuario.rol === "admin" ? "Administradora" : "Moderadora"}</small>
          </div>
          <LogoutButton />
        </div>
        <ResetTestDataButton />
      </div>
    </aside>
  );
}
