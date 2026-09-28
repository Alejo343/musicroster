/* Billboard MusicRoster — páginas para quienes contratan
   Despacha según <body data-page="contratar|buscar|artista|solicitud">. Los datos se leen solo a través de window.Directorio. */
(function () {
  "use strict";

  const D = window.Directorio;
  if (!D) return;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const params = new URLSearchParams(location.search);
  const enhance = (root) => { if (window.Dropdown) window.Dropdown.enhance(root); };
  // dropdown.js no muestra opciones con value="": "todos" necesita un valor propio
  const TODOS = "*";

  const ICON = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    plus: '<svg class="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg class="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.3-1.9-1-1 .8a4 4 0 01-2.3-2.3l.8-1-1-1.9z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
  };

  /* ---------- Piezas comunes ---------- */
  const VACIAS = /^(los|las|la|el|del|de|y|&|dj|dúo|duo|orquesta|grupo|banda|combo|conjunto|colectivo|gran)$/i;
  function iniciales(nombre) {
    const palabras = nombre.split(/\s+/);
    const utiles = palabras.filter((w) => !VACIAS.test(w));
    return (utiles.length ? utiles : palabras).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  // "Cali, Valle del Cauca" · el país solo si no es Colombia · sin repetir "Bogotá D.C."
  function lugar(t) {
    const partes = [t.ciudad];
    if (t.region && norm(t.region) !== norm(t.ciudad)) partes.push(t.region);
    if (t.pais && t.pais !== "Colombia") partes.push(t.pais);
    return partes.filter(Boolean).join(", ");
  }

  /* Portada tipográfica (hasta que haya fotografía): color del género, iniciales y un punto por integrante */
  function cover(p, extra = "") {
    const n = Math.min(p.individual ? 1 : p.integrantes.length, 12);
    const s = n === 1 ? 34 : n === 2 ? 24 : n <= 5 ? 15 : 10;
    const glyph = p.tipo === "dj"
      ? '<span class="cover-glyph is-dj"></span>'
      : `<span class="cover-glyph" style="--s:${s}px">${"<i></i>".repeat(n)}</span>`;
    return `<div class="cover ${extra}" style="--a: var(${p.acento})">
      <span class="cover-genre">${esc(p.genero)}</span>${glyph}
      <span class="cover-ini">${esc(iniciales(p.nombre))}</span>
    </div>`;
  }

  function saveBtn(p) {
    const on = D.seleccion.has(p.id);
    return `<button class="pcard-save${on ? " is-on" : ""}" type="button" data-save="${esc(p.id)}" data-nombre="${esc(p.nombre)}"
      aria-pressed="${on}" aria-label="${on ? "Quitar de" : "Agregar a"} tu lista: ${esc(p.nombre)}">${ICON.plus}${ICON.check}</button>`;
  }

  // link: false → versión decorativa sin enlaces ni botones
  function card(p, link = true) {
    const inner = `${cover(p)}
      <div class="pcard-body">
        <p class="pcard-meta">${esc(p.tipoLabel)} · ${esc(p.genero)}</p>
        <h3>${esc(p.nombre)}</h3>
        <p class="pcard-place">${ICON.pin}<span>${esc(lugar(p.residencia))}</span></p>
        <p class="pcard-rango"><span>Rango</span>${esc(p.rangoLabel)}</p>
      </div>`;
    return link
      ? `<article class="pcard"><a class="pcard-link" href="artista.html?id=${encodeURIComponent(p.id)}">${inner}</a>${saveBtn(p)}</article>`
      : `<div class="pcard"><div class="pcard-link">${inner}</div></div>`;
  }

  /* ---------- Lista del comprador ---------- */
  function syncSave() {
    $$("[data-save]").forEach((b) => {
      const on = D.seleccion.has(b.dataset.save);
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
      const label = $("[data-save-label]", b);
      if (label) label.textContent = on ? "En tu lista" : "Agregar a mi lista";
      else b.setAttribute("aria-label", `${on ? "Quitar de" : "Agregar a"} tu lista: ${b.dataset.nombre}`);
    });
    selBar();
  }

  function selBar() {
    const bar = $("#sel-bar");
    if (!bar) return;
    const ids = D.seleccion.ids();
    bar.hidden = !ids.length;
    document.body.classList.toggle("has-sel-bar", ids.length > 0);
    $("#sel-n").textContent = ids.length;
    $("#sel-txt").textContent = ids.length === 1 ? "proyecto en tu lista" : "proyectos en tu lista";
    $("#sel-faces").innerHTML = ids.slice(-4).map((id) => {
      const p = D.get(id);
      return `<span style="--a: var(${p.acento})">${esc(iniciales(p.nombre))}</span>`;
    }).join("");
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-save]");
    if (!b) return;
    e.preventDefault();
    D.seleccion.toggle(b.dataset.save);
  });
  document.addEventListener("seleccion:cambio", syncSave);

  /* =========================================================
     BUSCAR
     ========================================================= */
  function pageBuscar() {
    const form = $("#filtros");
    const cuenta = D.sesion.actual();
    $("#dir-cuenta").innerHTML = `<span class="dir-cuenta-av" aria-hidden="true">${esc(iniciales(cuenta.nombre || cuenta.email))}</span>
      <span>${esc((cuenta.nombre || "").split(" ")[0] || cuenta.email)}</span>
      <button type="button" id="salir">Cerrar sesión</button>`;
    $("#salir").addEventListener("click", () => { D.sesion.cerrar(); location.href = "contratar.html"; });
    const POR_PAGINA = 24;
    let visibles = POR_PAGINA;

    const acentoDe = (g) => (D.perfiles().find((p) => p.genero === g) || {}).acento || "--g-regional";
    const tipos = Object.fromEntries(D.conteo((p) => p.tipo));
    $("#f-tipos").innerHTML = Object.entries(D.TIPOS).filter(([k]) => tipos[k]).map(([k, l]) =>
      `<label><input type="checkbox" name="tipo" value="${k}"><span>${esc(l)} <small>${tipos[k]}</small></span></label>`).join("");
    $("#f-genero").innerHTML = `<option value="${TODOS}">Todos los géneros</option>` +
      D.generos().map(([g, n]) => `<option value="${esc(g)}">${esc(g)} · ${n}</option>`).join("");
    $("#f-presupuesto").innerHTML = `<option value="${TODOS}">Cualquier presupuesto</option>` +
      D.PRESUPUESTOS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    $("#dir-quick").innerHTML = D.generos().slice(0, 8).map(([g, n]) =>
      `<li><a href="buscar.html?genero=${encodeURIComponent(g)}" data-genero="${esc(g)}" style="--c: var(${acentoDe(g)})">${esc(g)} <small>${n}</small></a></li>`).join("");

    const state = {
      q: params.get("q") || "",
      tipos: (params.get("tipo") || "").split(",").filter((t) => D.TIPOS[t]),
      genero: params.get("genero") || "",
      territorio: params.get("territorio") === "origen" ? "origen" : "residencia",
      region: params.get("region") || "",
      presupuesto: params.get("presupuesto") || "",
      segunEvento: params.get("segun") !== "0",
      orden: params.get("orden") || "relevancia",
    };

    // Cambia el valor sin disparar el filtro (el evento no burbujea) y actualiza el desplegable
    const sync = (sel, v) => {
      sel.value = v || TODOS;
      if (sel.selectedIndex < 0) sel.selectedIndex = 0;
      sel.dispatchEvent(new Event("change"));
    };
    const val = (sel) => (sel.value === TODOS ? "" : sel.value);

    function fillRegiones() {
      const sel = $("#f-region");
      sel.innerHTML = `<option value="${TODOS}">Todo el territorio</option>` +
        D.conteo((p) => p[state.territorio].region).map(([r, n]) => `<option value="${esc(r)}">${esc(r)} · ${n}</option>`).join("");
      sync(sel, state.region);
      state.region = val(sel);
    }

    function toForm() {
      $("#q").value = state.q;
      $$("[name=tipo]", form).forEach((c) => (c.checked = state.tipos.includes(c.value)));
      form.territorio.value = state.territorio;
      form.segunEvento.checked = state.segunEvento;
      fillRegiones();
      sync($("#f-genero"), state.genero);
      sync($("#f-presupuesto"), state.presupuesto);
      sync($("#orden"), state.orden);
      // Valores de la URL que no existen en el directorio se descartan
      state.genero = val($("#f-genero"));
      state.presupuesto = val($("#f-presupuesto"));
      state.orden = $("#orden").value;
    }

    function fromForm() {
      state.tipos = $$("[name=tipo]:checked", form).map((c) => c.value);
      state.genero = val($("#f-genero"));
      state.region = val($("#f-region"));
      state.presupuesto = val($("#f-presupuesto"));
      state.segunEvento = form.segunEvento.checked;
    }

    function activos() {
      const a = [];
      state.tipos.forEach((t) => a.push([D.TIPOS[t], () => (state.tipos = state.tipos.filter((x) => x !== t))]));
      if (state.genero) a.push([state.genero, () => (state.genero = "")]);
      if (state.region) a.push([`${state.territorio === "origen" ? "De" : "En"} ${state.region}`, () => (state.region = "")]);
      if (state.presupuesto) a.push([D.PRESUPUESTOS.find((x) => x[0] === state.presupuesto)[1], () => (state.presupuesto = "")]);
      return a;
    }

    function url() {
      const u = new URLSearchParams();
      if (state.q) u.set("q", state.q);
      if (state.tipos.length) u.set("tipo", state.tipos.join(","));
      if (state.genero) u.set("genero", state.genero);
      if (state.region) {
        u.set("region", state.region);
        if (state.territorio === "origen") u.set("territorio", "origen");
      }
      if (state.presupuesto) {
        u.set("presupuesto", state.presupuesto);
        if (!state.segunEvento) u.set("segun", "0");
      }
      if (state.orden !== "relevancia") u.set("orden", state.orden);
      const qs = u.toString();
      history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    }

    function render(desdeCero = true) {
      if (desdeCero) visibles = POR_PAGINA;
      const res = D.buscar(state);
      $("#dir-count").innerHTML = `<b>${res.length}</b> ${res.length === 1 ? "proyecto" : "proyectos"}${state.q ? ` para “${esc(state.q)}”` : ""}`;
      $("#resultados").innerHTML = res.slice(0, visibles).map((p) => card(p)).join("");
      $("#dir-empty").hidden = res.length > 0;
      const resto = res.length - visibles;
      $("#ver-mas").hidden = resto <= 0;
      $("#ver-mas").textContent = `Ver más proyectos (${resto})`;

      const a = activos();
      $("#dir-active").innerHTML = a.map(([l], i) =>
        `<li><button type="button" data-quitar="${i}" aria-label="Quitar filtro: ${esc(l)}">${esc(l)}<span aria-hidden="true">×</span></button></li>`).join("");
      $("#n-filtros").textContent = a.length || "";
      $("#filtros-listo").textContent = res.length ? `Ver ${plural(res.length, "proyecto", "proyectos")}` : "Sin resultados";
      $$("#dir-quick a").forEach((x) => x.classList.toggle("is-on", x.dataset.genero === state.genero));
      url();
    }

    form.addEventListener("change", (e) => {
      if (e.target.name === "territorio") {
        state.territorio = e.target.value;
        fillRegiones();
      }
      fromForm();
      render();
    });
    $("#orden").addEventListener("change", (e) => {
      if (!e.isTrusted && !e.bubbles) return;
      state.orden = e.target.value;
      render(false);
    });
    $("#dir-search").addEventListener("submit", (e) => {
      e.preventDefault();
      state.q = $("#q").value.trim();
      render();
      $("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    let t = 0;
    $("#q").addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = $("#q").value.trim(); render(); }, 220);
    });

    $("#dir-active").addEventListener("click", (e) => {
      const b = e.target.closest("[data-quitar]");
      if (!b) return;
      activos()[b.dataset.quitar][1]();
      toForm();
      render();
    });
    const limpiar = () => {
      Object.assign(state, { q: "", tipos: [], genero: "", region: "", presupuesto: "", segunEvento: true });
      toForm();
      render();
    };
    $("#limpiar").addEventListener("click", limpiar);
    $$("[data-limpiar]").forEach((b) => b.addEventListener("click", limpiar));
    $("#ver-mas").addEventListener("click", () => { visibles += POR_PAGINA; render(false); });

    $("#dir-quick").addEventListener("click", (e) => {
      const a = e.target.closest("[data-genero]");
      if (!a) return;
      e.preventDefault();
      state.genero = state.genero === a.dataset.genero ? "" : a.dataset.genero;
      toForm();
      render();
    });

    // Filtros en móvil: panel a pantalla completa
    const toggle = $(".dir-filters-toggle");
    const panel = (open) => {
      $("#dir-filters").classList.toggle("is-open", open);
      document.body.classList.toggle("filters-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (!open) toggle.focus({ preventScroll: true });
    };
    toggle.addEventListener("click", () => panel(!$("#dir-filters").classList.contains("is-open")));
    $("#filtros-listo").addEventListener("click", () => {
      panel(false);
      $(".dir-results").scrollIntoView({ block: "start" });
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && $("#dir-filters").classList.contains("is-open") && panel(false));

    enhance(form);
    enhance($(".dir-sort"));
    toForm();
    render();
    selBar();
  }

  /* =========================================================
     PERFIL DEL ARTISTA
     ========================================================= */
  const ESCALA = ["< 2", "2–5", "5–10", "10–20", "20–50", "50–100", "100+"];

  // Redes guardadas como @usuario → URL de la plataforma
  function href(url, plataforma) {
    if (/^https?:\/\//.test(url)) return url;
    const u = url.replace(/^@/, "");
    return {
      instagram: `https://www.instagram.com/${u}`, tiktok: `https://www.tiktok.com/@${u}`,
      youtube: `https://www.youtube.com/@${u}`, facebook: `https://www.facebook.com/${u}`,
    }[plataforma] || "#";
  }
  const corta = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  function enlaces(lista) {
    return lista.map((l) => {
      const nombre = D.PLATAFORMAS[l.plataforma] || l.plataforma;
      return `<a class="pf-link" href="${esc(href(l.url, l.plataforma))}" target="_blank" rel="noopener">
        <span class="pf-link-ico" aria-hidden="true">${esc(nombre[0])}</span>
        <span class="pf-link-txt"><b>${esc(nombre)}</b><small>${esc(corta(l.url))}</small></span>${ICON.out}</a>`;
    }).join("");
  }

  function pageArtista() {
    const main = $("#perfil");
    const p = D.get(params.get("id") || "");
    if (!p) {
      main.innerHTML = `<section class="page-hero"><div class="wrap">
        <p class="kicker">Directorio</p>
        <h1 class="display">Perfil no disponible</h1>
        <p>Este proyecto no existe, todavía está en revisión o ya no está publicado.</p>
        <div class="hero-ctas"><a class="btn btn-cta btn-lg" href="buscar.html">Ir al directorio ${ICON.arrow}</a></div>
      </div></section>`;
      return;
    }
    document.title = `${p.nombre} — Billboard MusicRoster`;

    const desdeBusqueda = /buscar\.html/.test(document.referrer);
    const origen = lugar(p.origen);
    const origenDistinto = origen && origen !== lugar(p.residencia);
    const generos = [p.genero].concat(p.otrosGeneros.filter((g) => g !== p.genero));
    const digitos = p.contacto.whatsapp.replace(/\D/g, "");
    const saludo = `Hola, vi el perfil de ${p.nombre} en Billboard MusicRoster y quiero consultar por una presentación.`;
    const segun = p.rango === "segun_evento";

    const personas = p.individual
      ? `<li><span class="pf-av" style="--a: var(${p.acento})">${esc(iniciales(p.titular))}</span>
           <span><b>${esc(p.titular)}</b><small>${p.tipo === "dj" ? "DJ" : "Artista solista"}</small></span></li>`
      : p.integrantes.map((m) => `<li><span class="pf-av" style="--a: var(${p.acento})">${esc(iniciales(m.nombre))}</span>
           <span><b>${esc(m.nombre)}</b><small>${esc(m.rol)}</small></span>
           ${m.lider ? `<em class="pf-badge">${/director/i.test(m.rol) ? "Director" : "Líder"}</em>` : ""}</li>`).join("");

    main.innerHTML = `
      <section class="pf-hero" style="--a: var(${p.acento})">
        <div class="wrap">
          <a class="pf-back" href="${desdeBusqueda ? esc(document.referrer) : "buscar.html"}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
            ${desdeBusqueda ? "Volver a los resultados" : "Ir al directorio"}
          </a>
          <div class="pf-hero-grid">
            ${cover(p, "cover-lg")}
            <div class="pf-head">
              <p class="kicker">${esc(p.tipoLabel)}${p.integrantes.length ? ` · ${plural(p.integrantes.length, "integrante", "integrantes")}` : ""}</p>
              <h1 class="display pf-name">${esc(p.nombre)}</h1>
              <ul class="pf-genres">${generos.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
              <p class="pf-place">${ICON.pin}<span>Vive en <b>${esc(lugar(p.residencia))}</b>${origenDistinto ? ` · Origen <b>${esc(origen)}</b>` : ""}</span></p>
              <div class="pf-actions">
                <a class="btn btn-cta btn-lg" href="solicitud.html?id=${encodeURIComponent(p.id)}">Solicitar contratación ${ICON.arrow}</a>
                <button class="btn btn-ghost btn-lg pf-save${D.seleccion.has(p.id) ? " is-on" : ""}" type="button" data-save="${esc(p.id)}" aria-pressed="${D.seleccion.has(p.id)}">
                  ${ICON.plus}${ICON.check}<span data-save-label>${D.seleccion.has(p.id) ? "En tu lista" : "Agregar a mi lista"}</span>
                </button>
                <button class="pf-share" type="button" id="pf-share">${ICON.link}<span>Copiar enlace</span></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="pf-body on-paper">
        <div class="wrap pf-grid">
          <div class="pf-main">
            <section class="pf-sec">
              <h2>${p.individual ? "Escúchalo" : "Escúchalos"}</h2>
              <div class="pf-links">${enlaces(p.musica)}</div>
              ${p.redes.length ? `<h3 class="pf-sub">Redes</h3><div class="pf-links">${enlaces(p.redes)}</div>` : ""}
            </section>

            <section class="pf-sec">
              <h2>${p.individual ? "El artista" : "Integrantes"}</h2>
              <ul class="pf-people">${personas}</ul>
            </section>

            <section class="pf-sec">
              <h2>Territorio</h2>
              <dl class="pf-dl">
                <div><dt>Vive en</dt><dd>${esc(lugar(p.residencia))}</dd></div>
                <div><dt>Origen del proyecto</dt><dd>${esc(origen || "—")}</dd></div>
                <div><dt>Nacionalidad</dt><dd>${esc(p.nacionalidad)}</dd></div>
              </dl>
              <a class="pf-more-link" href="buscar.html?region=${encodeURIComponent(p.residencia.region)}">Más proyectos en ${esc(p.residencia.region)} ${ICON.arrow}</a>
            </section>
          </div>

          <aside class="pf-side">
            <div class="pf-card">
              <p class="pf-card-k">Rango de contratación</p>
              <p class="pf-rango">${esc(segun ? "Cotiza según el evento" : p.rangoLabel)}</p>
              <ol class="pf-scale${segun ? " is-off" : ""}" aria-hidden="true">
                ${ESCALA.map((l, i) => `<li class="${i === p.rangoIndex ? "on" : ""}"><i></i><span>${l}</span></li>`).join("")}
              </ol>
              <p class="pf-card-note">Por presentación en vivo, en millones de pesos colombianos. Es orientativo: el valor final depende de la fecha, la ciudad, la duración, el formato y la logística.</p>
            </div>

            <div class="pf-card">
              <p class="pf-card-k">Contacto para contratación</p>
              <p class="pf-contact-name">${esc(p.contacto.nombre)}</p>
              <a class="pf-cbtn" href="https://wa.me/${digitos}?text=${encodeURIComponent(saludo)}" target="_blank" rel="noopener">
                ${ICON.wa}<span><small>WhatsApp</small>${esc(p.contacto.whatsapp)}</span></a>
              <a class="pf-cbtn" href="mailto:${esc(p.contacto.email)}?subject=${encodeURIComponent(`Contratación de ${p.nombre} (vía MusicRoster)`)}">
                ${ICON.mail}<span><small>Correo</small>${esc(p.contacto.email)}</span></a>
              <p class="pf-card-note">Usa estos datos solo para oportunidades de contratación. No se permiten envíos masivos ni publicidad (<a href="reglamento.html#art-45">Reglamento, Art. 45</a>).</p>
            </div>

            <p class="pf-ref">Registro <b>${esc(p.id)}</b><br>Publicado tras revisión administrativa de MusicRoster</p>
          </aside>
        </div>

        <div class="wrap pf-similar" id="pf-similar"></div>
      </section>`;

    const sim = D.similares(p.id, 4);
    if (sim.length) {
      $("#pf-similar").innerHTML = `<h2 class="display">También te puede interesar</h2><div class="pgrid">${sim.map((x) => card(x)).join("")}</div>`;
    }

    $("#pf-share").addEventListener("click", async (e) => {
      const label = $("span", e.currentTarget);
      try {
        await navigator.clipboard.writeText(location.href);
        label.textContent = "Enlace copiado";
      } catch (err) {
        label.textContent = "Copia la dirección del navegador";
      }
      setTimeout(() => (label.textContent = "Copiar enlace"), 2400);
    });
    selBar();
  }

  /* =========================================================
     SOLICITUD DE CONTRATACIÓN
     ========================================================= */
  const TIPOS_EVENTO = [
    ["festival", "Festival o concierto", "Programación abierta al público"],
    ["corporativo", "Evento corporativo", "Lanzamientos, convenciones, fiestas de empresa"],
    ["social", "Evento social", "Bodas, cumpleaños y celebraciones privadas"],
    ["publico", "Programación pública", "Agenda cultural, ferias y fiestas"],
    ["venue", "Bar, club o venue", "Fechas en sala o temporadas"],
    ["otro", "Otro", "Cuéntanos en los detalles"],
  ];

  function pageSolicitud() {
    const form = $("#sol-form");
    const id = params.get("id");
    if (id && D.get(id)) D.seleccion.add(id);

    $("#tipos-evento").innerHTML = TIPOS_EVENTO.map(([v, l, d]) =>
      `<label class="choice"><input type="radio" name="tipo_evento" value="${v}"><span class="card"><strong>${l}</strong><small>${d}</small></span></label>`).join("");
    $("#presupuesto").innerHTML = `<option value="por_definir">Aún no lo sé</option>` +
      D.RANGOS.filter(([v]) => v !== "segun_evento").map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    $("#fecha").min = new Date().toISOString().slice(0, 10);

    function picks() {
      const ids = D.seleccion.ids();
      $("#sol-n").textContent = ids.length || "";
      $("#sol-picks").innerHTML = ids.length
        ? ids.map((x) => {
            const p = D.get(x);
            return `<li style="--a: var(${p.acento})">
              <span class="sol-pick-ini" aria-hidden="true">${esc(iniciales(p.nombre))}</span>
              <span class="sol-pick-txt"><a href="artista.html?id=${encodeURIComponent(p.id)}">${esc(p.nombre)}</a><small>${esc(p.genero)} · ${esc(p.rangoLabel)}</small></span>
              <button type="button" class="sol-pick-x" data-quitar="${esc(p.id)}" aria-label="Quitar ${esc(p.nombre)}">×</button>
            </li>`;
          }).join("")
        : `<li class="sol-picks-empty">Tu lista está vacía. Puedes enviarla así y te sugerimos proyectos.</li>`;
      $("#sol-resumen").innerHTML = ids.length
        ? `Llegará a <b>${plural(ids.length, "proyecto", "proyectos")}</b>`
        : `La recibe el equipo de <b>MusicRoster</b>`;
    }
    $("#sol-picks").addEventListener("click", (e) => {
      const b = e.target.closest("[data-quitar]");
      if (b) D.seleccion.remove(b.dataset.quitar);
    });
    document.addEventListener("seleccion:cambio", picks);

    /* Validación */
    let intentado = false;
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    function validar(enfocar) {
      let primero = null;
      const marcar = (el, mal) => {
        const box = el.closest(".check, .field");
        box.classList.toggle("invalid", mal);
        if (mal && !primero) primero = box;
      };
      marcar($("#tipos-evento"), !$("[name=tipo_evento]:checked", form));
      marcar(form.fecha, !form.fecha_flexible.checked && !form.fecha.value);
      ["ciudad", "mensaje", "nombre"].forEach((n) => marcar(form[n], !form[n].value.trim()));
      marcar(form.aforo, !form.aforo.value);
      marcar(form.sector, !form.sector.value);
      marcar(form.email, !emailOk(form.email.value.trim()));
      marcar(form.whatsapp, form.whatsapp.value.replace(/\D/g, "").length < 7);
      ["acepta_datos", "acepta_rango", "acepta_reglamento"].forEach((n) => marcar(form[n], !form[n].checked));
      if (primero && enfocar) {
        primero.scrollIntoView({ behavior: "smooth", block: "center" });
        const campo = $("input:not([type=hidden]), select, textarea", primero);
        if (campo) campo.focus({ preventScroll: true });
      }
      return !primero;
    }
    form.addEventListener("input", () => intentado && validar(false));
    form.addEventListener("change", () => intentado && validar(false));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      intentado = true;
      if (!validar(true)) return;
      const btn = $("#sol-enviar");
      btn.classList.add("is-loading");
      btn.disabled = true;
      const fd = new FormData(form);
      const txt = (k) => String(fd.get(k) || "").trim();
      const datos = {
        proyectos: D.seleccion.ids(),
        evento: {
          tipo: txt("tipo_evento"),
          fecha: fd.get("fecha_flexible") ? "" : txt("fecha"),
          fecha_flexible: !!fd.get("fecha_flexible"),
          ciudad: txt("ciudad"), lugar: txt("lugar"), aforo: txt("aforo"), duracion: txt("duracion"),
          presupuesto: txt("presupuesto"), incluye: fd.getAll("incluye"), mensaje: txt("mensaje"),
        },
        solicitante: {
          nombre: txt("nombre"), sector: txt("sector"), organizacion: txt("organizacion"), cargo: txt("cargo"),
          email: txt("email"), whatsapp: txt("whatsapp"),
        },
        aceptaciones: { datos: true, rango: true, reglamento: true },
      };
      try {
        const { ref } = await D.solicitar(datos);
        confirmar(ref, datos);
        D.seleccion.clear();
      } catch (err) {
        btn.classList.remove("is-loading");
        btn.disabled = false;
        $("#sol-resumen").innerHTML = "<b>No pudimos enviar la solicitud.</b> Revisa tu conexión e inténtalo de nuevo.";
      }
    });

    function confirmar(ref, datos) {
      const ps = datos.proyectos.map(D.get).filter(Boolean);
      form.hidden = true;
      $("#sol-layout").classList.add("is-done");
      const c = $("#sol-confirm");
      c.innerHTML = `
        <div class="confirm-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <p class="step-eyebrow">Solicitud enviada</p>
        <h2>Tu solicitud va en camino</h2>
        <p class="code">Referencia <b>${esc(ref)}</b></p>
        ${ps.length ? `<ul class="sol-sent">${ps.map((p) => `<li style="--a: var(${p.acento})"><span class="sol-pick-ini" aria-hidden="true">${esc(iniciales(p.nombre))}</span>${esc(p.nombre)}</li>`).join("")}</ul>` : ""}
        <p>${ps.length
          ? "La solicitud llega al contacto para contratación de cada proyecto, que te responderá con disponibilidad y condiciones al correo o WhatsApp que indicaste."
          : "El equipo de MusicRoster revisará tu evento y te escribirá con opciones de proyectos."}
          Guarda la referencia para hacerle seguimiento.</p>
        <div class="confirm-ctas">
          <a class="btn btn-cta" href="buscar.html">Seguir buscando</a>
          <a class="btn btn-ghost" href="contratar.html">Cómo funciona</a>
        </div>`;
      c.hidden = false;
      $("#sol-layout").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // La cuenta ya tiene los datos de quien solicita
    const cuenta = D.sesion.actual() || {};
    ["nombre", "email", "whatsapp", "organizacion", "cargo", "sector"].forEach((k) => {
      if (cuenta[k] && !form[k].value) form[k].value = cuenta[k];
    });

    picks();
    enhance(form);
  }

  /* =========================================================
     PARA QUIENES CONTRATAN
     ========================================================= */
  function pageContratar() {
    const todos = D.perfiles();
    if (!todos.length) return;

    // Tres portadas de géneros distintos para el hero
    const vistos = new Set();
    const muestra = todos.filter((p) => !vistos.has(p.acento) && vistos.add(p.acento)).slice(0, 3);
    $("#ct-stack").innerHTML = muestra.map((p) => card(p, false)).join("");

    const stats = [
      [todos.length, "proyectos publicados"],
      [D.generos().length, "géneros"],
      [D.conteo((p) => p.residencia.ciudad).length, "ciudades y municipios"],
      [D.conteo((p) => p.residencia.region).length, "departamentos y regiones"],
    ];
    $("#ct-stats").innerHTML = stats.map(([n, l]) => `<div><dt>${l}</dt><dd>${n}</dd></div>`).join("");

    const ejemplo = todos.find((p) => p.integrantes.length >= 3 && p.otrosGeneros.length) || todos[0];
    $("#ct-sample").innerHTML = `${card(ejemplo)}
      <a class="ct-sample-link" href="artista.html?id=${encodeURIComponent(ejemplo.id)}">Ver un perfil completo ${ICON.arrow}</a>`;

    const porRango = Object.fromEntries(D.conteo((p) => p.rango));
    const max = Math.max(1, ...Object.values(porRango));
    $("#ct-rangos").innerHTML = D.RANGOS.map(([v, l]) => {
      const n = porRango[v] || 0;
      return `<li><span>${esc(l)}</span><i style="--w:${Math.round((n / max) * 100)}%"></i><b>${n}</b></li>`;
    }).join("");

    const acentoDe = (g) => todos.find((p) => p.genero === g).acento;
    $("#ct-generos").innerHTML = D.generos().slice(0, 12).map(([g, n]) =>
      `<li><a href="buscar.html?genero=${encodeURIComponent(g)}" style="--c: var(${acentoDe(g)})">${esc(g)} <small>${n}</small></a></li>`).join("");
  }

  /* =========================================================
     CUENTA DE QUIENES BUSCAN (solo la vista: no hay autenticación todavía)
     ========================================================= */
  /* Página a la que se vuelve después de ingresar: solo páginas propias del sitio */
  const destino = () => {
    const v = params.get("volver") || "";
    return /^[a-z-]+\.html(\?[^#]*)?$/.test(v) ? v : "buscar.html";
  };

  function pageAcceso() {
    const todos = D.perfiles();
    $("#acc-preview").innerHTML = todos.slice(0, 6).map((p) => card(p, false)).join("");
    $("#acc-n").textContent = todos.length;
    $("#listo-ir").href = destino();

    const tabs = { crear: $("#tab-crear"), ingresar: $("#tab-ingresar") };
    function ver(nombre, enfocar) {
      Object.entries(tabs).forEach(([k, t]) => {
        const on = k === nombre;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $(`#panel-${k}`).hidden = !on;
      });
      $("#panel-listo").hidden = true;
      $(".acc-tabs").hidden = false;
      history.replaceState(null, "", location.pathname + location.search + (nombre === "ingresar" ? "#ingresar" : ""));
      if (enfocar) tabs[nombre].focus();
    }

    // Mensaje final: cuenta recién creada o sesión ya abierta
    function listo(titulo, texto, salir) {
      $("#listo-t").textContent = titulo;
      $("#listo-p").innerHTML = texto;
      $("#listo-salir").hidden = !salir;
      $("#panel-crear").hidden = true;
      $("#panel-ingresar").hidden = true;
      $(".acc-tabs").hidden = true;
      $("#panel-listo").hidden = false;
    }

    Object.entries(tabs).forEach(([k, t]) => t.addEventListener("click", () => ver(k)));
    $(".acc-tabs").addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      ver(tabs.crear.getAttribute("aria-selected") === "true" ? "ingresar" : "crear", true);
    });
    $$("[data-tab]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); ver(a.dataset.tab, true); }));
    window.addEventListener("hashchange", () => ver(location.hash === "#ingresar" ? "ingresar" : "crear"));

    const cuenta = D.sesion.actual();
    if (cuenta) {
      listo("Ya ingresaste", `Estás usando la cuenta de <b>${esc(cuenta.nombre || cuenta.email)}</b>.`, true);
    } else {
      ver(location.hash === "#ingresar" ? "ingresar" : "crear");
      if (params.get("volver")) $(".acc-sub", $("#panel-crear")).textContent = "Para ver el directorio necesitas una cuenta. Es gratis y te toma un minuto.";
    }
    $("#listo-salir").addEventListener("click", () => { D.sesion.cerrar(); ver("ingresar", true); });

    $$("[data-ver]").forEach((b) => b.addEventListener("click", () => {
      const input = $(`#${b.dataset.ver}`);
      const mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      b.textContent = mostrar ? "Ocultar" : "Ver";
      b.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
    }));

    // Validación visual con las reglas nativas de cada campo
    function valido(form) {
      let primero = null;
      $$("input[required]", form).forEach((el) => {
        const mal = el.type === "checkbox" ? !el.checked : !el.checkValidity() || !el.value.trim();
        el.closest(".check, .field").classList.toggle("invalid", mal);
        if (mal && !primero) primero = el;
      });
      if (primero) primero.focus();
      return !primero;
    }
    $$(".acc-form").forEach((f) => f.addEventListener("input", (e) => {
      const box = e.target.closest(".invalid");
      if (box && (e.target.type === "checkbox" ? e.target.checked : e.target.checkValidity())) box.classList.remove("invalid");
    }));

    $("#form-crear").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!valido(e.target)) return;
      const f = e.target;
      const val = (n) => f[n].value.trim();
      D.sesion.iniciar({
        nombre: val("nombre"), email: val("email"), whatsapp: val("whatsapp"), sector: f.sector.value,
        organizacion: val("organizacion"), cargo: val("cargo"), pais: val("pais"), ciudad: val("ciudad"),
      });
      listo("Tu cuenta está lista",
        `Ya puedes buscar en todo el directorio. Te enviamos un correo a <b>${esc(val("email"))}</b> para confirmar la cuenta.`, false);
      $("#listo-ir").focus();
    });
    $("#form-ingresar").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!valido(e.target)) return;
      D.sesion.iniciar({ email: e.target.email.value.trim() });
      location.href = destino();
    });
  }

  /* Buscar, perfiles y solicitudes exigen cuenta: sin sesión se va a acceso.html y luego se vuelve aquí */
  const PRIVADAS = ["buscar", "artista", "solicitud"];
  const actual = document.body.dataset.page;
  if (PRIVADAS.includes(actual) && !D.sesion.actual()) {
    const aqui = location.pathname.split("/").pop() + location.search;
    location.replace(`acceso.html?volver=${encodeURIComponent(aqui)}`);
    return;
  }

  const pages = { acceso: pageAcceso, buscar: pageBuscar, artista: pageArtista, solicitud: pageSolicitud, contratar: pageContratar };
  const page = pages[actual];
  if (page) page();
})();
