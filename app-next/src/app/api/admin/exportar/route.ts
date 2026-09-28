// Exporta CSV de registros — misma lógica que exportar() en assets/js/admin.js.
// "completo" agrega documentos y datos del diligenciador; exige rol admin y queda
// registrado en el historial de cada registro exportado (política de datos).
import { NextResponse } from "next/server";
import { requireAdmin, requireRolAdmin } from "@/lib/admin/auth";
import { obtenerTodos } from "@/lib/admin/queries";
import { calcularLista, filtrosPorDefecto, type FiltrosLista } from "@/lib/admin/registrosLista";
import { regionDe } from "@/lib/admin/formato";
import { ESTADOS_REGISTRO, TIPOS_PROYECTO, PLATAFORMAS_MUSICA, PLATAFORMAS_REDES, QUIEN_REGISTRA, rangoLabel } from "@/lib/catalogos";
import { prisma } from "@/lib/prisma";
import type { ProjectFull } from "@/lib/admin/queries";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const plataforma = (k: string) => (PLATAFORMAS_MUSICA.find(([v]) => v === k) ?? PLATAFORMAS_REDES.find(([v]) => v === k))?.[1] ?? k;

const COLUMNAS_PUBLICAS: [string, (r: ProjectFull) => unknown][] = [
  ["ID", (r) => r.id], ["Registrado", (r) => r.creado.toISOString()], ["Estado", (r) => ESTADOS_REGISTRO[r.estado]], ["Tipo", (r) => TIPOS_PROYECTO[r.tipo as keyof typeof TIPOS_PROYECTO]],
  ["Nombre del proyecto", (r) => r.nombreProyecto], ["Género principal", (r) => r.generoPrincipal], ["Otros géneros", (r) => r.otrosGeneros.join(" / ")],
  ["Nacionalidad", (r) => r.nacionalidad], ["País de residencia", (r) => r.paisResidencia], ["Región de residencia", (r) => r.regionResidencia],
  ["Ciudad actual", (r) => r.ciudadActual], ["País de origen", (r) => r.paisOrigen], ["Región de origen", (r) => r.regionOrigen], ["Ciudad de origen", (r) => r.ciudadOrigen],
  ["Nombres (titular o integrantes)", (r) => (r.identidad === "individual" ? r.nombreCompleto : r.miembros.map((m) => m.nombre).join(" / "))],
  ["Enlace musical", (r) => r.enlaceMusical], ["Red social", (r) => `${plataforma(r.redSocialTipo)}: ${r.redSocial}`],
  ["Rango de contratación", (r) => rangoLabel(r.rangoContratacion)], ["Contacto", (r) => r.contactoNombre],
  ["WhatsApp", (r) => r.contactoWhatsapp], ["Correo", (r) => r.contactoEmail],
];

const COLUMNAS_PRIVADAS: [string, (r: ProjectFull) => unknown][] = [
  ["Documentos", (r) => (r.identidad === "individual"
    ? `${r.nombreCompleto}: ${r.tipoDocumento} ${r.numeroDocumento}`
    : r.miembros.map((m) => `${m.nombre}: ${m.tipoDocumento} ${m.numeroDocumento}`).join(" / "))],
  ["Quién registra", (r) => QUIEN_REGISTRA[r.quienRegistra as keyof typeof QUIEN_REGISTRA] ?? r.quienRegistra],
  ["Nombre de quien diligencia", (r) => r.registranteNombre], ["Correo de quien diligencia", (r) => r.registranteEmail],
  ["WhatsApp de quien diligencia", (r) => r.registranteWhatsapp], ["Motivo", (r) => r.motivo],
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const completo = url.searchParams.get("completo") === "1";
  const sesion = await (completo ? requireRolAdmin() : requireAdmin());

  const ids = url.searchParams.get("ids");
  const todos = await obtenerTodos();
  let registros: ProjectFull[];

  if (ids) {
    const set = new Set(ids.split(","));
    registros = todos.filter((r) => set.has(r.id));
  } else {
    const f: FiltrosLista = {
      ...filtrosPorDefecto(),
      estado: url.searchParams.get("estado") ?? "todos",
      q: url.searchParams.get("q") ?? "",
      tipo: url.searchParams.get("tipo") ?? "todos",
      genero: url.searchParams.get("genero") ?? "todos",
      region: url.searchParams.get("region") ?? "todos",
      rango: url.searchParams.get("rango") ?? "todos",
    };
    const listaVisibles = calcularLista(
      todos.map((r) => ({
        id: r.id, creado: r.creado, estado: r.estado, tipo: r.tipo, genero: r.generoPrincipal, region: regionDe(r), rango: r.rangoContratacion,
        nombreProyecto: r.nombreProyecto, nombreCompleto: r.nombreCompleto, contactoNombre: r.contactoNombre, contactoEmail: r.contactoEmail,
        ciudad: r.ciudadActual, miembros: r.miembros.map((m) => m.nombre),
      })),
      f,
    ).visibles;
    const idsVisibles = new Set(listaVisibles.map((r) => r.id));
    registros = todos.filter((r) => idsVisibles.has(r.id));
  }

  const columnas = completo ? COLUMNAS_PUBLICAS.concat(COLUMNAS_PRIVADAS) : COLUMNAS_PUBLICAS;
  const csv = [columnas.map(([titulo]) => cell(titulo)).join(";")]
    .concat(registros.map((r) => columnas.map(([, fn]) => cell(fn(r))).join(";")))
    .join("\r\n");

  if (completo) {
    await prisma.statusHistory.createMany({
      data: registros.map((r) => ({ projectId: r.id, autor: sesion.email, accion: "Consultó un dato privado", detalle: "Exportación CSV con datos privados", privado: true })),
    });
  }

  const nombre = `musicroster-registros-${new Date().toISOString().slice(0, 10)}${completo ? "-completo" : ""}.csv`;
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
