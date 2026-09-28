// Generador determinista de datos de prueba (puerto directo de generate() en
// assets/js/admin-data.js). Módulo puro, sin Prisma: se puede probar sin tocar la base de datos.
import type { EstadoRegistro, Identidad, TipoProyecto } from "@prisma/client";

function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES = ["Andrés", "Camila", "Juan David", "Valentina", "Santiago", "Daniela", "Sebastián", "Mariana", "Carlos", "Laura",
  "Jhon Fredy", "Paola", "Luis Fernando", "Natalia", "Kevin", "Yuliana", "Wilmer", "Diana", "Brayan", "Ana María", "Julián",
  "Karen", "Óscar", "Leidy", "Mateo", "Sara", "Yeison", "Luz Dary", "Esteban", "Ingrid"];
const APELLIDOS = ["Rivas", "Mosquera", "Gómez", "Palacios", "Restrepo", "Díaz", "Castro", "Mena", "Ortiz", "Vargas", "Cuesta",
  "Zapata", "Ospina", "Hinestroza", "Martínez", "Rentería", "Morales", "Ibargüen", "Quintero", "Salazar", "Arboleda", "Caicedo",
  "Torres", "Largacha", "Pérez", "Córdoba", "Valencia", "Murillo"];

const PROYECTOS: Record<string, [string, string, string?, string?][]> = {
  solista: [["Kalé", "Urbano"], ["Nía Rivas", "Pop"], ["Lucho Mena", "Salsa"], ["Dama Brava", "Música popular"], ["El Moncho", "Vallenato"],
    ["Yaku", "Música andina colombiana"], ["Marí Solar", "Indie / Alternativo"], ["Tato Caicedo", "Música del Pacífico"],
    ["La Nena Palacios", "Champeta"], ["Jhoan Beat", "Reggaetón"], ["Sol de Tumaco", "Música afro"], ["Brisa Quintero", "Balada"],
    ["Mono Cuesta", "Trap"], ["Isa Largacha", "Bolero"], ["Chelo Díaz", "Música llanera"], ["Ruzo", "Hip hop / Rap"],
    ["Aurora Mena", "Jazz"], ["Pipe Zapata", "Música popular"], ["Kiara Mosquera", "Urbano"], ["Samy Ortiz", "Música cristiana"],
    ["Lina Arboleda", "Pop"], ["Nando Torres", "Ranchera / Regional mexicano"], ["Vale Córdoba", "Fusión"]],
  agrupacion: [["Los Caimanes del Atrato", "Música del Pacífico"], ["Sonora Puerto Nuevo", "Salsa"], ["La Tribu del Manglar", "Música afro"],
    ["Parranda Sabanera", "Porro / Bandas"], ["Combo Chontaduro", "Salsa"], ["Banda La Guacamaya", "Porro / Bandas"],
    ["Kumbia Ekeko", "Cumbia"], ["Rituales del Sur", "Rock"], ["Los Hijos del Cacique", "Vallenato"], ["Marea Alta", "Fusión"],
    ["Ciudad Neón", "Indie / Alternativo"], ["Ruido Blanco", "Metal"], ["Tambó Tambó", "Champeta"], ["Los del Llano", "Música llanera"]],
  duo: [["Mar y Tierra", "Pop"], ["Los Hermanos Quiñones", "Vallenato"], ["Luna & Sal", "Balada"], ["Dúo Bambuco Nuevo", "Música andina colombiana"],
    ["Doble Filo", "Urbano"]],
  orquesta: [["Orquesta La Suprema", "Salsa"], ["Orquesta Swing del Valle", "Salsa"], ["Gran Orquesta Mar Caribe", "Música tropical"],
    ["Orquesta Filarmónica Juvenil del Norte", "Música clásica"]],
  dj: [["DJ Manglar", "Electrónica"], ["Nova Kid", "House / Techno"], ["Selecta Marimba", "Electrónica"], ["Dj Kora", "Reggaetón"],
    ["Bass Pacífico", "House / Techno"]],
  otro: [["Colectivo Tambor Vivo", "Música afro", "Colectivo de música tradicional", "colectivo"],
    ["Cantadora del Río", "Música del Pacífico", "Proyecto de cantos tradicionales", "individual"],
    ["Sonidos del Barrio", "Hip hop / Rap", "Proyecto audiovisual-musical", "colectivo"]],
};

