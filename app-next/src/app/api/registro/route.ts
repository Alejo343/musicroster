// Recibe el cuestionario de registro (multipart/form-data: campo "datos" en JSON + "foto").
// Crea el Project en estado "pendiente", igual que hoy simula assets/js/registro.js
// cuando ENDPOINT es null, pero ya persistido de verdad.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registroSchema, identidadDe } from "@/lib/schemas/registro";
import { validarFoto } from "@/lib/validarFoto";
import { guardarFoto } from "@/lib/storage";
import { generarReferencia } from "@/lib/referencia";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "Formulario inválido." }, { status: 400 });
  }

  const crudo = formData.get("datos");
  let json: unknown;
  try {
    json = JSON.parse(String(crudo));
  } catch {
    return NextResponse.json({ ok: false, error: "Formulario inválido." }, { status: 400 });
  }

  const parsed = registroSchema.safeParse(json);
  const foto = formData.get("foto");
  const errorFoto = validarFoto(foto instanceof File ? foto : null);

  if (!parsed.success || errorFoto) {
    return NextResponse.json(
      { ok: false, errores: parsed.success ? {} : parsed.error.flatten(), errorFoto },
      { status: 400 },
    );
  }
  const datos = parsed.data;
  const identidad = identidadDe(datos.tipo, datos.otroComposicion);
  if (!identidad) {
    return NextResponse.json({ ok: false, error: "No se pudo determinar la identidad del proyecto." }, { status: 400 });
  }

  const urlFoto = await guardarFoto(foto as File);

  let id = generarReferencia("MR");
  for (let intentos = 0; intentos < 5; intentos++) {
    if (!(await prisma.project.findUnique({ where: { id }, select: { id: true } }))) break;
    id = generarReferencia("MR");
  }

  const proyecto = await prisma.project.create({
    data: {
      id,
      estado: "pendiente",
      tipo: datos.tipo as never,
      otroDescripcion: datos.otroDescripcion || null,
      otroComposicion: datos.otroComposicion ?? null,
      identidad,
      nombreProyecto: datos.nombreProyecto,
      generoPrincipal: datos.generoPrincipal,
      otrosGeneros: datos.otrosGeneros,
      otroGenero: datos.otroGenero || null,
      nacionalidad: datos.nacionalidad,
      paisResidencia: datos.paisResidencia,
      regionResidencia: datos.regionResidencia,
      ciudadActual: datos.ciudadActual,
      paisOrigen: datos.paisOrigen,
      regionOrigen: datos.regionOrigen,
      ciudadOrigen: datos.ciudadOrigen,
      nombreCompleto: datos.nombreCompleto || null,
      tipoDocumento: datos.tipoDocumento ?? null,
      numeroDocumento: datos.numeroDocumento || null,
      paisExpedicion: datos.paisExpedicion || null,
      plataformaMusical: datos.plataformaMusical,
      enlaceMusical: datos.enlaceMusical,
      otrosEnlaces: datos.otrosEnlaces,
      redSocialTipo: datos.redSocialTipo,
      redSocial: datos.redSocial,
      otrasRedes: datos.otrasRedes,
      foto: urlFoto,
      rangoContratacion: datos.rangoContratacion,
      contactoNombre: datos.contactoNombre,
      contactoWhatsapp: datos.contactoWhatsapp,
      contactoEmail: datos.contactoEmail,
      quienRegistra: datos.quienRegistra,
      registranteNombre: datos.registranteNombre || null,
      registranteEmail: datos.registranteEmail || null,
      registranteWhatsapp: datos.registranteWhatsapp || null,
      declInfo: datos.declInfo,
      declAutorizado: datos.declAutorizado,
      declIntegrantes: datos.declIntegrantes,
      declMayoria: datos.declMayoria,
      declDatos: datos.declDatos,
      declReglamento: datos.declReglamento,
      miembros: identidad === "colectivo"
        ? {
            create: (datos.miembros ?? []).map((m, i) => ({
              orden: i,
              nombre: m.nombre,
              tipoDocumento: m.tipoDocumento,
              numeroDocumento: m.numeroDocumento,
              paisExpedicion: m.paisExpedicion,
              rol: m.rol,
              rolOtro: m.rolOtro || null,
              esLider: i === datos.liderIndex,
            })),
          }
        : undefined,
      historial: { create: [{ autor: "Formulario web", accion: "Registro recibido" }] },
    },
  });

  return NextResponse.json({ ok: true, id: proyecto.id });
}
