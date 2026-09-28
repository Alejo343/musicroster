// Solicitud de contratación (Art. 30 del Reglamento; política de datos secc. 5/6/7).
// Espeja las reglas hoy validadas a mano en assets/js/contratar.js (pageSolicitud → validar()).
import { z } from "zod";

const TIPOS_EVENTO = [
  "concierto", "matrimonio", "evento_corporativo", "fiesta_privada", "festival", "bar_club", "otro",
] as const;

export const solicitudSchema = z
  .object({
    proyectos: z.array(z.string().trim().min(1)).min(1, "Selecciona al menos un proyecto."),

    tipoEvento: z.enum(TIPOS_EVENTO, { message: "Selecciona el tipo de evento." }),
    fecha: z.string().trim().optional(),
    fechaFlexible: z.boolean().default(false),
    ciudad: z.string().trim().min(1, "Falta la ciudad del evento."),
    lugar: z.string().trim().optional(),
    aforo: z.number().int().positive().optional(),
    duracion: z.string().trim().optional(),
    presupuesto: z.string().trim().optional(),
    incluye: z.array(z.string()).default([]),
    mensaje: z.string().trim().min(1, "Cuéntanos brevemente el evento."),

    solicitanteNombre: z.string().trim().min(1, "Falta tu nombre."),
    solicitanteSector: z.string().trim().optional(),
    solicitanteOrganizacion: z.string().trim().optional(),
    solicitanteCargo: z.string().trim().optional(),
    solicitanteEmail: z.string().trim().email("El correo no es válido."),
    solicitanteWhatsapp: z.string().trim().min(7, "El WhatsApp es muy corto."),

    aceptaDatos: z.literal(true, { message: "Debes autorizar el tratamiento de datos." }),
    aceptaRango: z.literal(true, { message: "Debes aceptar que el rango es orientativo." }),
    aceptaReglamento: z.literal(true, { message: "Debes aceptar el Reglamento." }),
  })
  .superRefine((data, ctx) => {
    if (!data.fechaFlexible && !data.fecha?.trim()) {
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "Indica una fecha o marca que es flexible." });
    }
  });

export type SolicitudInput = z.infer<typeof solicitudSchema>;
