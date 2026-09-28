// Catálogos únicos de Billboard MusicRoster.
// Antes vivían duplicados en assets/js/registro.js y assets/js/admin-data.js;
// el propio CLAUDE.md pedía mantenerlos sincronizados a mano. Ahora hay una sola fuente,
// usada tanto por los formularios (cliente) como por los esquemas Zod (servidor).

export const TIPOS_PROYECTO = {
  solista: "Artista solista",
  agrupacion: "Agrupación",
  duo: "Dúo",
  orquesta: "Orquesta",
  dj: "DJ",
  otro: "Otro proyecto",
} as const;
export type TipoProyecto = keyof typeof TIPOS_PROYECTO;

export const TIPOS_DOCUMENTO = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
  OTRO: "Otro",
} as const;
export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;

export const ROLES_INTEGRANTE = {
  voz: "Voz",
  instrumentista: "Instrumentista",
  dj: "DJ",
  productor: "Productor integrante",
  director: "Director",
  otro: "Otro",
} as const;
export type RolIntegrante = keyof typeof ROLES_INTEGRANTE;

export const PLATAFORMAS_MUSICA = [
  ["spotify", "Spotify"],
  ["youtube", "YouTube"],
  ["apple_music", "Apple Music"],
  ["soundcloud", "SoundCloud"],
  ["otra", "Otra plataforma"],
] as const;

export const PLATAFORMAS_REDES = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["facebook", "Facebook"],
  ["otra", "Otra"],
] as const;

export const RANGOS_CONTRATACION = [
  ["menos_2m", "Menos de $2 M"],
  ["2m_5m", "$2 M – $5 M"],
  ["5m_10m", "$5 M – $10 M"],
  ["10m_20m", "$10 M – $20 M"],
  ["20m_50m", "$20 M – $50 M"],
  ["50m_100m", "$50 M – $100 M"],
  ["mas_100m", "Más de $100 M"],
  ["segun_evento", "Cotización según las características del evento"],
] as const;
export type RangoContratacion = (typeof RANGOS_CONTRATACION)[number][0];

export const QUIEN_REGISTRA = {
  artista: "El propio artista",
  integrante: "Un miembro de la agrupación",
  lider: "Líder / director",
  manager: "Manager",
  representante: "Representante",
  equipo: "Miembro del equipo",
  otro: "Otro tercero autorizado",
} as const;
export type QuienRegistra = keyof typeof QUIEN_REGISTRA;

export const ESTADOS_REGISTRO = {
  pendiente: "Pendiente",
  correccion: "Requiere corrección",
  aprobado: "Publicado",
  rechazado: "Rechazado",
} as const;
export type EstadoRegistro = keyof typeof ESTADOS_REGISTRO;

// Las 6 aceptaciones del anexo "Aceptaciones del formulario" (reglamento.html).
export const DECLARACIONES = [
  ["declInfo", "La información suministrada es verdadera."],
  ["declAutorizado", "Es el artista, un miembro o una persona autorizada."],
  ["declIntegrantes", "Cuenta con autorización de las demás personas cuyos datos suministra."],
  ["declMayoria", "Todas las personas involucradas son mayores de 18 años."],
  ["declDatos", "Autoriza el tratamiento de datos y la publicación del perfil."],
  ["declReglamento", "Leyó y aceptó el Reglamento."],
] as const;

export const GENEROS = [
  "Urbano", "Reggaetón", "Hip hop / Rap", "Trap", "Salsa", "Música afro", "Champeta", "Música del Pacífico",
  "Vallenato", "Música popular", "Música tropical", "Cumbia", "Porro / Bandas", "Música llanera", "Música andina colombiana",
  "Electrónica", "House / Techno", "Pop", "Rock", "Metal", "Indie / Alternativo", "Balada", "Bolero", "Ranchera / Regional mexicano",
  "Jazz", "Fusión", "Música clásica", "Música cristiana", "Infantil", "Otro",
] as const;

export const OTROS_GENEROS = [
  "Salsa", "Urbano", "Vallenato", "Música popular", "Afro", "Electrónica", "Pop", "Rock", "Regional", "Tradicional",
  "Alternativa", "Tropical", "Fusión", "Otro",
] as const;

export const PAISES = [
  "Colombia", "Argentina", "Bolivia", "Brasil", "Canadá", "Chile", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España",
  "Estados Unidos", "Francia", "Alemania", "Guatemala", "Honduras", "Italia", "México", "Nicaragua", "Panamá", "Paraguay",
  "Perú", "Portugal", "Puerto Rico", "Reino Unido", "República Dominicana", "Uruguay", "Venezuela",
] as const;

const DEPARTAMENTOS_CO = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca",
  "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño",
  "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada",
];

// Regiones por país: los países sin lista aceptan texto libre.
export const REGIONES: Record<string, string[]> = {
  "Colombia": DEPARTAMENTOS_CO,
  "México": [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila",
    "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
    "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas",
    "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
  ],
  "Estados Unidos": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Carolina del Norte", "Carolina del Sur", "Colorado", "Connecticut",
    "Dakota del Norte", "Dakota del Sur", "Delaware", "Distrito de Columbia", "Florida", "Georgia", "Hawái", "Idaho", "Illinois",
    "Indiana", "Iowa", "Kansas", "Kentucky", "Luisiana", "Maine", "Maryland", "Massachusetts", "Míchigan", "Minnesota", "Misisipi",
    "Misuri", "Montana", "Nebraska", "Nevada", "Nueva Jersey", "Nueva York", "Nuevo Hampshire", "Nuevo México", "Ohio", "Oklahoma",
    "Oregón", "Pensilvania", "Rhode Island", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Virginia Occidental",
    "Washington", "Wisconsin", "Wyoming",
  ],
  "España": [
    "Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias", "Cantabria", "Castilla-La Mancha", "Castilla y León",
    "Cataluña", "Comunidad de Madrid", "Comunidad Valenciana", "Extremadura", "Galicia", "La Rioja", "Murcia", "Navarra",
    "País Vasco", "Ceuta", "Melilla",
  ],
  "Venezuela": [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Distrito Capital",
    "Falcón", "Guárico", "La Guaira", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira",
    "Trujillo", "Yaracuy", "Zulia",
  ],
  "Ecuador": [
    "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura",
    "Loja", "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena",
    "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora Chinchipe",
  ],
  "Perú": [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica",
    "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín",
    "Tacna", "Tumbes", "Ucayali",
  ],
};

export { MUNICIPIOS_CO } from "./municipios-co";

// Color de acento (tokens de globals.css) según la familia del género principal.
const ACENTO: [RegExp, string][] = [
  [/urbano|reggaet|hip hop|trap/i, "--g-urbano"],
  [/salsa|tropical|cumbia|porro|bolero/i, "--g-salsa"],
  [/afro|champeta|pac[ií]fico/i, "--g-afro"],
  [/vallenato|llanera|andina/i, "--g-vallenato"],
  [/popular|ranchera|balada/i, "--g-popular"],
  [/electr|house|techno/i, "--g-electronica"],
  [/pop|indie|jazz|fusi|cl[aá]sica/i, "--g-pop"],
  [/rock|metal/i, "--g-rock"],
];
export const acento = (genero: string): string =>
  (ACENTO.find(([re]) => re.test(genero || "")) ?? [null, "--g-regional"])[1] as string;

export const rangoLabel = (v: string | null | undefined): string =>
  RANGOS_CONTRATACION.find((r) => r[0] === v)?.[1] ?? v ?? "—";
