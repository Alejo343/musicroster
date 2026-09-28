// Genera la referencia pública de un registro (MR-AAAA-XXXXXX), igual que hoy
// assets/js/registro.js cuando ENDPOINT es null.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusiones

export function generarReferencia(prefijo: "MR" | "SC", año = new Date().getFullYear()): string {
  let sufijo = "";
  for (let i = 0; i < 6; i++) sufijo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return `${prefijo}-${año}-${sufijo}`;
}
