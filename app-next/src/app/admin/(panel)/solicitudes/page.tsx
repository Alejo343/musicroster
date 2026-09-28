import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/admin/formato";

export default async function SolicitudesPage() {
  const solicitudes = await prisma.hiringRequest.findMany({
    orderBy: { creado: "desc" },
    include: { buyerAccount: true, proyectos: { include: { project: { select: { id: true, nombreProyecto: true } } } } },
  });

  return (
    <>
      <header className="adm-top">
        <div>
          <h1>Solicitudes de contratación</h1>
          <span className="sub">Formularios enviados desde el directorio para quienes contratan</span>
        </div>
      </header>

      <div className="card table-card">
        <div className="table-wrap">
          <table className="rt">
            <thead>
              <tr><th>Referencia</th><th>Proyectos</th><th>Evento</th><th>Solicitante</th><th>Recibida</th></tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 && (
                <tr><td colSpan={5}><div className="empty"><strong>Aún no hay solicitudes</strong>Aparecerán aquí cuando alguien envíe el formulario de contratación.</div></td></tr>
              )}
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.ref}</td>
                  <td>
                    {s.proyectos.map((p, i) => (
                      <span key={p.projectId}>
                        {i > 0 && ", "}
                        <Link href={`/admin/registros/${p.projectId}`}>{p.project.nombreProyecto}</Link>
                      </span>
                    ))}
                  </td>
                  <td>{s.tipoEvento} · {s.ciudad}{s.fecha ? ` · ${s.fecha}` : s.fechaFlexible ? " · fecha flexible" : ""}</td>
                  <td>
                    <div>{s.solicitanteNombre}</div>
                    <small className="muted">{s.buyerAccount.email}</small>
                  </td>
                  <td className="nowrap">{fmtDateTime(s.creado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
