/* Billboard MusicRoster — datos de prueba del panel de administración
   Genera registros ficticios con los mismos campos que envía registro.html (ver registro.js)
   y los guarda en localStorage para que los cambios se vean entre páginas.
   Al migrar a Next.js, este módulo se reemplaza por la API: las vistas solo usan window.AdminData. */
(function () {
  "use strict";

  const KEY = "mr-admin-v1";
  const USER = { nombre: "Laura Méndez", rol: "Moderadora", iniciales: "LM" };

  /* ---------- Catálogos (mismos valores que registro.js) ---------- */
  const TIPOS = { solista: "Artista solista", agrupacion: "Agrupación", duo: "Dúo", orquesta: "Orquesta", dj: "DJ", otro: "Otro proyecto" };
  const DOCS = { CC: "Cédula de ciudadanía", CE: "Cédula de extranjería", PA: "Pasaporte", OTRO: "Otro" };
  const ROLES = { voz: "Voz", instrumentista: "Instrumentista", dj: "DJ", productor: "Productor integrante", director: "Director", otro: "Otro" };
  const PLATAFORMAS = {
    spotify: "Spotify", youtube: "YouTube", apple_music: "Apple Music", soundcloud: "SoundCloud",
    instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", otra: "Otra",
  };
  const RANGOS = [
    ["menos_2m", "Menos de $2 M"], ["2m_5m", "$2 M – $5 M"], ["5m_10m", "$5 M – $10 M"], ["10m_20m", "$10 M – $20 M"],
    ["20m_50m", "$20 M – $50 M"], ["50m_100m", "$50 M – $100 M"], ["mas_100m", "Más de $100 M"],
    ["segun_evento", "Según el evento"],
  ];
  const QUIEN = {
    artista: "El propio artista", integrante: "Un miembro de la agrupación", lider: "Líder / director", manager: "Manager",
    representante: "Representante", equipo: "Miembro del equipo", otro: "Otro tercero autorizado",
  };
  const ESTADOS = {
    pendiente: "Pendiente",
    correccion: "Requiere corrección",
    aprobado: "Publicado",
    rechazado: "Rechazado",
  };
  const DECLARACIONES = [
    ["decl_info", "La información suministrada es verdadera."],
    ["decl_autorizado", "Es el artista, un miembro o una persona autorizada."],
    ["decl_integrantes", "Cuenta con autorización de las demás personas cuyos datos suministra."],
    ["decl_mayoria", "Todas las personas involucradas son mayores de 18 años."],
    ["decl_datos", "Autoriza el tratamiento de datos y la publicación del perfil."],
    ["decl_reglamento", "Leyó y aceptó el Reglamento."],
  ];
  const GENEROS = [
    "Urbano", "Reggaetón", "Hip hop / Rap", "Trap", "Salsa", "Música afro", "Champeta", "Música del Pacífico",
    "Vallenato", "Música popular", "Música tropical", "Cumbia", "Porro / Bandas", "Música llanera", "Música andina colombiana",
    "Electrónica", "House / Techno", "Pop", "Rock", "Metal", "Indie / Alternativo", "Balada", "Bolero", "Ranchera / Regional mexicano",
    "Jazz", "Fusión", "Música clásica", "Música cristiana", "Infantil", "Otro",
  ];
  const OTROS_GENEROS = ["Salsa", "Urbano", "Vallenato", "Música popular", "Afro", "Electrónica", "Pop", "Rock", "Regional", "Tradicional", "Alternativa", "Tropical", "Fusión"];

  // Color de acento (tokens de styles.css) según la familia del género principal
  const ACENTO = [
    [/urbano|reggaet|hip hop|trap/i, "--g-urbano"],
    [/salsa|tropical|cumbia|porro|bolero/i, "--g-salsa"],
    [/afro|champeta|pac[ií]fico/i, "--g-afro"],
    [/vallenato|llanera|andina/i, "--g-vallenato"],
    [/popular|ranchera|balada/i, "--g-popular"],
    [/electr|house|techno/i, "--g-electronica"],
    [/pop|indie|jazz|fusi|cl[aá]sica/i, "--g-pop"],
    [/rock|metal/i, "--g-rock"],
  ];
  const acento = (genero) => (ACENTO.find(([re]) => re.test(genero || "")) || [0, "--g-regional"])[1];

  /* ---------- Generador determinista ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
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

  const PROYECTOS = {
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

  const TERRITORIOS = [
    ["Colombia", "Valle del Cauca", "Cali", 10], ["Colombia", "Bogotá D.C.", "Bogotá D.C.", 9], ["Colombia", "Antioquia", "Medellín", 8],
    ["Colombia", "Atlántico", "Barranquilla", 6], ["Colombia", "Bolívar", "Cartagena de Indias", 5], ["Colombia", "Chocó", "Quibdó", 4],
    ["Colombia", "Cesar", "Valledupar", 4], ["Colombia", "Nariño", "Tumaco", 3], ["Colombia", "Santander", "Bucaramanga", 3],
    ["Colombia", "Meta", "Villavicencio", 2], ["Colombia", "Cauca", "Guapi", 2], ["Colombia", "Magdalena", "Santa Marta", 2],
    ["Colombia", "Córdoba", "Montería", 2], ["Colombia", "Risaralda", "Pereira", 2], ["Colombia", "Valle del Cauca", "Buenaventura", 2],
    ["Colombia", "Antioquia", "Envigado", 1], ["Colombia", "Sucre", "Sincelejo", 1], ["Colombia", "Tolima", "Ibagué", 1],
    ["Estados Unidos", "Florida", "Miami", 2], ["México", "Ciudad de México", "Ciudad de México", 1], ["España", "Comunidad de Madrid", "Madrid", 1],
  ];

  const MOTIVOS_CORRECCION = [
    "La fotografía tiene marca de agua o baja resolución.",
    "El enlace musical principal no funciona.",
    "Faltan datos de uno de los integrantes.",
    "El nombre del proyecto no coincide con el del enlace musical.",
  ];

  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 20);
  const DAY = 86400000;

  function generate() {
    const r = rng(20260924);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const weighted = (a) => { const tot = a.reduce((s, x) => s + x[3], 0); let n = r() * tot; return a.find((x) => (n -= x[3]) < 0) || a[0]; };
    const persona = () => `${pick(NOMBRES)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
    const cedula = () => String(Math.floor(r() * 9e8) + 1e7);
    const telefono = () => `+57 3${Math.floor(r() * 3) + 0}${Math.floor(r() * 10)} ${Math.floor(r() * 900 + 100)} ${Math.floor(r() * 9000 + 1000)}`;
    const usados = {};
    const vistos = new Set();
    const now = Date.now();
    const out = [];

    const TIPO_PESO = [["solista", 0, 0, 44], ["agrupacion", 0, 0, 22], ["duo", 0, 0, 8], ["orquesta", 0, 0, 6], ["dj", 0, 0, 12], ["otro", 0, 0, 4]];
    const N = 96;

    for (let i = 0; i < N; i++) {
      const tipo = weighted(TIPO_PESO)[0];
      const lista = PROYECTOS[tipo];
      const vez = (usados[tipo] = (usados[tipo] || 0) + 1) - 1;
      const base = lista[vez % lista.length];
      let nombre = base[0];
      // Agotada la lista, se inventa un nombre del mismo estilo
      while (vez >= lista.length && (nombre === base[0] || vistos.has(nombre))) {
        const nom = pick(NOMBRES).split(" ")[0];
        nombre = {
          solista: `${nom} ${pick(APELLIDOS)}`,
          dj: `DJ ${nom}`,
          duo: `${nom} y ${pick(NOMBRES).split(" ")[0]}`,
          agrupacion: `${pick(["Grupo", "Conjunto", "Combo", "Los Parceros de"])} ${pick(["Chambacú", "La Loma", "El Cerro", "Juanchaco", "La Candelaria", "Siloé"])}`,
          orquesta: `Orquesta ${pick(APELLIDOS)} Band`,
          otro: `Colectivo ${pick(APELLIDOS)}`,
        }[tipo];
      }
      vistos.add(nombre);
      const genero = base[1];
      const identidad = tipo === "otro" ? base[3] : ["solista", "dj"].includes(tipo) ? "individual" : "colectivo";
      const [pais, region, ciudad] = weighted(TERRITORIOS);
      const mismoOrigen = r() < 0.7;
      const [pO, rO, cO] = mismoOrigen ? [pais, region, ciudad] : weighted(TERRITORIOS.filter((t) => t[0] === "Colombia"));
      const extranjero = pais !== "Colombia" && r() < 0.5;

      // Fechas: más registros recientes, con un pico tras el lanzamiento
      const dias = Math.floor(Math.pow(r(), 1.35) * 78);
      const creado = new Date(now - dias * DAY - Math.floor(r() * DAY));

      const rec = {
        id: `MR-2026-${(r().toString(36) + "000000").slice(2, 8).toUpperCase()}`,
        creado: creado.toISOString(),
        estado: "pendiente",
        motivo: "",
        tipo,
        otro_descripcion: tipo === "otro" ? base[2] : "",
        otro_composicion: tipo === "otro" ? base[3] : "",
        identidad,
        nombre_proyecto: nombre,
        genero_principal: genero,
        otros_generos: OTROS_GENEROS.filter((g) => g !== genero && r() < 0.14).slice(0, 3),
        otro_genero: "",
        nacionalidad: extranjero ? pais : "Colombia",
        pais_residencia: pais, region_residencia: region, ciudad_actual: ciudad,
        pais_origen: pO, region_origen: rO, ciudad_origen: cO,
        nombre_completo: "", tipo_documento: "", numero_documento: "", pais_expedicion: "",
        miembros: [], lider: null,
        plataforma_musical: pick(["spotify", "spotify", "youtube", "youtube", "soundcloud", "apple_music"]),
        enlace_musical: "",
        otros_enlaces: [],
        red_social_tipo: pick(["instagram", "instagram", "instagram", "tiktok", "youtube", "facebook"]),
        red_social: `@${slug(nombre)}`,
        otras_redes: [],
        foto: null,
        rango_contratacion: "",
        contacto_nombre: "", contacto_whatsapp: telefono(), contacto_email: "",
        quien_registra: "artista",
        registrante_nombre: "", registrante_email: "", registrante_whatsapp: "",
        decl_info: true, decl_autorizado: true, decl_integrantes: false, decl_mayoria: true, decl_datos: true, decl_reglamento: true,
        notas: [],
        historial: [],
      };
      rec.enlace_musical = {
        spotify: `https://open.spotify.com/artist/${slug(nombre)}${i}`,
        youtube: `https://www.youtube.com/@${slug(nombre)}`,
        soundcloud: `https://soundcloud.com/${slug(nombre)}`,
        apple_music: `https://music.apple.com/co/artist/${slug(nombre)}/${1000 + i}`,
      }[rec.plataforma_musical];
      if (r() < 0.45) rec.otros_enlaces.push({ plataforma: rec.plataforma_musical === "youtube" ? "spotify" : "youtube", url: rec.plataforma_musical === "youtube" ? `https://open.spotify.com/artist/${slug(nombre)}` : `https://www.youtube.com/@${slug(nombre)}` });
      if (r() < 0.4) rec.otras_redes.push({ plataforma: rec.red_social_tipo === "tiktok" ? "instagram" : "tiktok", url: `@${slug(nombre)}` });

      if (identidad === "individual") {
        rec.nombre_completo = persona();
        rec.tipo_documento = extranjero ? "PA" : r() < 0.95 ? "CC" : "CE";
        rec.numero_documento = rec.tipo_documento === "PA" ? `G${Math.floor(r() * 9e7 + 1e7)}` : cedula();
        rec.pais_expedicion = extranjero ? pais : "Colombia";
      } else {
        const n = tipo === "duo" ? 2 : tipo === "orquesta" ? 8 + Math.floor(r() * 5) : 3 + Math.floor(r() * 4);
        for (let m = 0; m < n; m++) {
          const rol = m === 0 && tipo === "orquesta" ? "director" : m === 0 ? "voz" : pick(["instrumentista", "instrumentista", "voz", "productor", "otro"]);
          rec.miembros.push({
            nombre: persona(), tipo_documento: "CC", numero_documento: cedula(), pais_expedicion: "Colombia",
            rol, rol_otro: rol === "otro" ? pick(["Coros", "Arreglista", "Percusión menor"]) : "",
          });
        }
        rec.lider = 0;
        rec.decl_integrantes = true;
      }
      const titular = rec.nombre_completo || rec.miembros[0].nombre;

      rec.rango_contratacion = RANGOS[Math.min(7, Math.floor(Math.pow(r(), 1.6) * (tipo === "orquesta" ? 7 : 6)) + (tipo === "orquesta" ? 2 : 0))][0];
      if (r() < 0.12) rec.rango_contratacion = "segun_evento";

      rec.quien_registra = identidad === "colectivo" ? pick(["lider", "lider", "integrante", "manager", "representante"]) : pick(["artista", "artista", "artista", "manager", "equipo"]);
      if (rec.quien_registra === "artista" || (rec.quien_registra === "lider" && r() < 0.5)) {
        rec.contacto_nombre = titular;
      } else {
        rec.contacto_nombre = persona();
      }
      rec.contacto_email = `${r() < 0.5 ? "booking" : "contacto"}@${slug(nombre)}.com`;
      if (rec.quien_registra !== "artista") {
        rec.registrante_nombre = rec.contacto_nombre === titular ? persona() : rec.contacto_nombre;
        rec.registrante_email = `${slug(rec.registrante_nombre).slice(0, 12)}@gmail.com`;
        rec.registrante_whatsapp = telefono();
        rec.decl_integrantes = true;
      }

      rec.historial.push({ fecha: rec.creado, autor: "Formulario web", accion: "Registro recibido", detalle: "" });

      // Estado: lo más reciente suele estar pendiente
      const x = r();
      if (dias > 6 || x < 0.25) {
        const e = x < 0.66 ? "aprobado" : x < 0.8 ? "correccion" : x < 0.9 ? "rechazado" : dias < 20 ? "pendiente" : "aprobado";
        if (e !== "pendiente" && dias > 0) {
          const fecha = new Date(creado.getTime() + (0.2 + r() * Math.min(4, dias)) * DAY).toISOString();
          rec.estado = e;
          rec.motivo = e === "correccion" ? pick(MOTIVOS_CORRECCION) : e === "rechazado" ? pick(["No es un proyecto musical con identidad propia.", "Los datos de identificación no son verificables."]) : "";
          rec.historial.push({ fecha, autor: pick(["Laura Méndez", "Óscar Ruiz"]), accion: { aprobado: "Aprobó y publicó el perfil", correccion: "Pidió corrección", rechazado: "Rechazó el registro" }[e], detalle: rec.motivo });
        }
      }
      out.push(rec);
    }

    // Casos para la cola de verificación
    const indiv = out.filter((x) => x.identidad === "individual");
    const colect = out.filter((x) => x.identidad === "colectivo");
    // 1. Mismo documento en dos registros individuales (posible suplantación)
    indiv[20].numero_documento = indiv[3].numero_documento;
    indiv[20].tipo_documento = indiv[3].tipo_documento = "CC";
    indiv[20].estado = "pendiente"; indiv[20].motivo = ""; indiv[20].historial.length = 1;
    // 2. Una persona que aparece como integrante de una agrupación y como solista
    colect[2].miembros[1].numero_documento = indiv[8].numero_documento;
    colect[2].miembros[1].nombre = indiv[8].nombre_completo;
    colect[2].miembros[1].tipo_documento = indiv[8].tipo_documento = "CC";
    // 3. El mismo proyecto registrado dos veces
    const dup = colect[5];
    const copia = JSON.parse(JSON.stringify(dup));
    copia.id = "MR-2026-Q7XK2A";
    copia.nombre_proyecto = dup.nombre_proyecto.replace(/^Los /, "Los ").toUpperCase();
    copia.creado = new Date(Math.min(now - 3600000, Date.parse(dup.creado) + 2 * DAY)).toISOString();
    copia.estado = "pendiente"; copia.motivo = "";
    copia.quien_registra = "manager";
    copia.registrante_nombre = "Wilmer Ospina Mena";
    copia.registrante_email = "wilmerospina@gmail.com";
    copia.historial = [{ fecha: copia.creado, autor: "Formulario web", accion: "Registro recibido", detalle: "" }];
    copia.notas = [];
    out.push(copia);
    // 4. Mismo correo de contacto en dos proyectos distintos (puede ser un mismo manager: no siempre es un problema)
    indiv[30].contacto_email = indiv[12].contacto_email = "booking@palenquemusic.co";
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

  /* ---------- Almacenamiento ---------- */
  let db = null;

  function load() {
    if (db) return db;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !Array.isArray(db.records)) db = { records: generate(), dismissed: [] };
    return db;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento: los cambios duran hasta recargar */ }
  }
  const stamp = () => new Date().toISOString();

  /* ---------- Posibles duplicados ---------- */
  const normTxt = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const docsOf = (rec) => rec.identidad === "individual"
    ? [{ numero: rec.numero_documento, tipo: rec.tipo_documento, persona: rec.nombre_completo }]
    : rec.miembros.map((m) => ({ numero: m.numero_documento, tipo: m.tipo_documento, persona: m.nombre }));

  const KINDS = ["documento", "nombre", "email"];

  /* Agrupa los registros que comparten un documento, el nombre del proyecto o el correo de contacto.
     Cada caso reúne un conjunto de registros y todas las coincidencias entre ellos. */
  function duplicates() {
    const { records, dismissed } = load();
    const byValue = {};
    const add = (key, kind, rec, doc) => {
      const g = (byValue[key] = byValue[key] || { kind, items: [], docs: {} });
      if (!g.items.includes(rec)) g.items.push(rec);
      if (doc) (g.docs[rec.id] = g.docs[rec.id] || []).push(doc);
    };
    records.forEach((rec) => {
      docsOf(rec).forEach((d) => d.numero && add(`doc:${normTxt(d.numero)}`, "documento", rec, d));
      add(`nombre:${normTxt(rec.nombre_proyecto)}`, "nombre", rec);
      add(`email:${normTxt(rec.contacto_email)}`, "email", rec);
    });

    const cases = {};
    Object.values(byValue).filter((g) => g.items.length > 1).forEach((g) => {
      const items = g.items.slice().sort((a, b) => a.creado.localeCompare(b.creado));
      const key = items.map((x) => x.id).join("+");
      const c = (cases[key] = cases[key] || { key, kinds: [], items, docs: {} });
      if (!c.kinds.includes(g.kind)) c.kinds.push(g.kind);
      Object.entries(g.docs).forEach(([id, list]) => (c.docs[id] = (c.docs[id] || []).concat(list)));
    });

    return Object.values(cases)
      .map((c) => {
        c.kinds.sort((a, b) => KINDS.indexOf(a) - KINDS.indexOf(b));
        return {
          ...c,
          kind: c.kinds[0],
          dismissed: dismissed.includes(c.key),
          // Deja de ser un caso abierto cuando solo queda un registro sin rechazar
          resolved: c.items.filter((x) => x.estado !== "rechazado").length < 2,
        };
      })
      .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || b.items[b.items.length - 1].creado.localeCompare(a.items[a.items.length - 1].creado));
  }
  const openDuplicates = () => duplicates().filter((g) => !g.dismissed && !g.resolved);

  /* ---------- API usada por las vistas ---------- */
  window.AdminData = {
    USER, TIPOS, DOCS, ROLES, PLATAFORMAS, RANGOS, QUIEN, ESTADOS, DECLARACIONES, GENEROS,
    rangoLabel: (v) => (RANGOS.find((x) => x[0] === v) || [0, v || "—"])[1],
    acento,

    all: () => load().records,
    get: (id) => load().records.find((x) => x.id === id) || null,

    /* Aplica cambios a un registro y deja constancia en el historial */
    update(id, patch, accion, detalle = "") {
      const rec = this.get(id);
      if (!rec) return null;
      Object.assign(rec, patch);
      if (accion) rec.historial.push({ fecha: stamp(), autor: USER.nombre, accion, detalle });
      persist();
      return rec;
    },
    setEstado(ids, estado, motivo = "") {
      const accion = { aprobado: "Aprobó y publicó el perfil", correccion: "Pidió corrección", rechazado: "Rechazó el registro", pendiente: "Devolvió a pendiente" }[estado];
      ids.forEach((id) => this.update(id, { estado, motivo: estado === "correccion" || estado === "rechazado" ? motivo : "" }, accion, motivo));
    },
    addNote(id, texto) {
      const rec = this.get(id);
      rec.notas.push({ fecha: stamp(), autor: USER.nombre, texto });
      persist();
    },
    /* Consultar un dato privado (documento) queda registrado, como pide la política de datos */
    logAccess(id, que) {
      const rec = this.get(id);
      rec.historial.push({ fecha: stamp(), autor: USER.nombre, accion: "Consultó un dato privado", detalle: que, privado: true });
      persist();
    },

    duplicates,
    openDuplicates,
    dismiss(key) { load().dismissed.push(key); persist(); },
    undismiss(key) { const d = load().dismissed; d.splice(d.indexOf(key), 1); persist(); },
    docsOf,

    reset() { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } db = null; },
  };
})();
