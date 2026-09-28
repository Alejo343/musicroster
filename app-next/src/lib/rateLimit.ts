// Límite de tasa en memoria — válido porque la app corre como un único proceso Node
// de larga duración en el VPS (no serverless/multi-instancia), así que no hace falta
// Redis ni nada compartido. Ventana deslizante simple por (ruta, IP).
type Entrada = { inicio: number; conteo: number };

const almacen = new Map<string, Entrada>();

// Evita que el mapa crezca sin límite con IPs que ya no vuelven.
let ultimaLimpieza = Date.now();
function limpiar(ahora: number) {
  if (ahora - ultimaLimpieza < 60_000) return;
  ultimaLimpieza = ahora;
  for (const [clave, e] of almacen) {
    if (ahora - e.inicio > 60 * 60 * 1000) almacen.delete(clave);
  }
}

export type ResultadoLimite = { permitido: boolean; restante: number; reintentarEnSegundos: number };

/**
 * @param clave identifica la ruta + el cliente, p. ej. `registro:${ip}`
 * @param limite máximo de solicitudes en la ventana
 * @param ventanaMs duración de la ventana en milisegundos
 */
export function limitarTasa(clave: string, limite: number, ventanaMs: number): ResultadoLimite {
  const ahora = Date.now();
  limpiar(ahora);

  const e = almacen.get(clave);
  if (!e || ahora - e.inicio >= ventanaMs) {
    almacen.set(clave, { inicio: ahora, conteo: 1 });
    return { permitido: true, restante: limite - 1, reintentarEnSegundos: 0 };
  }

  if (e.conteo >= limite) {
    return { permitido: false, restante: 0, reintentarEnSegundos: Math.ceil((e.inicio + ventanaMs - ahora) / 1000) };
  }

  e.conteo += 1;
  return { permitido: true, restante: limite - e.conteo, reintentarEnSegundos: 0 };
}

// Solo para pruebas: limpia el estado entre casos.
export function _reiniciarLimitador() {
  almacen.clear();
}

// IP del cliente detrás del proxy inverso (OpenLiteSpeed reenvía X-Forwarded-For).
export function ipDeSolicitud(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconocida";
}
