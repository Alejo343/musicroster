// Crea una solicitud de contratación (Art. 30 del Reglamento) y avisa por correo al
// contacto de cada proyecto destinatario (o al equipo de MusicRoster si no se eligió
// ninguno — "Envía la solicitud sin proyectos", aside de solicitud.html).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesionComprador } from "@/lib/comprador/auth";
import { solicitudSchema, TIPOS_EVENTO } from "@/lib/schemas/solicitud";
import { generarReferencia } from "@/lib/referencia";
import { enviarCorreo } from "@/lib/email";
import { comprobarLimite } from "@/lib/rateLimitRespuesta";

export async function POST(request: Request) {
  const limitado = comprobarLimite(request, "solicitud", 10, 30 * 60 * 1000);
  if (limitado) return limitado;

  const sesion = await obtenerSesionComprador();
  if (!sesion) return NextResponse.json({ ok: false, error: "Debes iniciar sesión." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = solicitudSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errores: parsed.error.flatten() }, { status: 400 });
  }
  const datos = parsed.data;

  const proyectos = datos.proyectos.length
    ? await prisma.project.findMany({ where: { id: { in: datos.proyectos }, estado: "aprobado" }, select: { id: true, nombreProyecto: true, contactoEmail: true } })
    : [];

  let ref = generarReferencia("SC");
  for (let intentos = 0; intentos < 5; intentos++) {
    if (!(await prisma.hiringRequest.findUnique({ where: { ref }, select: { id: true } }))) break;
    ref = generarReferencia("SC");
  }

  await prisma.hiringRequest.create({
    data: {
      ref,
      buyerAccountId: sesion.sub,
      tipoEvento: datos.tipoEvento,
      fecha: datos.fechaFlexible ? null : datos.fecha,
      fechaFlexible: datos.fechaFlexible,
      ciudad: datos.ciudad,
      lugar: datos.lugar || null,
      aforo: null, // el aforo es un rango de texto (p. ej. "500 – 2.000"), no un número
      duracion: datos.duracion || null,
      presupuesto: datos.presupuesto || null,
      incluye: datos.incluye,
      mensaje: datos.mensaje,
      solicitanteNombre: datos.solicitanteNombre,
      solicitanteSector: datos.solicitanteSector,
      solicitanteOrganizacion: datos.solicitanteOrganizacion || null,
      solicitanteCargo: datos.solicitanteCargo || null,
      solicitanteEmail: datos.solicitanteEmail,
      solicitanteWhatsapp: datos.solicitanteWhatsapp,
      aceptaDatos: datos.aceptaDatos,
      aceptaRango: datos.aceptaRango,
      aceptaReglamento: datos.aceptaReglamento,
      proyectos: { create: proyectos.map((p) => ({ projectId: p.id })) },
    },
  });

  const tipoEventoLabel = TIPOS_EVENTO.find(([v]) => v === datos.tipoEvento)?.[1] ?? datos.tipoEvento;
  const cuerpo = `<p>Nueva solicitud de contratación (${ref}) de <b>${datos.solicitanteNombre}</b> — ${tipoEventoLabel} en ${datos.ciudad}.</p><p>${datos.mensaje}</p><p>Contacto: ${datos.solicitanteEmail} · ${datos.solicitanteWhatsapp}</p>`;

  if (proyectos.length) {
    await Promise.all(
      proyectos.map((p) => enviarCorreo({ to: p.contactoEmail, subject: `Nueva solicitud de contratación · ${p.nombreProyecto}`, html: cuerpo })),
    );
  } else if (process.env.NOTIFICACIONES_ADMIN) {
    await enviarCorreo({ to: process.env.NOTIFICACIONES_ADMIN, subject: `Nueva solicitud sin proyectos · ${ref}`, html: cuerpo });
  }

  return NextResponse.json({ ok: true, ref });
}
