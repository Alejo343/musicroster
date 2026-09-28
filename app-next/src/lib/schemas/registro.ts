// Reglas de validación del cuestionario de registro — servidor como fuente de verdad.
// Espeja las reglas hoy aplicadas en el cliente por assets/js/registro.js (validateStep) y
// las declaraciones del anexo "Aceptaciones del formulario" (reglamento.html).
import { z } from "zod";
import { TIPOS_PROYECTO, TIPOS_DOCUMENTO, ROLES_INTEGRANTE, PLATAFORMAS_MUSICA, PLATAFORMAS_REDES } from "../catalogos";

const tipoProyectoKeys = Object.keys(TIPOS_PROYECTO) as [string, ...string[]];
const tipoDocumentoKeys = Object.keys(TIPOS_DOCUMENTO) as [string, ...string[]];
const rolKeys = Object.keys(ROLES_INTEGRANTE) as [string, ...string[]];
const plataformaMusicaKeys = PLATAFORMAS_MUSICA.map(([v]) => v) as [string, ...string[]];
const plataformaRedKeys = PLATAFORMAS_REDES.map(([v]) => v) as [string, ...string[]];

export const enlaceSchema = z.object({
  plataforma: z.string().min(1),
  url: z.string().trim().min(1),
});

// Un integrante oficial (Art. 9 del Reglamento): mayor de 18, con documento propio.
export const integranteSchema = z.object({
  nombre: z.string().trim().min(1, "Falta el nombre del integrante."),
  tipoDocumento: z.enum(tipoDocumentoKeys),
  numeroDocumento: z.string().trim().min(4, "El número de documento es muy corto."),
  paisExpedicion: z.string().trim().min(1),
  rol: z.enum(rolKeys),
  rolOtro: z.string().trim().optional(),
}).superRefine((m, ctx) => {
  if (m.rol === "otro" && !m.rolOtro?.trim()) {
    ctx.addIssue({ code: "custom", path: ["rolOtro"], message: "Especifica el rol." });
  }
});

