"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./auth";
import { generate } from "../../../prisma/generar-datos-prueba";

const ACCION_ESTADO: Record<string, string> = {
  aprobado: "Aprobó y publicó el perfil",
  correccion: "Pidió corrección",
  rechazado: "Rechazó el registro",
  pendiente: "Devolvió a pendiente",
};

export async function cambiarEstado(ids: string[], estado: "pendiente" | "correccion" | "aprobado" | "rechazado", motivo = "") {
  const sesion = await requireAdmin();
  const conMotivo = estado === "correccion" || estado === "rechazado";
  for (const id of ids) {
    await prisma.project.update({
      where: { id },
      data: {
        estado,
        motivo: conMotivo ? motivo : null,
        historial: { create: { autor: sesion.email, accion: ACCION_ESTADO[estado], detalle: conMotivo ? motivo : null } },
      },
    });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/registros");
  ids.forEach((id) => revalidatePath(`/admin/registros/${id}`));
  revalidatePath("/admin/verificacion");
}

export async function agregarNota(id: string, texto: string) {
  const sesion = await requireAdmin();
  if (!texto.trim()) return;
  await prisma.note.create({ data: { projectId: id, autor: sesion.email, texto: texto.trim() } });
  revalidatePath(`/admin/registros/${id}`);
}

// Consultar un dato privado (documento) queda registrado, como exige la política de datos.
export async function registrarAccesoPrivado(id: string, que: string) {
  const sesion = await requireAdmin();
  await prisma.statusHistory.create({
    data: { projectId: id, autor: sesion.email, accion: "Consultó un dato privado", detalle: que, privado: true },
  });
  revalidatePath(`/admin/registros/${id}`);
}

export async function actualizarSeccion(id: string, patch: Record<string, string>, accion: string, detalle: string) {
  const sesion = await requireAdmin();
  if (Object.keys(patch).length === 0) return;
  await prisma.project.update({
    where: { id },
    data: { ...patch, historial: { create: { autor: sesion.email, accion, detalle } } },
  });
  revalidatePath(`/admin/registros/${id}`);
}

export async function descartarDuplicado(key: string) {
  await requireAdmin();
  await prisma.dismissedDuplicate.upsert({ where: { key }, create: { key }, update: {} });
  revalidatePath("/admin/verificacion");
}

export async function reabrirDuplicado(key: string) {
  await requireAdmin();
  await prisma.dismissedDuplicate.deleteMany({ where: { key } });
  revalidatePath("/admin/verificacion");
}

// Solo para desarrollo/staging: vuelve a generar el mismo lote de datos de prueba
// deterministas (ver prisma/seed.ts). Nunca disponible en producción.
export async function restablecerDatosPrueba() {
  await requireAdmin();
  if (process.env.NODE_ENV === "production") throw new Error("No disponible en producción.");

  const records = generate();
  await prisma.hiringRequestProject.deleteMany();
  await prisma.hiringRequest.deleteMany();
  await prisma.dismissedDuplicate.deleteMany();
  await prisma.note.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.member.deleteMany();
  await prisma.project.deleteMany();

  for (const rec of records) {
    await prisma.project.create({
      data: {
        id: rec.id,
        creado: new Date(rec.creado),
        estado: rec.estado,
        motivo: rec.motivo || null,
        tipo: rec.tipo,
        otroDescripcion: rec.otroDescripcion || null,
        otroComposicion: rec.otroComposicion,
        identidad: rec.identidad,
        nombreProyecto: rec.nombreProyecto,
        generoPrincipal: rec.generoPrincipal,
        otrosGeneros: rec.otrosGeneros,
        otroGenero: rec.otroGenero || null,
        nacionalidad: rec.nacionalidad,
        paisResidencia: rec.paisResidencia,
        regionResidencia: rec.regionResidencia,
        ciudadActual: rec.ciudadActual,
        paisOrigen: rec.paisOrigen,
        regionOrigen: rec.regionOrigen,
        ciudadOrigen: rec.ciudadOrigen,
        nombreCompleto: rec.nombreCompleto || null,
        tipoDocumento: rec.tipoDocumento || null,
        numeroDocumento: rec.numeroDocumento || null,
        paisExpedicion: rec.paisExpedicion || null,
        plataformaMusical: rec.plataformaMusical,
        enlaceMusical: rec.enlaceMusical,
        otrosEnlaces: rec.otrosEnlaces,
        redSocialTipo: rec.redSocialTipo,
        redSocial: rec.redSocial,
        otrasRedes: rec.otrasRedes,
        foto: rec.foto,
        rangoContratacion: rec.rangoContratacion,
        contactoNombre: rec.contactoNombre,
        contactoWhatsapp: rec.contactoWhatsapp,
        contactoEmail: rec.contactoEmail,
        quienRegistra: rec.quienRegistra,
        registranteNombre: rec.registranteNombre || null,
        registranteEmail: rec.registranteEmail || null,
        registranteWhatsapp: rec.registranteWhatsapp || null,
        declInfo: rec.declInfo,
        declAutorizado: rec.declAutorizado,
        declIntegrantes: rec.declIntegrantes,
        declMayoria: rec.declMayoria,
        declDatos: rec.declDatos,
        declReglamento: rec.declReglamento,
        miembros: {
          create: rec.miembros.map((m, i) => ({
            orden: i,
            nombre: m.nombre,
            tipoDocumento: m.tipoDocumento,
            numeroDocumento: m.numeroDocumento,
            paisExpedicion: m.paisExpedicion,
            rol: m.rol,
            rolOtro: m.rolOtro || null,
            esLider: i === 0 && rec.identidad === "colectivo",
          })),
        },
        historial: { create: rec.historial.map((h) => ({ fecha: new Date(h.fecha), autor: h.autor, accion: h.accion, detalle: h.detalle || null, privado: h.privado ?? false })) },
        notas: { create: rec.notas.map((n) => ({ fecha: new Date(n.fecha), autor: n.autor, texto: n.texto })) },
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registros");
  revalidatePath("/admin/verificacion");
}
