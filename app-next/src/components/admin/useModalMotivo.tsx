"use client";

import { useRef, useState } from "react";

type Estado = "aprobado" | "correccion" | "rechazado" | "pendiente";

const TEXTOS: Record<Estado, [string, string, string, string]> = {
  aprobado: ["Aprobar y publicar", "El perfil quedará visible en el buscador con sus datos públicos.", "btn-ok", "Aprobar y publicar"],
  correccion: ["Pedir corrección", "Se le indicará al contacto qué debe corregir. El perfil no se publica hasta que lo haga.", "btn-dark", "Pedir corrección"],
  rechazado: ["Rechazar", "El registro no se publicará. Indica el motivo: queda en el historial y se le comunica al contacto.", "btn-danger", "Rechazar"],
  pendiente: ["Volver a pendiente", "El registro vuelve a la cola de revisión. Si estaba publicado, deja de verse en el buscador.", "btn-dark", "Volver a pendiente"],
};

const MOTIVOS: Record<string, string[]> = {
  correccion: [
    "La fotografía tiene marca de agua o baja resolución.",
    "El enlace musical principal no funciona.",
    "Faltan datos de uno de los integrantes.",
    "El nombre del proyecto no coincide con el del enlace musical.",
  ],
  rechazado: [
    "Registro duplicado.",
    "Suplantación o datos de identificación falsos.",
    "Uno o más integrantes son menores de edad.",
    "No es un proyecto musical con identidad propia.",
  ],
};

type Pedido = { estado: Estado; n: number; motivoInicial: string } | null;

export function useModalMotivo() {
  const [pedido, setPedido] = useState<Pedido>(null);
  const [motivo, setMotivo] = useState("");
  const [invalido, setInvalido] = useState(false);
  const resolverRef = useRef<((v: { motivo: string } | null) => void) | null>(null);

  const pedirConfirmacion = (estado: Estado, n: number, motivoInicial = ""): Promise<{ motivo: string } | null> => {
    setPedido({ estado, n, motivoInicial });
    setMotivo(motivoInicial);
    setInvalido(false);
    return new Promise((resolve) => { resolverRef.current = resolve; });
  };

  const cerrar = (valor: { motivo: string } | null) => {
    setPedido(null);
    resolverRef.current?.(valor);
    resolverRef.current = null;
  };

  if (!pedido) return { pedirConfirmacion, modal: null };

  const conMotivo = pedido.estado === "correccion" || pedido.estado === "rechazado";
  const [titulo, descripcion, claseBtn, textoBtn] = TEXTOS[pedido.estado];

  const modal = (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) cerrar(null); }}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <h2>{titulo}{pedido.n > 1 ? ` · ${pedido.n}` : ""}</h2>
        <p>{descripcion}</p>
        {conMotivo && (
          <>
            <div className="presets">
              {MOTIVOS[pedido.estado].map((m) => (
                <button type="button" key={m} onClick={() => { setMotivo(m); setInvalido(false); }}>{m}</button>
              ))}
            </div>
            <div className={`field${invalido ? " invalid" : ""}`}>
              <label htmlFor="m-motivo">Motivo</label>
              <textarea id="m-motivo" rows={3} value={motivo} onChange={(e) => { setMotivo(e.target.value); setInvalido(false); }} />
              <span className="err">Escribe el motivo.</span>
            </div>
          </>
        )}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={() => cerrar(null)}>Cancelar</button>
          <button
            type="button"
            className={`btn ${claseBtn}`}
            onClick={() => {
              if (conMotivo && !motivo.trim()) { setInvalido(true); return; }
              cerrar({ motivo: conMotivo ? motivo.trim() : "" });
            }}
          >
            {textoBtn}
          </button>
        </div>
      </div>
    </div>
  );

  return { pedirConfirmacion, modal };
}
