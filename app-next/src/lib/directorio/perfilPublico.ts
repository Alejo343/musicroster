// Frontera pública/privada del directorio (Reglamento Art. 25/26; política de datos secc. 6).
// Único lugar que decide qué campos de un Project salen al público — select explícito,
// nunca "todo menos lo privado": si mañana se agrega un campo a Project, aquí no aparece
// hasta que alguien lo agregue a propósito.
import { prisma } from "@/lib/prisma";
import { TIPOS_PROYECTO, ROLES_INTEGRANTE, rangoLabel, acento } from "@/lib/catalogos";

const SELECT_PUBLICO = {
  id: true, creado: true, tipo: true, otroDescripcion: true, identidad: true, nombreProyecto: true,
  generoPrincipal: true, otrosGeneros: true, otroGenero: true,
  nacionalidad: true, paisResidencia: true, regionResidencia: true, ciudadActual: true,
  paisOrigen: true, regionOrigen: true, ciudadOrigen: true,
  nombreCompleto: true,
  miembros: { select: { nombre: true, rol: true, rolOtro: true, esLider: true }, orderBy: { orden: "asc" as const } },
  plataformaMusical: true, enlaceMusical: true, otrosEnlaces: true,
  redSocialTipo: true, redSocial: true, otrasRedes: true,
  foto: true,
  rangoContratacion: true,
  contactoNombre: true, contactoWhatsapp: true, contactoEmail: true,
  historial: { select: { fecha: true, accion: true }, orderBy: { fecha: "desc" as const } },
} satisfies import("@prisma/client").Prisma.ProjectSelect;

type ProyectoPublicoCrudo = import("@prisma/client").Prisma.ProjectGetPayload<{ select: typeof SELECT_PUBLICO }>;

export type Enlace = { plataforma: string; url: string };
export type Integrante = { nombre: string; rol: string; lider: boolean };

export type PerfilPublico = {
  id: string;
  creado: Date;
  nombre: string;
  tipo: string;
  tipoLabel: string;
  individual: boolean;
  genero: string;
  otrosGeneros: string[];
  acento: string;
  nacionalidad: string;
  residencia: { pais: string; region: string; ciudad: string };
  origen: { pais: string; region: string; ciudad: string };
  titular: string;
  integrantes: Integrante[];
  musica: Enlace[];
  redes: Enlace[];
  foto: string | null;
  rango: string;
  rangoLabel: string;
  rangoIndex: number;
  contacto: { nombre: string; whatsapp: string; email: string };
  publicado: Date;
};

const RANGO_ORDEN = ["menos_2m", "2m_5m", "5m_10m", "10m_20m", "20m_50m", "50m_100m", "mas_100m", "segun_evento"];

function mapear(r: ProyectoPublicoCrudo): PerfilPublico {
  const individual = r.identidad === "individual";
  const publicado = [...r.historial].find((h) => /public/i.test(h.accion))?.fecha ?? r.creado;
  return {
    id: r.id,
    creado: r.creado,
    nombre: r.nombreProyecto,
    tipo: r.tipo,
    tipoLabel: r.tipo === "otro" && r.otroDescripcion ? r.otroDescripcion : TIPOS_PROYECTO[r.tipo as keyof typeof TIPOS_PROYECTO],
    individual,
    genero: r.generoPrincipal === "Otro" && r.otroGenero ? r.otroGenero : r.generoPrincipal,
    otrosGeneros: r.otrosGeneros,
    acento: acento(r.generoPrincipal),
    nacionalidad: r.nacionalidad,
    residencia: { pais: r.paisResidencia, region: r.regionResidencia, ciudad: r.ciudadActual },
    origen: { pais: r.paisOrigen, region: r.regionOrigen, ciudad: r.ciudadOrigen },
    titular: individual ? (r.nombreCompleto ?? "") : "",
    integrantes: individual ? [] : r.miembros.map((m) => ({ nombre: m.nombre, rol: m.rol === "otro" && m.rolOtro ? m.rolOtro : ROLES_INTEGRANTE[m.rol as keyof typeof ROLES_INTEGRANTE] ?? m.rol, lider: m.esLider })),
    musica: [{ plataforma: r.plataformaMusical, url: r.enlaceMusical }, ...(r.otrosEnlaces as Enlace[])].filter((l) => l.url),
    redes: [{ plataforma: r.redSocialTipo, url: r.redSocial }, ...(r.otrasRedes as Enlace[])].filter((l) => l.url),
    foto: r.foto,
    rango: r.rangoContratacion,
    rangoLabel: rangoLabel(r.rangoContratacion),
    rangoIndex: RANGO_ORDEN.indexOf(r.rangoContratacion),
    contacto: { nombre: r.contactoNombre, whatsapp: r.contactoWhatsapp, email: r.contactoEmail },
    publicado,
  };
}

export async function obtenerPerfilesPublicos(): Promise<PerfilPublico[]> {
  const registros = await prisma.project.findMany({ where: { estado: "aprobado" }, select: SELECT_PUBLICO, orderBy: { creado: "desc" } });
  return registros.map(mapear);
}

export async function obtenerPerfilPublico(id: string): Promise<PerfilPublico | null> {
  const registro = await prisma.project.findFirst({ where: { id, estado: "aprobado" }, select: SELECT_PUBLICO });
  return registro ? mapear(registro) : null;
}
