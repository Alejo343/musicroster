"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { TIPOS_PROYECTO, RANGOS_CONTRATACION } from "@/lib/catalogos";

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
        <select id="f-tipo" value={params.get("tipo") ?? "todos"} onChange={(e) => set("tipo", e.target.value)}>
          <option value="todos">Todos los tipos</option>
          {Object.entries(TIPOS_PROYECTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-genero">Género principal</label>
        <select id="f-genero" value={params.get("genero") ?? "todos"} onChange={(e) => set("genero", e.target.value)}>
          <option value="todos">Todos los géneros</option>
          {generos.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-region">Territorio</label>
        <select id="f-region" value={params.get("region") ?? "todos"} onChange={(e) => set("region", e.target.value)}>
          <option value="todos">Todo el territorio</option>
          {regiones.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-rango">Rango</label>
        <select id="f-rango" value={params.get("rango") ?? "todos"} onChange={(e) => set("rango", e.target.value)}>
          <option value="todos">Todos los rangos</option>
          {RANGOS_CONTRATACION.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {activos && (
        <button type="button" className="link-btn" onClick={() => router.push("/admin/registros")}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