const TERRITORIOS: [string, string, string, number][] = [
  ["Colombia", "Valle del Cauca", "Cali", 10], ["Colombia", "Bogotá D.C.", "Bogotá D.C.", 9], ["Colombia", "Antioquia", "Medellín", 8],
  ["Colombia", "Atlántico", "Barranquilla", 6], ["Colombia", "Bolívar", "Cartagena de Indias", 5], ["Colombia", "Chocó", "Quibdó", 4],
  ["Colombia", "Cesar", "Valledupar", 4], ["Colombia", "Nariño", "Tumaco", 3], ["Colombia", "Santander", "Bucaramanga", 3],
  ["Colombia", "Meta", "Villavicencio", 2], ["Colombia", "Cauca", "Guapi", 2], ["Colombia", "Magdalena", "Santa Marta", 2],
  ["Colombia", "Córdoba", "Montería", 2], ["Colombia", "Risaralda", "Pereira", 2], ["Colombia", "Valle del Cauca", "Buenaventura", 2],
  ["Colombia", "Antioquia", "Envigado", 1], ["Colombia", "Sucre", "Sincelejo", 1], ["Colombia", "Tolima", "Ibagué", 1],
  ["Estados Unidos", "Florida", "Miami", 2], ["México", "Ciudad de México", "Ciudad de México", 1], ["España", "Comunidad de Madrid", "Madrid", 1],
];

const RANGOS = ["menos_2m", "2m_5m", "5m_10m", "10m_20m", "20m_50m", "50m_100m", "mas_100m", "segun_evento"];
const MOTIVOS_CORRECCION = [
  "La fotografía tiene marca de agua o baja resolución.",
  "El enlace musical principal no funciona.",
  "Faltan datos de uno de los integrantes.",
  "El nombre del proyecto no coincide con el del enlace musical.",
];

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 20);
const DAY = 86400000;

export type Miembro = { nombre: string; tipoDocumento: string; numeroDocumento: string; paisExpedicion: string; rol: string; rolOtro: string };
export type Nota = { fecha: string; autor: string; texto: string };
export type Historial = { fecha: string; autor: string; accion: string; detalle: string; privado?: boolean };

export type Rec = {
  id: string; creado: string; estado: EstadoRegistro; motivo: string;
  tipo: TipoProyecto; otroDescripcion: string; otroComposicion: Identidad | null; identidad: Identidad;
  nombreProyecto: string; generoPrincipal: string; otrosGeneros: string[]; otroGenero: string;
  nacionalidad: string; paisResidencia: string; regionResidencia: string; ciudadActual: string;
  paisOrigen: string; regionOrigen: string; ciudadOrigen: string;
  nombreCompleto: string; tipoDocumento: string; numeroDocumento: string; paisExpedicion: string;
  miembros: Miembro[];
  plataformaMusical: string; enlaceMusical: string; otrosEnlaces: { plataforma: string; url: string }[];
  redSocialTipo: string; redSocial: string; otrasRedes: { plataforma: string; url: string }[];
  foto: null;
  rangoContratacion: string;
  contactoNombre: string; contactoWhatsapp: string; contactoEmail: string;
  quienRegistra: string; registranteNombre: string; registranteEmail: string; registranteWhatsapp: string;
  declInfo: boolean; declAutorizado: boolean; declIntegrantes: boolean; declMayoria: boolean; declDatos: boolean; declReglamento: boolean;
  notas: Nota[]; historial: Historial[];
};

