import "../../../styles/admin.css";
import { requireAdmin } from "@/lib/admin/auth";
import { contarPendientes, obtenerTodos } from "@/lib/admin/queries";
import { contarCasosAbiertos } from "@/lib/admin/duplicados";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMenuToggle from "@/components/admin/AdminMenuToggle";

export const metadata = { robots: "noindex, nofollow" };

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requireAdmin();
  const [pendientes, todos] = await Promise.all([contarPendientes(), obtenerTodos()]);
  const duplicadosAbiertos = await contarCasosAbiertos(todos);

  // admin.css define --side-w y otras variables bajo ".adm" (la clase que en el sitio
  // estático original lleva <body>). Aquí <body> es único y compartido, así que ese
  // alcance se reproduce envolviendo el panel en un div con la misma clase.
  return (
    <div className="adm">
      <div className="adm-shell">
        <AdminSidebar pendientes={pendientes} duplicadosAbiertos={duplicadosAbiertos} usuario={sesion} />
        <main className="adm-main">
          <AdminMenuToggle />
          {children}
        </main>
      </div>
    </div>
  );
}
