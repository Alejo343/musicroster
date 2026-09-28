// Consultas del panel de administración. Igual que hoy assets/js/admin-data.js,
// se trae todo a memoria y las vistas filtran/derivan ahí — a esta escala (cientos de
// registros) es más simple y más fiel al comportamiento actual que empujar cada filtro a SQL.
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const projectFullInclude = {
  miembros: { orderBy: { orden: "asc" } },
  historial: { orderBy: { fecha: "asc" } },
  notas: { orderBy: { fecha: "asc" } },
} satisfies Prisma.ProjectInclude;

export type ProjectFull = Prisma.ProjectGetPayload<{ include: typeof projectFullInclude }>;

export async function obtenerTodos(): Promise<ProjectFull[]> {
  return prisma.project.findMany({ include: projectFullInclude, orderBy: { creado: "desc" } });
}

export async function obtenerUno(id: string): Promise<ProjectFull | null> {
  return prisma.project.findUnique({ where: { id }, include: projectFullInclude });
}

export async function contarPendientes(): Promise<number> {
  return prisma.project.count({ where: { estado: "pendiente" } });
}
