/* Billboard MusicRoster — cuestionario de registro */
(function () {
  "use strict";

  /* Cuando exista backend, definir aquí la URL que recibe el registro (multipart/form-data).
     Si queda en null, el envío se simula localmente. */
  const ENDPOINT = null;

  /* MODO PRUEBA: permite saltar entre los 7 pasos sin validar. Poner en false antes de publicar. */
  const TEST_MODE = true;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const form = $("#reg-form");
  if (!form) return;

  /* ---------- Catálogos ---------- */
  const GENEROS = [
    "Urbano", "Reggaetón", "Hip hop / Rap", "Trap", "Salsa", "Música afro", "Champeta", "Música del Pacífico",
    "Vallenato", "Música popular", "Música tropical", "Cumbia", "Porro / Bandas", "Música llanera", "Música andina colombiana",
    "Electrónica", "House / Techno", "Pop", "Rock", "Metal", "Indie / Alternativo", "Balada", "Bolero", "Ranchera / Regional mexicano",
    "Jazz", "Fusión", "Música clásica", "Música cristiana", "Infantil", "Otro",
  ];
  const OTROS_GENEROS = [
    "Salsa", "Urbano", "Vallenato", "Música popular", "Afro", "Electrónica", "Pop", "Rock", "Regional", "Tradicional",
    "Alternativa", "Tropical", "Fusión", "Otro",
  ];
  const DOCS = [
    ["", "Selecciona"], ["CC", "Cédula de ciudadanía"], ["CE", "Cédula de extranjería"], ["PA", "Pasaporte"], ["OTRO", "Otro"],
  ];
  const ROLES = [
    ["", "Selecciona"], ["voz", "Voz"], ["instrumentista", "Instrumentista"], ["dj", "DJ"],
    ["productor", "Productor integrante"], ["director", "Director"], ["otro", "Otro"],
  ];
  const PLATAFORMAS = {
    musica: [["spotify", "Spotify"], ["youtube", "YouTube"], ["apple_music", "Apple Music"], ["soundcloud", "SoundCloud"], ["otra", "Otra plataforma"]],
    redes: [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["facebook", "Facebook"], ["otra", "Otra"]],
  };
  const RANGOS = [
    ["menos_2m", "Menos de $2 M"], ["2m_5m", "$2 M – $5 M"], ["5m_10m", "$5 M – $10 M"], ["10m_20m", "$10 M – $20 M"],
    ["20m_50m", "$20 M – $50 M"], ["50m_100m", "$50 M – $100 M"], ["mas_100m", "Más de $100 M"],
    ["segun_evento", "Cotización según las características del evento"],
  ];
  const PAISES = [
    "Colombia", "Argentina", "Bolivia", "Brasil", "Canadá", "Chile", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España",
    "Estados Unidos", "Francia", "Alemania", "Guatemala", "Honduras", "Italia", "México", "Nicaragua", "Panamá", "Paraguay",
    "Perú", "Portugal", "Puerto Rico", "Reino Unido", "República Dominicana", "Uruguay", "Venezuela",
  ];
  const DEPARTAMENTOS = [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca",
    "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño",
    "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
    "Valle del Cauca", "Vaupés", "Vichada",
  ];
  /* Regiones por país: los países sin lista aceptan texto libre */
  const REGIONES = {
    "Colombia": DEPARTAMENTOS,
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
  /* Municipios de Colombia por departamento (DIVIPOLA), cargados desde municipios-co.js */
  const MUNICIPIOS_CO = window.MUNICIPIOS_CO || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const optionsHtml = (pairs) => pairs.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  const datalistHtml = (list) => list.map((v) => `<option value="${esc(v)}">`).join("");

  $("#paises").innerHTML = datalistHtml(PAISES);
  $("#genero_principal").innerHTML += GENEROS.map((g) => `<option>${g}</option>`).join("");
  $("#otros_generos").innerHTML = OTROS_GENEROS.map(
    (g) => `<label><input type="checkbox" name="otros_generos" value="${g}"><span>${g}</span></label>`
  ).join("");
  $("#rangos").innerHTML = RANGOS.map(
    ([v, l], i) => `<label class="choice compact"><input type="radio" name="rango_contratacion" value="${v}"${i === 0 ? " required" : ""}><span class="card"><strong>${l}</strong></span></label>`
  ).join("");
  $$("[data-options]", form).forEach((s) => (s.innerHTML = optionsHtml(PLATAFORMAS[s.dataset.options])));
  // Desplegables con el diseño del sitio (dropdown.js); sin él quedan los nativos
  const enhanceDropdowns = (root) => { if (window.Dropdown) window.Dropdown.enhance(root); };
  const fillDocs = (root) => {
    $$("[data-doc-types]", root).forEach((s) => (s.innerHTML = optionsHtml(DOCS)));
    $$("[data-roles]", root).forEach((s) => (s.innerHTML = optionsHtml(ROLES)));
  };
  fillDocs(document);

  /* ---------- Territorio: región según país y municipio según región ---------- */
  const norm = (s) => String(s).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const lookup = (obj, key) => { const k = Object.keys(obj).find((o) => norm(o) === norm(key)); return k ? obj[k] : null; };

  $$("[data-territorio]", form).forEach((group) => {
    const pais = $("[data-pais]", group);
    const region = $("[data-region]", group);
    const ciudad = $("[data-ciudad]", group);
    const regionList = $(`#${region.getAttribute("list")}`);
    const ciudadList = $(`#${ciudad.getAttribute("list")}`);

    const fillCiudades = () => {
      if (norm(pais.value) !== "colombia") { ciudadList.innerHTML = ""; return; }
      const propios = lookup(MUNICIPIOS_CO, region.value);
      // Sin departamento elegido se sugieren todos, indicando a qué departamento pertenece cada uno
      ciudadList.innerHTML = propios
        ? datalistHtml(propios.map(([, nombre]) => nombre))
        : Object.entries(MUNICIPIOS_CO).flatMap(([dep, lista]) =>
            lista.map(([, nombre]) => `<option value="${esc(nombre)}" label="${esc(dep)}">`)).join("");
    };
    const fillRegiones = () => {
      const list = lookup(REGIONES, pais.value) || [];
      regionList.innerHTML = datalistHtml(list);
      // Si la región escrita no pertenece al nuevo país, se limpia
      if (region.value && list.length && !lookup(Object.fromEntries(list.map((r) => [r, 1])), region.value)) {
        region.value = "";
        ciudad.value = "";
      }
      fillCiudades();
    };
    pais.addEventListener("input", fillRegiones);
    region.addEventListener("input", () => {
      fillCiudades();
      // Si el municipio escrito no pertenece al nuevo departamento, se limpia
      const propios = norm(pais.value) === "colombia" && lookup(MUNICIPIOS_CO, region.value);
      if (propios && ciudad.value && !propios.some(([, nombre]) => norm(nombre) === norm(ciudad.value))) ciudad.value = "";
    });
    fillRegiones();
  });

  // Otros géneros: máximo 4 y nunca el principal
  const otros = $("#otros_generos");
  const syncOtros = () => {
    const principal = $("#genero_principal").value;
    const boxes = $$("input", otros);
    boxes.forEach((b) => { if (b.value === principal && b.value !== "Otro") b.checked = false; });
    const count = boxes.filter((b) => b.checked).length;
    boxes.forEach((b) => (b.disabled = (b.value === principal && b.value !== "Otro") || (!b.checked && count >= 4)));
  };
  otros.addEventListener("change", syncOtros);
  $("#genero_principal").addEventListener("change", syncOtros);

  /* ---------- Pasos ---------- */
  const steps = $$(".reg-step", form);
  const stepList = $("#reg-steps");
  const btnBack = $("#btn-back");
  const btnNext = $("#btn-next");
  const submitWrap = $("#submit-wrap");
  const bar = $("#progress-bar");
  let current = 0;
  let maxReached = 0;

  stepList.innerHTML = steps
    .map((s, i) => `<li><button type="button" data-go="${i}"><span class="n">${i + 1}</span><span class="label">${s.dataset.title}</span></button></li>`)
    .join("");

  const renderNav = () => {
    $$("li", stepList).forEach((li, i) => {
      li.classList.toggle("current", i === current);
      li.classList.toggle("done", i < current || (i <= maxReached && i !== current));
      $("button", li).disabled = !TEST_MODE && i > maxReached;
    });
    bar.style.width = `${((current + 1) / steps.length) * 100}%`;
    btnBack.hidden = current === 0;
    const last = current === steps.length - 1;
    btnNext.hidden = last;
    submitWrap.hidden = !last;
  };

  const goTo = (i) => {
    steps[current].hidden = true;
    current = i;
    maxReached = Math.max(maxReached, i);
    const s = steps[current];
    s.hidden = false;
    s.classList.remove("enter");
    void s.offsetWidth;
    s.classList.add("enter");
    renderNav();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  stepList.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b || b.disabled) return;
    const target = Number(b.dataset.go);
    if (target > current && !validateStep(current)) return;
    goTo(target);
  });
  btnBack.addEventListener("click", () => goTo(current - 1));
  btnNext.addEventListener("click", () => { if (validateStep(current)) goTo(current + 1); });

  /* ---------- Lógica condicional ---------- */
  const radioVal = (name) => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ""; };

  const identidad = () => {
    const t = radioVal("tipo");
    if (t === "solista" || t === "dj") return "individual";
    if (t === "agrupacion" || t === "duo" || t === "orquesta") return "colectivo";
    if (t === "otro") return radioVal("otro_composicion");
    return "";
  };

  const state = () => ({
    tipo: radioVal("tipo"),
    otro_composicion: radioVal("otro_composicion"),
    quien_registra: radioVal("quien_registra"),
    identidad: identidad(),
    // Se suministran datos de otras personas: integrantes, o un tercero registra al artista
    terceros: identidad() === "colectivo" || (radioVal("quien_registra") && radioVal("quien_registra") !== "artista") ? "si" : "",
    otro_genero: form.querySelector('input[name="otros_generos"][value="Otro"]:checked') ? "si" : "",
  });

  const applyConditions = () => {
    const st = state();
    $$(".cond", form).forEach((el) => {
      const rule = el.dataset.showIf;
      const neg = rule.includes("!=");
      const [k, v] = rule.split(neg ? "!=" : "=");
      const val = st[k];
      const show = neg ? val !== "" && val !== v : val === v;
      el.hidden = !show;
      $$("input, select, textarea", el).forEach((f) => (f.disabled = !show));
      if (el.matches("input, select, textarea")) el.disabled = !show;
    });

    // Textos que cambian según el tipo
    const labels = {
      solista: ["¿Cuál es tu nombre artístico?", "Identidad del artista"],
      agrupacion: ["¿Cuál es el nombre de la agrupación?", "Miembros oficiales"],
      duo: ["¿Cuál es el nombre del dúo?", "Miembros oficiales"],
      orquesta: ["¿Cuál es el nombre de la orquesta?", "Miembros oficiales"],
      dj: ["¿Cuál es tu nombre artístico como DJ?", "Identidad del DJ"],
      otro: ["¿Cuál es el nombre del proyecto?", st.identidad === "colectivo" ? "Miembros oficiales" : "Identidad del titular"],
    };
    const l = labels[st.tipo] || ["¿Cuál es el nombre artístico del proyecto?", "Identidad personal"];
    $("#nombre_label").textContent = l[0];
    $("#identidad_title").textContent = l[1];

    // Una agrupación necesita al menos dos integrantes
    if (st.identidad === "colectivo" && members.children.length === 0) { addMember(); addMember(); }
    // El bloque condicional habilita todo lo que contiene; el campo "otro rol" depende de cada integrante
    $$(".member", members).forEach(syncRol);
  };

  /* ---------- Integrantes ---------- */
  const members = $("#members");
  const tpl = $("#member-tpl");
  const liderSel = $("#lider");
  const MIN_MEMBERS = 2;
  let memberSeq = 0;

  // "Otro" rol pide especificar cuál
  function syncRol(m) {
    const otro = $("[data-rol-otro]", m);
    const show = $('[data-name="rol"]', m).value === "otro";
    otro.hidden = !show;
    $("input", otro).disabled = !show;
  }

  // El líder se elige entre los integrantes registrados
  const syncLider = () => {
    const prev = liderSel.value;
    const items = $$(".member", members);
    liderSel.innerHTML = `<option value="">Selecciona un integrante</option>` + items.map((m, i) => {
      const nombre = $('[data-name="nombre"]', m).value.trim();
      return `<option value="${m.dataset.uid}">${esc(nombre || `Integrante ${i + 1}`)}</option>`;
    }).join("");
    liderSel.value = items.some((m) => m.dataset.uid === prev) ? prev : "";
  };

  const renumber = () => {
    $$(".member", members).forEach((m, i) => {
      $("[data-idx]", m).textContent = i + 1;
      $$("[data-name]", m).forEach((f) => {
        f.name = `miembros[${i}][${f.dataset.name}]`;
        if (f.type !== "radio") {
          f.id = `m${i}_${f.dataset.name}`;
          const lab = f.closest(".field").querySelector("label");
          if (lab) lab.htmlFor = f.id;
        }
      });
      $("[data-remove]", m).hidden = members.children.length <= MIN_MEMBERS;
    });
    syncLider();
  };

  function addMember() {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.uid = String(++memberSeq);
    fillDocs(node);
    members.appendChild(node);
    renumber();
    enhanceDropdowns(node);
    return node;
  }

  $("#add-member").addEventListener("click", () => {
    const m = addMember();
    $("input", m).focus();
  });
  members.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    b.closest(".member").remove();
    renumber();
  });
  members.addEventListener("input", (e) => { if (e.target.dataset.name === "nombre") syncLider(); });
  members.addEventListener("change", (e) => { if (e.target.dataset.name === "rol") syncRol(e.target.closest(".member")); });

  /* ---------- Otros enlaces y redes (opcionales) ---------- */
  const renumberLinks = (box) =>
    $$(".link-row", box).forEach((row, i) =>
      $$("[data-name]", row).forEach((f) => (f.name = `${box.dataset.prefix}[${i}][${f.dataset.name}]`)));

  const addLink = (box) => {
    const musica = box.dataset.kind === "musica";
    box.insertAdjacentHTML("beforeend", `<div class="link-row">
      <select data-name="plataforma" aria-label="${musica ? "Plataforma musical" : "Red social"}">${optionsHtml(PLATAFORMAS[box.dataset.kind])}</select>
      <input type="${musica ? "url" : "text"}" data-name="url" aria-label="${musica ? "Enlace" : "Usuario o enlace"}" placeholder="${musica ? "https://" : "@usuario o enlace"}">
      <button type="button" class="btn-remove" data-remove-link>Quitar</button>
    </div>`);
    renumberLinks(box);
    enhanceDropdowns(box.lastElementChild);
    $(".link-row:last-child input", box).focus();
  };

  form.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add-link]");
    if (add) addLink($(`#${add.dataset.addLink}`));
    const rm = e.target.closest("[data-remove-link]");
    if (rm) {
      const box = rm.closest(".link-rows");
      rm.closest(".link-row").remove();
      renumberLinks(box);
    }
  });

  form.addEventListener("change", (e) => {
    if (["tipo", "otro_composicion", "quien_registra", "otros_generos"].includes(e.target.name)) applyConditions();
  });

  /* ---------- Fotografía ---------- */
  const foto = $("#foto");
  const drop = $("#photo-drop");
  const preview = $("#photo-preview");
  const photoErr = $("#photo-err");
  const MAX_MB = 5;

  const photoProblem = () => {
    const f = foto.files[0];
    if (!f) return "Sube la fotografía oficial del proyecto.";
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return "El archivo debe ser JPG, PNG o WEBP.";
    if (f.size > MAX_MB * 1024 * 1024) return `La imagen supera ${MAX_MB} MB.`;
    return "";
  };

  foto.addEventListener("change", () => {
    const f = foto.files[0];
    const problem = photoProblem();
    drop.closest(".field").classList.toggle("invalid", !!problem && !!f);
    photoErr.textContent = problem || photoErr.textContent;
    if (!f || problem) return;
    $("#photo-name").textContent = f.name;
    const reader = new FileReader();
    reader.onload = () => {
      preview.style.backgroundImage = `url("${reader.result}")`;
      preview.classList.add("has-img");
    };
    reader.readAsDataURL(f);
  });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
  drop.addEventListener("drop", (e) => {
    if (!e.dataTransfer.files.length) return;
    foto.files = e.dataTransfer.files;
    foto.dispatchEvent(new Event("change"));
  });

  /* ---------- Validación ---------- */
  function validateStep(i) {
    if (TEST_MODE) return true;
    const step = steps[i];
    let firstBad = null;
    const mark = (el, bad) => { if (bad && !firstBad) firstBad = el; };

    // Grupos de opciones obligatorios
    $$("[data-required-group]", step).forEach((g) => {
      if (g.closest("[hidden]")) return;
      const ok = !!radioVal(g.dataset.requiredGroup);
      g.classList.toggle("invalid", !ok);
      mark(g, !ok);
    });

    // Campos de texto, selects y radios de integrantes
    $$("input, select, textarea", step).forEach((f) => {
      if (f.disabled || f.closest("[hidden]") || f.type === "checkbox" || f.type === "file") return;
      if (f.type === "radio") return;
      const bad = !f.checkValidity() || (f.required && !f.value.trim());
      const field = f.closest(".field");
      if (field) field.classList.toggle("invalid", bad);
      mark(f, bad);
    });

    // Foto
    if (step.contains(foto)) {
      const problem = photoProblem();
      if (problem) photoErr.textContent = problem;
      drop.closest(".field").classList.toggle("invalid", !!problem);
      mark(drop, !!problem);
    }

    // Autorizaciones
    const checks = $$(".check", step).filter((c) => !c.hidden);
    if (checks.length) {
      let anyBad = false;
      checks.forEach((c) => {
        const bad = !$("input", c).checked;
        c.classList.toggle("invalid", bad);
        anyBad = anyBad || bad;
        mark(c, bad);
      });
      $("#checks-err").style.display = anyBad ? "block" : "none";
    }

    if (firstBad) {
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = firstBad.matches("input, select, textarea") ? firstBad : $("input, select, textarea", firstBad);
      if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 350);
      return false;
    }
    return true;
  }

  // Quitar el estado de error mientras la persona corrige
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field && e.target.checkValidity()) field.classList.remove("invalid");
  });
  form.addEventListener("change", (e) => {
    const g = e.target.closest("[data-required-group]");
    if (g) g.classList.remove("invalid");
    const c = e.target.closest(".check");
    if (c && e.target.checked) c.classList.remove("invalid");
  });

  /* ---------- Envío ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(current)) return;

    const btn = $("#btn-submit");
    btn.classList.add("is-loading");
    btn.disabled = true;

    // Las filas de enlaces vacías no se envían
    const vacias = $$(".link-row", form).filter((r) => !$("input", r).value.trim());
    vacias.forEach((r) => $$("select, input", r).forEach((f) => (f.disabled = true)));
    const data = new FormData(form);
    vacias.forEach((r) => $$("select, input", r).forEach((f) => (f.disabled = false)));
    data.set("identidad", identidad());
    if (identidad() === "colectivo") {
      // Se envía la posición del líder dentro de miembros[]
      data.set("lider", $$(".member", members).findIndex((m) => m.dataset.uid === liderSel.value));
    }
    let ref;

    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, { method: "POST", body: data });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => ({}));
        ref = json.id || json.referencia;
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }
    } catch (err) {
      btn.classList.remove("is-loading");
      btn.disabled = false;
      alert("No pudimos enviar tu registro. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }

    ref = ref || `MR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    $("#confirm-name").innerHTML = esc(data.get("nombre_proyecto"));
    $("#confirm-code").textContent = ref;
    // TODO: apuntar a la página de perfil cuando exista (p. ej. perfil.html?ref=...)
    $("#btn-profile").dataset.ref = ref;

    form.hidden = true;
    $(".reg-layout").classList.add("is-done");
    bar.style.width = "100%";
    const confirm = $("#confirm");
    confirm.hidden = false;
    confirm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- Inicio ---------- */
  applyConditions();
  enhanceDropdowns(form);
  renderNav();
})();
