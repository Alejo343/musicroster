"use client";

// Desplegable con el diseño del sitio: el mismo markup (.dd, .dd-trigger, .dd-panel) y el mismo
// comportamiento de teclado que enhanceSelect() en assets/js/dropdown.js, así reutiliza sus estilos
// de globals.css. Controlado: el valor vive en el componente que lo usa.
import { useEffect, useId, useRef, useState } from "react";

type Opcion = readonly [valor: string, etiqueta: string];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Solo uno abierto a la vez en toda la página
let cerrarAbierto: (() => void) | null = null;

export default function Desplegable({
  id, value, opciones, onChange, ariaLabel, disabled = false,
}: {
  id?: string; value: string; opciones: readonly Opcion[]; onChange: (valor: string) => void; ariaLabel?: string; disabled?: boolean;
}) {
  const base = useId();
  const listaId = `${base}-lista`;
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [arriba, setArriba] = useState(false);
  const [activo, setActivo] = useState(-1);
  const tecleado = useRef({ texto: "", timer: 0 as ReturnType<typeof setTimeout> | 0 });

  const elegidas = opciones.filter(([v]) => v !== "");
  const actual = opciones.find(([v]) => v === value);
  const vacio = !actual || actual[0] === "";

  const cerrar = () => {
    setAbierto(false);
    setArriba(false);
    if (cerrarAbierto === cerrar) cerrarAbierto = null;
  };

  const abrir = (indice?: number) => {
    if (disabled) return;
    cerrarAbierto?.();
    cerrarAbierto = cerrar;
    const cur = elegidas.findIndex(([v]) => v === value);
    setActivo(indice ?? (cur < 0 ? 0 : cur));
    setAbierto(true);
  };

  const elegir = (i: number) => {
    const o = elegidas[i];
    if (!o) return;
    cerrar();
    trigger.current?.focus();
    if (o[0] !== value) onChange(o[0]);
  };

  // Al abrir: decide si el panel cabe debajo (si no, abre hacia arriba), igual que place() en dropdown.js
  useEffect(() => {
    if (!abierto || !wrap.current || !panel.current) return;
    const r = wrap.current.getBoundingClientRect();
    const h = Math.min(panel.current.scrollHeight, 300);
    setArriba(window.innerHeight - r.bottom < h + 16 && r.top > h + 16);
  }, [abierto]);

  useEffect(() => {
    if (abierto && activo >= 0) panel.current?.children[activo]?.scrollIntoView({ block: "nearest" });
  }, [abierto, activo]);

  // Cierra al tocar fuera o al cambiar el tamaño de la ventana
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = elegidas.length;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!abierto) abrir();
        else setActivo((a) => Math.max(0, Math.min(a + (e.key === "ArrowDown" ? 1 : -1), n - 1)));
        return;
      case "Home": case "End":
        if (abierto) { e.preventDefault(); setActivo(e.key === "Home" ? 0 : n - 1); }
        return;
      case "Enter": case " ":
        e.preventDefault();
        if (abierto) elegir(activo); else abrir();
        return;
      case "Escape":
        if (abierto) { e.preventDefault(); cerrar(); }
        return;
      case "Tab":
        if (abierto) cerrar();
        return;
    }
    // Escribir letras salta a la opción que empieza así
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = tecleado.current;
      if (t.timer) clearTimeout(t.timer);
      t.texto += norm(e.key);
      t.timer = setTimeout(() => (t.texto = ""), 600);
      const i = elegidas.findIndex(([, l]) => norm(l).startsWith(t.texto));
      if (i < 0) return;
      if (!abierto) abrir(i); else setActivo(i);
    }
  };

  return (
    <div ref={wrap} className={`dd dd-select${abierto ? " is-open" : ""}${arriba ? " dd-up" : ""}`}>
      <button
        ref={trigger}
        id={id}
        type="button"
        className={`dd-trigger${vacio ? " is-placeholder" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-label={ariaLabel ? (vacio ? ariaLabel : `${ariaLabel}: ${actual[1]}`) : undefined}
        aria-activedescendant={abierto && activo >= 0 ? `${base}-o${activo}` : undefined}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={onKeyDown}
      >
        <span className="dd-value">{actual?.[1] ?? ""}</span>
        <svg className="dd-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 1l5 5 5-5" /></svg>
      </button>
      <ul ref={panel} className="dd-panel" id={listaId} role="listbox" hidden={!abierto} onPointerDown={(e) => e.preventDefault()}>
        {abierto && elegidas.map(([v, l], i) => (
          <li
            key={v}
            id={`${base}-o${i}`}
            role="option"
            aria-selected={v === value}
            className={i === activo ? "is-active" : undefined}
            onClick={() => elegir(i)}
            onPointerMove={() => setActivo(i)}
          >
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
