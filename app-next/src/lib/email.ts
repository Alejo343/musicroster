// Correo transaccional (Resend). Sin RESEND_API_KEY configurado (p. ej. en desarrollo local)
// no se envía nada: se deja constancia en consola para poder probar el flujo manualmente.
import { Resend } from "resend";

let cliente: Resend | null = null;
function getCliente(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  cliente ??= new Resend(process.env.RESEND_API_KEY);
  return cliente;
}

export async function enviarCorreo(opciones: { to: string; subject: string; html: string }) {
  const resend = getCliente();
  if (!resend) {
    console.log(`[correo simulado] Para: ${opciones.to} — Asunto: ${opciones.subject}\n${opciones.html}`);
    return;
  }
  const from = process.env.RESEND_FROM || "Billboard MusicRoster <no-responder@musicroster.co>";
  await resend.emails.send({ from, to: opciones.to, subject: opciones.subject, html: opciones.html });
}
