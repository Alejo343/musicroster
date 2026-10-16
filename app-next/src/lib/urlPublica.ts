// Origen público del sitio. Detrás de OpenLiteSpeed, request.url llega con el host
// interno (https://localhost:3009), así que enlaces de correo y redirecciones no
// pueden armarse con él: en producción se usa DOMINIO; en dev, el origen de la petición.
export function origenPublico(request: Request): string {
  const dominio = process.env.DOMINIO?.trim();
  if (process.env.NODE_ENV === "production" && dominio) return `https://${dominio}`;
  return new URL(request.url).origin;
}

export function urlPublica(ruta: string, request: Request): URL {
  return new URL(ruta, origenPublico(request));
}
