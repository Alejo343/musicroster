// Siembra datos de prueba deterministas para desarrollo/staging.
// La generación en sí vive en generar-datos-prueba.ts (módulo puro, sin Prisma, testeable).
import { PrismaClient } from "@prisma/client";
import { generate } from "./generar-datos-prueba";

const prisma = new PrismaClient();

async function main() {
  const records = generate();

  await prisma.hiringRequestProject.deleteMany();
  await prisma.hiringRequest.deleteMany();
  await prisma.note.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.member.deleteMany();
  await prisma.project.deleteMany();
  await prisma.dismissedDuplicate.deleteMany();

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

  console.log(`Sembrados ${records.length} proyectos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
