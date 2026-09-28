"use client";

import { useSyncExternalStore } from "react";
import { carrito, EVENTO_CAMBIO } from "./carrito";

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO_CAMBIO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

// Referencia estable: el snapshot del servidor debe devolver siempre el mismo array
// (uno nuevo en cada llamada dispara "getServerSnapshot should be cached" y re-renderiza sin fin).
const SIN_SELECCION: string[] = [];
const snapshotServidor = () => SIN_SELECCION;

export function useCarrito() {
  // localStorage es un store externo al render de React: useSyncExternalStore es el
  // patrón recomendado (evita leer el DOM durante el render del servidor y se
  // resuscribe a los cambios sin pasar por un useState + useEffect manual).
  const ids = useSyncExternalStore(suscribir, carrito.ids, snapshotServidor);
  return { ...carrito, ids };
}
