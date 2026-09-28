// Validación de la fotografía en el servidor — hoy assets/js/registro.js solo la valida
// en el cliente (photoProblem()); el servidor es la fuente de verdad real.
const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_MB = 5;

export function validarFoto(archivo: { type: string; size: number } | null | undefined): string | null {
  if (!archivo) return "Sube la fotografía oficial del proyecto.";
  if (!TIPOS_PERMITIDOS.has(archivo.type)) return "El archivo debe ser JPG, PNG o WEBP.";
  if (archivo.size > MAX_MB * 1024 * 1024) return `La imagen supera ${MAX_MB} MB.`;
  return null;
}