export const registroSchema = z
  .object({
    tipo: z.enum(tipoProyectoKeys),
    otroDescripcion: z.string().trim().optional(),
    otroComposicion: z.enum(["individual", "colectivo"]).optional(),

    nombreProyecto: z.string().trim().min(1, "Falta el nombre del proyecto."),
    generoPrincipal: z.string().trim().min(1, "Selecciona el género principal."),
    otrosGeneros: z.array(z.string()).max(4, "Máximo 4 géneros asociados.").default([]),
    otroGenero: z.string().trim().optional(),

    nacionalidad: z.string().trim().min(1),
    paisResidencia: z.string().trim().min(1),
    regionResidencia: z.string().trim().min(1),
    ciudadActual: z.string().trim().min(1),
    paisOrigen: z.string().trim().min(1),
    regionOrigen: z.string().trim().min(1),
    ciudadOrigen: z.string().trim().min(1),

    // Identidad individual (solista/DJ, o "otro" con composición individual)
    nombreCompleto: z.string().trim().optional(),
    tipoDocumento: z.enum(tipoDocumentoKeys).optional(),
    numeroDocumento: z.string().trim().optional(),
    paisExpedicion: z.string().trim().optional(),

    // Identidad colectiva
    miembros: z.array(integranteSchema).optional(),
    liderIndex: z.number().int().min(0).optional(),

    plataformaMusical: z.enum(plataformaMusicaKeys),
    enlaceMusical: z.string().trim().url("El enlace musical no es una URL válida."),
    otrosEnlaces: z.array(enlaceSchema).default([]),
    redSocialTipo: z.enum(plataformaRedKeys),
    redSocial: z.string().trim().min(1),
    otrasRedes: z.array(enlaceSchema).default([]),

    foto: z.string().optional(), // se valida aparte (mime/tamaño) al subir el archivo

    rangoContratacion: z.string().trim().min(1),

    contactoNombre: z.string().trim().min(1),
    contactoWhatsapp: z.string().trim().min(7, "El WhatsApp de contacto es muy corto."),
    contactoEmail: z.string().trim().email("El correo de contacto no es válido."),

    quienRegistra: z.string().trim().min(1),
    registranteNombre: z.string().trim().optional(),
    registranteEmail: z.string().trim().email().optional().or(z.literal("")),
    registranteWhatsapp: z.string().trim().optional(),

    // Anexo "Aceptaciones del formulario" (reglamento.html): las 4 primeras y las 2 últimas
    // son siempre obligatorias; declIntegrantes solo cuando se suministran datos de terceros.
    declInfo: z.literal(true, { message: "Debes declarar que la información es verdadera." }),
    declAutorizado: z.literal(true, { message: "Debes declarar que estás autorizado a registrar el proyecto." }),
    declIntegrantes: z.boolean().default(false),
    declMayoria: z.literal(true, { message: "Todas las personas involucradas deben ser mayores de 18 años (Art. 60)." }),
    declDatos: z.literal(true, { message: "Debes autorizar el tratamiento de datos." }),
    declReglamento: z.literal(true, { message: "Debes aceptar el Reglamento." }),
  })
  .superRefine((data, ctx) => {
    const identidad =
      data.tipo === "solista" || data.tipo === "dj"
        ? "individual"
        : data.tipo === "otro"
          ? data.otroComposicion
          : "colectivo";

    if (data.tipo === "otro" && !data.otroComposicion) {
      ctx.addIssue({ code: "custom", path: ["otroComposicion"], message: "Indica si el proyecto es individual o colectivo." });
    }
    if (data.tipo === "otro" && !data.otroDescripcion?.trim()) {
      ctx.addIssue({ code: "custom", path: ["otroDescripcion"], message: "Describe el tipo de proyecto." });
    }

    if (identidad === "individual") {
      if (!data.nombreCompleto?.trim()) ctx.addIssue({ code: "custom", path: ["nombreCompleto"], message: "Falta el nombre completo del titular." });
      if (!data.tipoDocumento) ctx.addIssue({ code: "custom", path: ["tipoDocumento"], message: "Falta el tipo de documento." });
      if (!data.numeroDocumento?.trim()) ctx.addIssue({ code: "custom", path: ["numeroDocumento"], message: "Falta el número de documento." });
      if (!data.paisExpedicion?.trim()) ctx.addIssue({ code: "custom", path: ["paisExpedicion"], message: "Falta el país de expedición." });
    } else if (identidad === "colectivo") {
      const miembros = data.miembros ?? [];
      if (miembros.length < 2) {
        ctx.addIssue({ code: "custom", path: ["miembros"], message: "Se necesitan al menos 2 integrantes oficiales." });
      }
      if (data.liderIndex == null || data.liderIndex < 0 || data.liderIndex >= miembros.length) {
        ctx.addIssue({ code: "custom", path: ["liderIndex"], message: "Selecciona quién es el líder o director." });
      }
      // Suministrar datos de integrantes exige su autorización (declaración 3 del anexo).
      if (!data.declIntegrantes) {
        ctx.addIssue({ code: "custom", path: ["declIntegrantes"], message: "Debes declarar que cuentas con autorización de los integrantes." });
      }
    }

    // Un tercero (no el propio artista) registrando también exige la declaración 3.
    if (data.quienRegistra !== "artista" && identidad === "individual" && !data.declIntegrantes) {
      ctx.addIssue({ code: "custom", path: ["declIntegrantes"], message: "Debes declarar que cuentas con autorización de la persona registrada." });
    }
    if (data.quienRegistra !== "artista") {
      if (!data.registranteNombre?.trim()) ctx.addIssue({ code: "custom", path: ["registranteNombre"], message: "Falta el nombre de quien diligencia." });
      if (!data.registranteEmail?.trim()) ctx.addIssue({ code: "custom", path: ["registranteEmail"], message: "Falta el correo de quien diligencia." });
      if (!data.registranteWhatsapp?.trim()) ctx.addIssue({ code: "custom", path: ["registranteWhatsapp"], message: "Falta el WhatsApp de quien diligencia." });
    }

    if (data.generoPrincipal === "Otro" && !data.otroGenero?.trim()) {
      ctx.addIssue({ code: "custom", path: ["otroGenero"], message: "Especifica el género." });
    }
    if (data.otrosGeneros.includes(data.generoPrincipal) && data.generoPrincipal !== "Otro") {
      ctx.addIssue({ code: "custom", path: ["otrosGeneros"], message: "El género principal no debe repetirse en los asociados." });
    }
  });

export type RegistroInput = z.infer<typeof registroSchema>;
