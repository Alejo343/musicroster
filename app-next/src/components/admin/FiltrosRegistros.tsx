"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { TIPOS_PROYECTO, RANGOS_CONTRATACION } from "@/lib/catalogos";
import Desplegable from "@/components/Desplegable";

export default function FiltrosRegistros({ generos, regiones }: { generos: string[]; regiones: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (clave: string, valor: string) => {
    const p = new URLSearchParams(params.toString());
    if (valor === "todos" || !valor) p.delete(clave); else p.set(clave, valor);
    p.delete("page");
    router.push(`/admin/registros?${p.toString()}`);
  };

  const activos = ["tipo", "genero", "region", "rango", "q"].some((k) => params.get(k));

  return (
    <div className="filters-row">
      <div className="field search-field">
        <label htmlFor="f-q">Buscar</label>
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            type="search"
            id="f-q"
            placeholder="Proyecto, persona, correo o número de registro"
            autoComplete="off"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => {
              if (qTimer.current) clearTimeout(qTimer.current);
              const valor = e.target.value;
              qTimer.current = setTimeout(() => set("q", valor.trim()), 250);
            }}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-tipo">Tipo</label>
        <Desplegable id="f-tipo" value={params.get("tipo") ?? "todos"} onChange={(v) => set("tipo", v)}
          opciones={[["todos", "Todos los tipos"], ...Object.entries(TIPOS_PROYECTO)]} />
      </div>
      <div className="field">
        <label htmlFor="f-genero">Género principal</label>
        <Desplegable id="f-genero" value={params.get("genero") ?? "todos"} onChange={(v) => set("genero", v)}
          opciones={[["todos", "Todos los géneros"], ...generos.map((g) => [g, g] as const)]} />
      </div>
      <div className="field">
        <label htmlFor="f-region">Territorio</label>
        <Desplegable id="f-region" value={params.get("region") ?? "todos"} onChange={(v) => set("region", v)}
          opciones={[["todos", "Todo el territorio"], ...regiones.map((g) => [g, g] as const)]} />
      </div>
      <div className="field">
        <label htmlFor="f-rango">Rango</label>
        <Desplegable id="f-rango" value={params.get("rango") ?? "todos"} onChange={(v) => set("rango", v)}
          opciones={[["todos", "Todos los rangos"], ...RANGOS_CONTRATACION]} />
      </div>
      {activos && (
        <button type="button" className="link-btn" onClick={() => router.push("/admin/registros")}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
