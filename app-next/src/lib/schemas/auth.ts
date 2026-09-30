import { z } from "zod";
import "../zod-es";

// Mismos campos que hoy pide acceso.html (tab "crear") — ver assets/js/contratar.js#pageAcceso.
export const crearCuentaCompradorSchema = z.object({
  nombre: z.string().trim().min(1, "Falta tu nombre."),
  email: z.string().trim().email("El correo no es válido."),
  whatsapp: z.string().trim().min(7, "El WhatsApp es muy corto."),
  sector: z.string().trim().optional(),
  organizacion: z.string().trim().optional(),
  cargo: z.string().trim().optional(),
  pais: z.string().trim().optional(),
  ciudad: z.string().trim().optional(),
  volver: z.string().trim().optional(),
});

export const solicitarEnlaceSchema = z.object({
  email: z.string().trim().email("El correo no es válido."),
  volver: z.string().trim().optional(),
});

export const loginAdminSchema = z.object({
  email: z.string().trim().email("El correo no es válido."),
  password: z.string().min(1, "Falta la contraseña."),
});
