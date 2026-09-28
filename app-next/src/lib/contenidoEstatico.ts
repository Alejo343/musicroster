// Lee un fragmento HTML porteado tal cual desde el sitio estático (ver contenido.html
// junto a cada page.tsx). Solo se usa en Server Components; nunca en el cliente.
import { readFileSync } from "node:fs";
import path from "node:path";

export function leerContenidoEstatico(rutaRelativa: string): string {
  return readFileSync(path.join(process.cwd(), "src/app", rutaRelativa), "utf8");
}
