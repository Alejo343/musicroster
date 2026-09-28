// Solicitud de contratación (Art. 30 del Reglamento; política de datos secc. 5/6/7).
// Espeja las reglas hoy validadas a mano en assets/js/contratar.js (pageSolicitud → validar()).
import { z } from "zod";

// Mismos 6 tipos que hoy TIPOS_EVENTO en assets/js/contratar.js.
export const TIPOS_EVENTO = [
  ["festival", "Festival o concierto", "Programación abierta al público"],
  ["corporativo", "Evento corporativo", "Lanzamientos, convenciones, fiestas de empresa"],
  ["social", "Evento social", "Bodas, cumpleaños y celebraciones privadas"],
  ["publico", "Programación pública", "Agenda cultural, ferias y fiestas"],
  ["venue", "Bar, club o venue", "Fechas en sala o temporadas"],
  ["otro", "Otro", "Cuéntanos en los detalles"],
] as const;
const TIPO_EVENTO_KEYS = TIPOS_EVENTO.map(([v]) => v) as [string, ...string[]];

export const SECTORES_SOLICITANTE = [
  ["industria", "Industria musical (festival, promotor, booking, sello…)"],
  ["publico", "Entidad pública u operador de programa público"],
  ["privado", "Empresa, marca, hotel o agencia"],
  ["social", "Evento social o particular"],
  ["internacional", "Comprador o festival internacional"],
] as const;
const SECTOR_KEYS = SECTORES_SOLICITANTE.map(([v]) => v) as [string, ...string[]];

export const AFOROS = ["Menos de 100", "100 – 500", "500 – 2.000", "2.000 – 10.000", "Más de 10.000"] as const;
export const DURACIONES = ["Por definir", "Hasta 45 minutos", "1 hora", "1 hora 30 minutos", "2 horas o más", "Varias tandas"] as const;
export const QUE_INCLUYE = ["Sonido y luces", "Backline", "Transporte", "Alojamiento", "Alimentación"] as const;

export const solicitudSchema = z
  .object({
    // Puede ir vacío a propósito: "Envía la solicitud sin proyectos: el equipo de
    // MusicRoster puede sugerirte opciones" (aside de solicitud.html).
    proyectos: z.array(z.string().trim().min(1)).default([]),

    tipoEvento: z.enum(TIPO_EVENTO_KEYS, { message: "Selecciona el tipo de evento." }),
    fecha: z.string().trim().optional(),
    fechaFlexible: z.boolean().default(false),
    ciudad: z.string().trim().min(1, "Falta la ciudad del evento."),
    lugar: z.string().trim().optional(),
    aforo: z.enum(AFOROS, { message: "Elige un aproximado de asistentes." }),
    duracion: z.string().trim().optional(),
    presupuesto: z.string().trim().optional(),
    incluye: z.array(z.string()).default([]),
    mensaje: z.string().trim().min(1, "Cuéntanos brevemente el evento."),

    solicitanteNombre: z.string().trim().min(1, "Falta tu nombre."),
    solicitanteSector: z.enum(SECTOR_KEYS, { message: "Elige el sector." }),
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
