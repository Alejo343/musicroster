// Detección de posibles duplicados — misma lógica que AdminData.duplicates() en
// assets/js/admin-data.js: agrupa por documento, nombre de proyecto o correo de contacto.
import { prisma } from "@/lib/prisma";
import type { ProjectFull } from "./queries";

export type Kind = "documento" | "nombre" | "email";
const ORDEN_KIND: Kind[] = ["documento", "nombre", "email"];

export type CasoDuplicado = {
  key: string;
  kind: Kind;
  kinds: Kind[];
  items: ProjectFull[];
  docs: Record<string, { numero: string; tipo: string; persona: string }[]>;
  dismissed: boolean;
  resolved: boolean;
};

const normTxt = (s: string | null | undefined) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function docsOf(rec: ProjectFull) {
  if (rec.identidad === "individual") {
    return rec.numeroDocumento ? [{ numero: rec.numeroDocumento, tipo: rec.tipoDocumento ?? "", persona: rec.nombreCompleto ?? "" }] : [];
  }
  return rec.miembros.map((m) => ({ numero: m.numeroDocumento, tipo: m.tipoDocumento, persona: m.nombre }));
}

export async function calcularDuplicados(records: ProjectFull[]): Promise<CasoDuplicado[]> {
  const descartados = new Set((await prisma.dismissedDuplicate.findMany({ select: { key: true } })).map((d) => d.key));

  type Grupo = { kind: Kind; items: ProjectFull[]; docs: Record<string, { numero: string; tipo: string; persona: string }[]> };
  const byValue = new Map<string, Grupo>();
  const add = (key: string, kind: Kind, rec: ProjectFull, doc?: { numero: string; tipo: string; persona: string }) => {
    let g = byValue.get(key);
    if (!g) { g = { kind, items: [], docs: {} }; byValue.set(key, g); }
    if (!g.items.includes(rec)) g.items.push(rec);
    if (doc) (g.docs[rec.id] ??= []).push(doc);
  };

  records.forEach((rec) => {
    docsOf(rec).forEach((d) => d.numero && add(`doc:${normTxt(d.numero)}`, "documento", rec, d));
    add(`nombre:${normTxt(rec.nombreProyecto)}`, "nombre", rec);
    add(`email:${normTxt(rec.contactoEmail)}`, "email", rec);
  });

  const casos = new Map<string, CasoDuplicado>();
  for (const g of byValue.values()) {
    if (g.items.length < 2) continue;
    const items = g.items.slice().sort((a, b) => a.creado.getTime() - b.creado.getTime());
    const key = items.map((x) => x.id).join("+");
    let c = casos.get(key);
    if (!c) {
      c = { key, kind: g.kind, kinds: [], items, docs: {}, dismissed: descartados.has(key), resolved: false };
      casos.set(key, c);
    }
    if (!c.kinds.includes(g.kind)) c.kinds.push(g.kind);
    Object.entries(g.docs).forEach(([id, list]) => { c!.docs[id] = (c!.docs[id] ?? []).concat(list); });
  }

  return [...casos.values()]
    .map((c) => {
      c.kinds.sort((a, b) => ORDEN_KIND.indexOf(a) - ORDEN_KIND.indexOf(b));
      c.kind = c.kinds[0];
      c.resolved = c.items.filter((x) => x.estado !== "rechazado").length < 2;
      return c;
    })
    .sort((a, b) => ORDEN_KIND.indexOf(a.kind) - ORDEN_KIND.indexOf(b.kind) || b.items[b.items.length - 1].creado.getTime() - a.items[a.items.length - 1].creado.getTime());
}

export async function idsConDuplicadoAbierto(records: ProjectFull[]): Promise<Set<string>> {
  const casos = await calcularDuplicados(records);
  return new Set(casos.filter((c) => !c.dismissed && !c.resolved).flatMap((c) => c.items.map((x) => x.id)));
}

// Número de CASOS abiertos (no de registros involucrados) — es lo que muestra el
// badge del menú y el KPI "Posibles duplicados" del resumen, igual que hoy
// A.openDuplicates().length en assets/js/admin-data.js.
export async function contarCasosAbiertos(records: ProjectFull[]): Promise<number> {
  const casos = await calcularDuplicados(records);
  return casos.filter((c) => !c.dismissed && !c.resolved).length;
}