export function generate(): Rec[] {
  const r = rng(20260924);
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const weighted = <T extends readonly [string, number, number, number]>(a: T[]): T => {
    const tot = a.reduce((s, x) => s + x[3], 0);
    let n = r() * tot;
    return a.find((x) => (n -= x[3]) < 0) ?? a[0];
  };
  const weightedTerritorio = (a: [string, string, string, number][]) => {
    const tot = a.reduce((s, x) => s + x[3], 0);
    let n = r() * tot;
    return a.find((x) => (n -= x[3]) < 0) ?? a[0];
  };
  const persona = () => `${pick(NOMBRES)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
  const cedula = () => String(Math.floor(r() * 9e8) + 1e7);
  const telefono = () => `+57 3${Math.floor(r() * 3) + 0}${Math.floor(r() * 10)} ${Math.floor(r() * 900 + 100)} ${Math.floor(r() * 9000 + 1000)}`;
  const usados: Record<string, number> = {};
  const vistos = new Set<string>();
  const now = Date.now();
  const out: Rec[] = [];

  const TIPO_PESO: [string, number, number, number][] = [
    ["solista", 0, 0, 44], ["agrupacion", 0, 0, 22], ["duo", 0, 0, 8], ["orquesta", 0, 0, 6], ["dj", 0, 0, 12], ["otro", 0, 0, 4],
  ];
  const N = 96;

  for (let i = 0; i < N; i++) {
    const tipo = weighted(TIPO_PESO)[0] as TipoProyecto;
    const lista = PROYECTOS[tipo];
    const vez = (usados[tipo] = (usados[tipo] || 0) + 1) - 1;
    const base = lista[vez % lista.length];
    let nombre = base[0];
    while (vez >= lista.length && (nombre === base[0] || vistos.has(nombre))) {
      const nom = pick(NOMBRES).split(" ")[0];
      nombre = ({
        solista: `${nom} ${pick(APELLIDOS)}`,
        dj: `DJ ${nom}`,
        duo: `${nom} y ${pick(NOMBRES).split(" ")[0]}`,
        agrupacion: `${pick(["Grupo", "Conjunto", "Combo", "Los Parceros de"])} ${pick(["Chambacú", "La Loma", "El Cerro", "Juanchaco", "La Candelaria", "Siloé"])}`,
        orquesta: `Orquesta ${pick(APELLIDOS)} Band`,
        otro: `Colectivo ${pick(APELLIDOS)}`,
      } as Record<string, string>)[tipo];
    }
    vistos.add(nombre);
    const genero = base[1];
    const identidad: Identidad = tipo === "otro" ? (base[3] as Identidad) : (["solista", "dj"].includes(tipo) ? "individual" : "colectivo");
    const [pais, region, ciudad] = weightedTerritorio(TERRITORIOS);
    const mismoOrigen = r() < 0.7;
    const [pO, rO, cO] = mismoOrigen ? [pais, region, ciudad] : weightedTerritorio(TERRITORIOS.filter((t) => t[0] === "Colombia"));
    const extranjero = pais !== "Colombia" && r() < 0.5;

    const dias = Math.floor(Math.pow(r(), 1.35) * 78);
    const creado = new Date(now - dias * DAY - Math.floor(r() * DAY));

    const rec: Rec = {
      id: `MR-2026-${(r().toString(36) + "000000").slice(2, 8).toUpperCase()}`,
      creado: creado.toISOString(),
      estado: "pendiente",
      motivo: "",
      tipo,
      otroDescripcion: tipo === "otro" ? (base[2] ?? "") : "",
      otroComposicion: tipo === "otro" ? (base[3] as Identidad) : null,
      identidad,
      nombreProyecto: nombre,
      generoPrincipal: genero,
      otrosGeneros: [],
      otroGenero: "",
      nacionalidad: extranjero ? pais : "Colombia",
      paisResidencia: pais, regionResidencia: region, ciudadActual: ciudad,
      paisOrigen: pO, regionOrigen: rO, ciudadOrigen: cO,
      nombreCompleto: "", tipoDocumento: "", numeroDocumento: "", paisExpedicion: "",
      miembros: [],
      plataformaMusical: pick(["spotify", "spotify", "youtube", "youtube", "soundcloud", "apple_music"]),
      enlaceMusical: "",
      otrosEnlaces: [],
      redSocialTipo: pick(["instagram", "instagram", "instagram", "tiktok", "youtube", "facebook"]),
      redSocial: `@${slug(nombre)}`,
      otrasRedes: [],
      foto: null,
      rangoContratacion: "",
      contactoNombre: "", contactoWhatsapp: telefono(), contactoEmail: "",
      quienRegistra: "artista",
      registranteNombre: "", registranteEmail: "", registranteWhatsapp: "",
      declInfo: true, declAutorizado: true, declIntegrantes: false, declMayoria: true, declDatos: true, declReglamento: true,
      notas: [],
      historial: [],
    };
    const OTROS_GENEROS = ["Salsa", "Urbano", "Vallenato", "Música popular", "Afro", "Electrónica", "Pop", "Rock", "Regional", "Tradicional", "Alternativa", "Tropical", "Fusión"];
    rec.otrosGeneros = OTROS_GENEROS.filter((g) => g !== genero && r() < 0.14).slice(0, 3);

    rec.enlaceMusical = ({
      spotify: `https://open.spotify.com/artist/${slug(nombre)}${i}`,
      youtube: `https://www.youtube.com/@${slug(nombre)}`,
      soundcloud: `https://soundcloud.com/${slug(nombre)}`,
      apple_music: `https://music.apple.com/co/artist/${slug(nombre)}/${1000 + i}`,
    } as Record<string, string>)[rec.plataformaMusical];
    if (r() < 0.45) rec.otrosEnlaces.push({ plataforma: rec.plataformaMusical === "youtube" ? "spotify" : "youtube", url: rec.plataformaMusical === "youtube" ? `https://open.spotify.com/artist/${slug(nombre)}` : `https://www.youtube.com/@${slug(nombre)}` });
    if (r() < 0.4) rec.otrasRedes.push({ plataforma: rec.redSocialTipo === "tiktok" ? "instagram" : "tiktok", url: `@${slug(nombre)}` });

    if (identidad === "individual") {
      rec.nombreCompleto = persona();
      rec.tipoDocumento = extranjero ? "PA" : r() < 0.95 ? "CC" : "CE";
      rec.numeroDocumento = rec.tipoDocumento === "PA" ? `G${Math.floor(r() * 9e7 + 1e7)}` : cedula();
      rec.paisExpedicion = extranjero ? pais : "Colombia";
    } else {
      const n = tipo === "duo" ? 2 : tipo === "orquesta" ? 8 + Math.floor(r() * 5) : 3 + Math.floor(r() * 4);
      for (let m = 0; m < n; m++) {
        const rol = m === 0 && tipo === "orquesta" ? "director" : m === 0 ? "voz" : pick(["instrumentista", "instrumentista", "voz", "productor", "otro"]);
        rec.miembros.push({
          nombre: persona(), tipoDocumento: "CC", numeroDocumento: cedula(), paisExpedicion: "Colombia",
          rol, rolOtro: rol === "otro" ? pick(["Coros", "Arreglista", "Percusión menor"]) : "",
        });
      }
      rec.declIntegrantes = true;
    }
    const titular = rec.nombreCompleto || rec.miembros[0].nombre;

    rec.rangoContratacion = RANGOS[Math.min(7, Math.floor(Math.pow(r(), 1.6) * (tipo === "orquesta" ? 7 : 6)) + (tipo === "orquesta" ? 2 : 0))];
    if (r() < 0.12) rec.rangoContratacion = "segun_evento";

    rec.quienRegistra = identidad === "colectivo" ? pick(["lider", "lider", "integrante", "manager", "representante"]) : pick(["artista", "artista", "artista", "manager", "equipo"]);
    rec.contactoNombre = (rec.quienRegistra === "artista" || (rec.quienRegistra === "lider" && r() < 0.5)) ? titular : persona();
    rec.contactoEmail = `${r() < 0.5 ? "booking" : "contacto"}@${slug(nombre)}.com`;
    if (rec.quienRegistra !== "artista") {
      rec.registranteNombre = rec.contactoNombre === titular ? persona() : rec.contactoNombre;
      rec.registranteEmail = `${slug(rec.registranteNombre).slice(0, 12)}@gmail.com`;
      rec.registranteWhatsapp = telefono();
      rec.declIntegrantes = true;
    }

    rec.historial.push({ fecha: rec.creado, autor: "Formulario web", accion: "Registro recibido", detalle: "" });

    const x = r();
    if (dias > 6 || x < 0.25) {
      const e: EstadoRegistro = x < 0.66 ? "aprobado" : x < 0.8 ? "correccion" : x < 0.9 ? "rechazado" : dias < 20 ? "pendiente" : "aprobado";
      if (e !== "pendiente" && dias > 0) {
        const fecha = new Date(creado.getTime() + (0.2 + r() * Math.min(4, dias)) * DAY).toISOString();
        rec.estado = e;
        rec.motivo = e === "correccion" ? pick(MOTIVOS_CORRECCION) : e === "rechazado" ? pick(["No es un proyecto musical con identidad propia.", "Los datos de identificación no son verificables."]) : "";
        rec.historial.push({
          fecha, autor: pick(["Laura Méndez", "Óscar Ruiz"]),
          accion: ({ aprobado: "Aprobó y publicó el perfil", correccion: "Pidió corrección", rechazado: "Rechazó el registro" } as Record<string, string>)[e],
          detalle: rec.motivo,
        });
      }
    }
    out.push(rec);
  }

  // Casos armados a mano para la cola de verificación (misma lógica que admin-data.js).
  const indiv = out.filter((x) => x.identidad === "individual");
  const colect = out.filter((x) => x.identidad === "colectivo");

  indiv[20].numeroDocumento = indiv[3].numeroDocumento;
  indiv[20].tipoDocumento = indiv[3].tipoDocumento = "CC";
  indiv[20].estado = "pendiente"; indiv[20].motivo = ""; indiv[20].historial.length = 1;

  colect[2].miembros[1].numeroDocumento = indiv[8].numeroDocumento;
  colect[2].miembros[1].nombre = indiv[8].nombreCompleto;
  colect[2].miembros[1].tipoDocumento = indiv[8].tipoDocumento = "CC";

  const dup = colect[5];
  const copia: Rec = JSON.parse(JSON.stringify(dup));
  copia.id = "MR-2026-Q7XK2A";
  copia.nombreProyecto = dup.nombreProyecto.toUpperCase();
  copia.creado = new Date(Math.min(now - 3600000, Date.parse(dup.creado) + 2 * DAY)).toISOString();
  copia.estado = "pendiente"; copia.motivo = "";
  copia.quienRegistra = "manager";
  copia.registranteNombre = "Wilmer Ospina Mena";
  copia.registranteEmail = "wilmerospina@gmail.com";
  copia.historial = [{ fecha: copia.creado, autor: "Formulario web", accion: "Registro recibido", detalle: "" }];
  copia.notas = [];
  out.push(copia);

  indiv[30].contactoEmail = indiv[12].contactoEmail = "booking@palenquemusic.co";
  [indiv[30], indiv[12]].forEach((x) => { x.estado = "aprobado"; x.motivo = ""; x.historial.length = 1; });
  indiv[30].estado = "pendiente";

  out.forEach((rec) => {
    if (rec.estado === "correccion" && rec.notas.length === 0 && r() < 0.5) {
      rec.notas.push({ fecha: rec.historial[1].fecha, autor: rec.historial[1].autor, texto: "Se escribió al contacto por WhatsApp para avisarle." });
    }
  });
  out[0].notas.push({ fecha: out[0].creado, autor: "Óscar Ruiz", texto: "Verificar si la foto es la oficial: en Instagram aparece otra." });

  return out.sort((a, b) => b.creado.localeCompare(a.creado));
}
