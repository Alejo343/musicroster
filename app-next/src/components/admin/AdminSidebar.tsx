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
          Resumen
        </Link>
        <Link href="/admin/registros" aria-current={activo("/admin/registros")}>
          Registros
          {pendientes > 0 && (
            <span className="count hot" title="Pendientes de revisión">
              {pendientes}
            </span>
          )}
        </Link>
        <Link href="/admin/verificacion" aria-current={activo("/admin/verificacion")}>
          Verificación
          {duplicadosAbiertos > 0 && (
            <span className="count hot" title="Posibles duplicados por revisar">
              {duplicadosAbiertos}
            </span>
          )}
        </Link>
        <Link href="/admin/solicitudes" aria-current={activo("/admin/solicitudes")}>
          Solicitudes de contratación
        </Link>
        <span className="adm-nav-label">Sitio</span>
        <a href="/" target="_blank" rel="noopener">
          Ver sitio público
        </a>
        <a href="/registro" target="_blank" rel="noopener">
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
