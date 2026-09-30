// Un solo desplegable (Desplegable o ComboTexto) abierto a la vez en toda la página,
// igual que `openInstance` en assets/js/dropdown.js.
let cerrarActivo: (() => void) | null = null;

export function abrirExclusivo(cerrar: () => void) {
  if (cerrarActivo && cerrarActivo !== cerrar) cerrarActivo();
  cerrarActivo = cerrar;
}

export function liberar(cerrar: () => void) {
  if (cerrarActivo === cerrar) cerrarActivo = null;
}
