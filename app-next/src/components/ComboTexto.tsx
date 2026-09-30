"use client";

// Campo de texto con sugerencias: reemplaza <input list="..."> + <datalist> por el panel con el
// diseño del sitio, igual que enhanceCombo() en assets/js/dropdown.js (resalta la coincidencia,
// prioriza las que empiezan por lo escrito, navegación por teclado). A diferencia de Desplegable,
// admite cualquier texto, no solo las opciones sugeridas — así, p. ej., un país fuera de la lista
// se puede escribir igual.
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { abrirExclusivo, liberar } from "@/lib/dropdownActivo";

const MAX_ITEMS = 120;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Resalta la coincidencia sin importar tildes ni mayúsculas (misma técnica que highlight() en dropdown.js)
function resaltar(texto: string, q: string): ReactNode {
  if (!q) return texto;
  const chars = [...texto];
  let flat = "";
  const mapa: number[] = [];
  chars.forEach((ch, i) => { for (const c of norm(ch)) { flat += c; mapa.push(i); } });
  const at = flat.indexOf(q);
  if (at < 0) return texto;
  const inicio = mapa[at];
  const fin = mapa[at + q.length - 1] + 1;
  return (
    <>
      {chars.slice(0, inicio).join("")}
      <mark>{chars.slice(inicio, fin).join("")}</mark>
      {chars.slice(fin).join("")}
    </>
  );
}

export default function ComboTexto({
  id,
  name,
  value,
  onChange,
  onBlurCampo,
  opciones,
  ariaLabel,
  disabled = false,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (valor: string) => void;
  onBlurCampo?: () => void;
  opciones: readonly string[];
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const base = useId();
  const listaId = `${base}-lista`;
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLUListElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [arriba, setArriba] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [filtrando, setFiltrando] = useState(false);

  const q = filtrando ? norm(value.trim()) : "";
  let mostradas: string[] = opciones as string[];
  if (q) {
    const empiezan: string[] = [];
    const contienen: string[] = [];
    opciones.forEach((o) => {
      const n = norm(o);
      if (n.startsWith(q)) empiezan.push(o);
      else if (n.includes(q)) contienen.push(o);
    });
    mostradas = [...empiezan, ...contienen];
  }
  const hayMas = mostradas.length > MAX_ITEMS;
  const visibles = mostradas.slice(0, MAX_ITEMS);

  const cerrar = () => {
    setAbierto(false);
    setArriba(false);
    liberar(cerrar);
  };

  const abrir = (filtrar: boolean) => {
    if (disabled) return;
    if (filtrar ? !mostradas.length : !opciones.length) { cerrar(); return; }
    abrirExclusivo(cerrar);
    setFiltrando(filtrar);
    const cur = (filtrar ? mostradas : opciones).findIndex((o) => norm(o) === norm(value.trim()));
    setActivo(filtrar && value.trim() ? 0 : Math.max(cur, 0));
    setAbierto(true);
  };

  const elegir = (i: number) => {
    const o = visibles[i];
    if (!o || !input.current) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(input.current, o);
    input.current.dispatchEvent(new Event("input", { bubbles: true }));
    input.current.dispatchEvent(new Event("change", { bubbles: true }));
    cerrar();
    input.current.focus();
  };

  useEffect(() => {
    if (!abierto || !wrap.current || !panel.current) return;
    const r = wrap.current.getBoundingClientRect();
    const h = Math.min(panel.current.scrollHeight, 300);
    setArriba(window.innerHeight - r.bottom < h + 16 && r.top > h + 16);
  }, [abierto]);

  useEffect(() => {
    if (abierto && activo >= 0) panel.current?.children[activo]?.scrollIntoView({ block: "nearest" });
  }, [abierto, activo]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) cerrar(); };
    document.addEventListener("pointerdown", fuera);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      window.removeEventListener("resize", cerrar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const onKeyDown = (e: KeyboardEvent) => {
    const n = visibles.length;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!abierto) abrir(false);
        else setActivo((a) => Math.max(0, Math.min(a + (e.key === "ArrowDown" ? 1 : -1), n - 1)));
        return;
      case "Enter":
        if (abierto && activo >= 0) { e.preventDefault(); elegir(activo); }
        return;
      case "Escape":
        if (abierto) { e.preventDefault(); cerrar(); }
        return;
      case "Tab":
        if (abierto) cerrar();
        return;
    }
  };

  return (
    <div ref={wrap} className={`dd dd-combo${abierto ? " is-open" : ""}${arriba ? " dd-up" : ""}`}>
      <input
        ref={input}
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-label={ariaLabel}
        aria-activedescendant={abierto && activo >= 0 ? `${base}-o${activo}` : undefined}
        disabled={disabled}
        value={value}
        onChange={(e) => { onChange(e.target.value); abrir(true); }}
        onFocus={() => abrir(false)}
        onClick={() => { if (!abierto) abrir(false); }}
        onBlur={() => { window.setTimeout(() => { if (!wrap.current?.contains(document.activeElement)) { cerrar(); onBlurCampo?.(); } }, 0); }}
        onKeyDown={onKeyDown}
      />
      <svg
        className="dd-chevron"
        width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
        onPointerDown={(e) => { e.preventDefault(); if (abierto) cerrar(); else { input.current?.focus(); abrir(false); } }}
      ><path d="M1 1l5 5 5-5" /></svg>
      <ul ref={panel} className="dd-panel" id={listaId} role="listbox" hidden={!abierto} onPointerDown={(e) => e.preventDefault()}>
        {abierto && visibles.map((o, i) => (
          <li
            key={o}
            id={`${base}-o${i}`}
            role="option"
            aria-selected={norm(o) === norm(value.trim())}
            className={i === activo ? "is-active" : undefined}
            onClick={() => elegir(i)}
            onPointerMove={() => setActivo(i)}
          >
            <span>{resaltar(o, q)}</span>
          </li>
        ))}
        {abierto && hayMas && <li className="dd-more" aria-hidden="true">Sigue escribiendo para ver más resultados</li>}
      </ul>
    </div>
  );
}
