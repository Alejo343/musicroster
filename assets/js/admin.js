/* Billboard MusicRoster — panel de administración (solo vistas)
   Cada página marca <body data-page="…"> y aquí se pinta con los datos de AdminData (admin-data.js).
   En Next.js: cada page* pasa a ser un componente y AdminData se reemplaza por llamadas a la API. */
(function () {
  "use strict";

  const A = window.AdminData;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAY = 86400000;

  const ICON = {
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17.5h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>',
  };

  /* ---------- Formato ---------- */
  // "24 sept" en el año en curso, "24 sept 2025" en otros años
  const fmtDate = (iso) => {
    const d = new Date(iso);
    const opts = { day: "numeric", month: "short" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString("es-CO", opts).replace(/ de /g, " ");
  };
  const fmtDateTime = (iso) => new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const fmtDay = (d) => d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const ago = (iso) => {
    const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (m < 1) return "ahora";
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? "ayer" : `hace ${d} días`;
  };
  const initials = (s) => s.replace(/^(los|las|la|el|dj|dúo|orquesta|grupo|combo|conjunto|colectivo)\s+/i, "").split(/\s+/)
    .filter((w) => !/^(y|de|del|la|las|los|el|&)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const avatar = (rec, cls = "") => `<span class="avatar ${cls}" style="--c: var(${A.acento(rec.genero_principal)})" aria-hidden="true">${esc(initials(rec.nombre_proyecto))}</span>`;
  const badge = (estado) => `<span class="badge st-${estado}">${A.ESTADOS[estado]}</span>`;
  const lugar = (rec) => `${rec.ciudad_actual}, ${rec.pais_residencia === "Colombia" ? rec.region_residencia : rec.pais_residencia}`;
  const mask = (n) => `•••• ${String(n).slice(-4)}`;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const detailUrl = (id) => `registro.html?id=${encodeURIComponent(id)}`;
  const dupIds = () => new Set(A.openDuplicates().flatMap((g) => g.items.map((x) => x.id)));
  const dupFlag = `<span class="flag" title="Posible duplicado: revisar en Verificación">${ICON.alert}Duplicado</span>`;

  /* ---------- Aviso flotante ---------- */
  let toastTimer = 0;
  function toast(msg) {
    let el = $(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3200);
  }

  /* ---------- Ventanas modales ---------- */
  function modal(html, onReady) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "modal";
      wrap.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
      document.body.appendChild(wrap);
      const prevFocus = document.activeElement;
      const close = (value) => {
        wrap.remove();
        document.removeEventListener("keydown", onKey);
        if (prevFocus) prevFocus.focus();
        resolve(value);
      };
      const onKey = (e) => { if (e.key === "Escape") close(null); };
      document.addEventListener("keydown", onKey);
      wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-cancel]")) close(null); });
      onReady(wrap, close);
      const first = $("textarea, input:not([type=hidden]):not(:disabled), button[data-ok]", wrap);
      if (first) first.focus();
    });
  }

  const MOTIVOS = {
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

  /* Pide confirmación para cambiar el estado; en corrección y rechazo exige un motivo */
  function confirmEstado(estado, n, motivoInicial = "") {
    const conMotivo = estado === "correccion" || estado === "rechazado";
    const txt = {
      aprobado: ["Aprobar y publicar", `El perfil ${n > 1 ? `de ${n} registros quedará` : "quedará"} visible en el buscador con sus datos públicos.`, "btn-ok", "Aprobar y publicar"],
      correccion: ["Pedir corrección", "Se le indicará al contacto qué debe corregir. El perfil no se publica hasta que lo haga.", "btn-dark", "Pedir corrección"],
      rechazado: ["Rechazar", "El registro no se publicará. Indica el motivo: queda en el historial y se le comunica al contacto.", "btn-danger", "Rechazar"],
      pendiente: ["Volver a pendiente", "El registro vuelve a la cola de revisión. Si estaba publicado, deja de verse en el buscador.", "btn-dark", "Volver a pendiente"],
    }[estado];
    return modal(`
      <h2>${txt[0]}${n > 1 ? ` · ${n}` : ""}</h2>
      <p>${txt[1]}</p>
      ${conMotivo ? `
        <div class="presets">${MOTIVOS[estado].map((m) => `<button type="button" data-preset>${esc(m)}</button>`).join("")}</div>
        <div class="field"><label for="m-motivo">Motivo</label><textarea id="m-motivo" rows="3">${esc(motivoInicial)}</textarea><span class="err">Escribe el motivo.</span></div>` : ""}
      ${estado !== "pendiente" ? `<label class="chk-line"><input type="checkbox" checked disabled> Notificar al contacto por correo <span class="muted">(se activa con el backend)</span></label>` : ""}
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" data-cancel>Cancelar</button>
        <button type="button" class="btn ${txt[2]}" data-ok>${txt[3]}</button>
      </div>`, (box, close) => {
      box.addEventListener("click", (e) => {
        const p = e.target.closest("[data-preset]");
        if (p) { $("#m-motivo", box).value = p.textContent; $("#m-motivo", box).focus(); }
        if (e.target.closest("[data-ok]")) {
          const motivo = conMotivo ? $("#m-motivo", box).value.trim() : "";
          if (conMotivo && !motivo) { $(".field", box).classList.add("invalid"); return; }
          close({ motivo });
        }
      });
    });
  }

  /* ---------- Exportar CSV ---------- */
  const CSV_PUBLICO = [
    ["ID", (r) => r.id], ["Registrado", (r) => r.creado], ["Estado", (r) => A.ESTADOS[r.estado]], ["Tipo", (r) => A.TIPOS[r.tipo]],
    ["Nombre del proyecto", (r) => r.nombre_proyecto], ["Género principal", (r) => r.genero_principal], ["Otros géneros", (r) => r.otros_generos.join(" / ")],
    ["Nacionalidad", (r) => r.nacionalidad], ["País de residencia", (r) => r.pais_residencia], ["Región de residencia", (r) => r.region_residencia],
    ["Ciudad actual", (r) => r.ciudad_actual], ["País de origen", (r) => r.pais_origen], ["Región de origen", (r) => r.region_origen], ["Ciudad de origen", (r) => r.ciudad_origen],
    ["Nombres (titular o integrantes)", (r) => r.identidad === "individual" ? r.nombre_completo : r.miembros.map((m) => m.nombre).join(" / ")],
    ["Enlace musical", (r) => r.enlace_musical], ["Red social", (r) => `${A.PLATAFORMAS[r.red_social_tipo]}: ${r.red_social}`],
    ["Rango de contratación", (r) => A.rangoLabel(r.rango_contratacion)], ["Contacto", (r) => r.contacto_nombre],
    ["WhatsApp", (r) => r.contacto_whatsapp], ["Correo", (r) => r.contacto_email],
  ];
  const CSV_PRIVADO = [
    ["Documentos", (r) => A.docsOf(r).map((d) => `${d.persona}: ${d.tipo} ${d.numero}`).join(" / ")],
    ["Quién registra", (r) => A.QUIEN[r.quien_registra]], ["Nombre de quien diligencia", (r) => r.registrante_nombre],
    ["Correo de quien diligencia", (r) => r.registrante_email], ["WhatsApp de quien diligencia", (r) => r.registrante_whatsapp],
    ["Motivo", (r) => r.motivo],
  ];

  function exportar(records) {
    return modal(`
      <h2>Exportar ${plural(records.length, "registro", "registros")}</h2>
      <p>Se descarga un archivo CSV con los registros ${records.length === A.all().length ? "" : "filtrados o seleccionados "}que ves en la tabla.</p>
      <div class="opt-cards">
        <label><input type="radio" name="alc" value="pub" checked><span><strong>Solo datos públicos</strong><small>Lo que se muestra en el perfil: nombres, géneros, territorio, enlaces, rango y contacto.</small></span></label>
        <label><input type="radio" name="alc" value="all"><span><strong>Completo, con datos privados</strong><small>Agrega documentos de identidad y los datos de quien diligencia. La descarga queda registrada.</small></span></label>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" data-cancel>Cancelar</button>
        <button type="button" class="btn btn-dark" data-ok>${ICON.down} Descargar CSV</button>
      </div>`, (box, close) => {
      $("[data-ok]", box).addEventListener("click", () => {
        const completo = $("input[name=alc]:checked", box).value === "all";
        const cols = completo ? CSV_PUBLICO.concat(CSV_PRIVADO) : CSV_PUBLICO;
        const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
        const csv = [cols.map((c) => cell(c[0])).join(";")].concat(records.map((r) => cols.map((c) => cell(c[1](r))).join(";"))).join("\r\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
        a.download = `musicroster-registros-${new Date().toISOString().slice(0, 10)}${completo ? "-completo" : ""}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        if (completo) records.forEach((r) => A.logAccess(r.id, "Exportación CSV con datos privados"));
        close(true);
        toast(`Se descargó el CSV con ${plural(records.length, "registro", "registros")}.`);
      });
    });
  }

  /* ---------- Tooltip de las gráficas ---------- */
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.hidden = true;
  document.body.appendChild(tip);
  function bindTip(root, selector) {
    const show = (el) => {
      const r = el.getBoundingClientRect();
      tip.innerHTML = el.dataset.tip;
      tip.hidden = false;
      tip.style.left = `${r.left + r.width / 2}px`;
      tip.style.top = `${Math.max(r.top + (el.dataset.tipTop ? Number(el.dataset.tipTop) : 0), 60)}px`;
    };
    root.addEventListener("pointerover", (e) => { const el = e.target.closest(selector); if (el) show(el); });
    root.addEventListener("pointerout", (e) => { if (e.target.closest(selector)) tip.hidden = true; });
    root.addEventListener("focusin", (e) => { const el = e.target.closest(selector); if (el) show(el); });
    root.addEventListener("focusout", () => (tip.hidden = true));
    window.addEventListener("scroll", () => (tip.hidden = true), { passive: true });
  }

  /* =========================================================
     ESTRUCTURA COMÚN
     ========================================================= */
  function shell() {
    const pend = A.all().filter((r) => r.estado === "pendiente").length;
    const dups = A.openDuplicates().length;
    $$('[data-count="pendiente"]').forEach((el) => { el.textContent = pend; el.classList.toggle("hot", pend > 0); });
    $$('[data-count="verificacion"]').forEach((el) => { el.textContent = dups; el.classList.toggle("hot", dups > 0); el.hidden = !dups; });
    $$("[data-user-name]").forEach((el) => (el.textContent = A.USER.nombre));
    $$("[data-user-rol]").forEach((el) => (el.textContent = A.USER.rol));
    $$("[data-user-ini]").forEach((el) => (el.textContent = A.USER.iniciales));
  }

  function shellOnce() {
    const menu = $(".adm-menu");
    if (menu) {
      menu.addEventListener("click", () => {
        const open = document.body.classList.toggle("side-open");
        menu.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", (e) => {
        if (document.body.classList.contains("side-open") && !e.target.closest(".adm-side, .adm-menu")) {
          document.body.classList.remove("side-open");
          menu.setAttribute("aria-expanded", "false");
        }
      });
    }
    const reset = $("[data-reset]");
    if (reset) reset.addEventListener("click", () => { A.reset(); location.reload(); });
  }

  /* =========================================================
     RESUMEN
     ========================================================= */
  function pageResumen() {
    let range = 30;
    const seg = $("#range");
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      range = Number(b.dataset.range);
      $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
    bindTip($("#chart-dias"), ".col");

    const count = (list, key) => {
      const m = new Map();
      list.forEach((r) => { const k = typeof key === "function" ? key(r) : r[key]; m.set(k, (m.get(k) || 0) + 1); });
      return m;
    };
    const hbars = (entries, total, href) => entries.length
      ? entries.map(([k, label, n]) => `
        <a class="hbar" href="${href(k)}">
          <span class="name" title="${esc(label)}">${esc(label)}</span>
          <span class="track"><i style="width:${(n / Math.max(...entries.map((e) => e[2]))) * 100}%"></i></span>
          <span class="val">${n}</span>
        </a>`).join("")
      : `<p class="muted">Sin registros en este periodo.</p>`;

    function render() {
      const now = Date.now();
      const all = A.all();
      const age = (r) => now - Date.parse(r.creado);
      const inRange = range ? all.filter((r) => age(r) < range * DAY) : all;
      const prev = range ? all.filter((r) => age(r) >= range * DAY && age(r) < 2 * range * DAY) : [];
      const periodo = range ? `últimos ${range} días` : "desde el lanzamiento";
      $("#range-label").textContent = periodo;

      // Indicadores
      const pend = all.filter((r) => r.estado === "pendiente");
      const oldest = pend.reduce((m, r) => Math.max(m, age(r)), 0);
      const pubs = inRange.filter((r) => r.estado === "aprobado").length;
      const dups = A.openDuplicates().length;
      const delta = range && prev.length ? Math.round(((inRange.length - prev.length) / prev.length) * 100) : null;
      $("#kpi-total").textContent = inRange.length;
      $("#kpi-total-foot").textContent = delta === null ? periodo : `${delta >= 0 ? "+" : ""}${delta}% frente a los ${range} días anteriores`;
      $("#kpi-pend").textContent = pend.length;
      $("#kpi-pend-foot").textContent = pend.length ? `El más antiguo espera desde ${ago(new Date(now - oldest).toISOString())}` : "Nada por revisar";
      $("#kpi-pub").textContent = pubs;
      $("#kpi-pub-foot").textContent = inRange.length ? `${Math.round((pubs / inRange.length) * 100)}% de los registros del periodo` : periodo;
      $("#kpi-dup").textContent = dups;
      $("#kpi-dup-foot").textContent = dups ? "Casos abiertos por revisar" : "Sin casos abiertos";

      // Registros por día
      const days = range || Math.ceil(all.reduce((m, r) => Math.max(m, age(r)), 0) / DAY) + 1;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const buckets = Array.from({ length: days }, (_, i) => ({ d: new Date(start.getTime() - (days - 1 - i) * DAY), n: 0 }));
      inRange.forEach((r) => {
        const d = new Date(r.creado); d.setHours(0, 0, 0, 0);
        const i = Math.round((d - buckets[0].d) / DAY);
        if (buckets[i]) buckets[i].n++;
      });
      const peak = Math.max(1, ...buckets.map((b) => b.n));
      const step = peak <= 4 ? 1 : peak <= 10 ? 2 : 5;
      const top = Math.ceil(peak / step) * step;
      const ticks = [];
      for (let v = 0; v <= top; v += step * (top / step > 4 ? 2 : 1)) ticks.push(v);
      $("#chart-dias").innerHTML = `
        <div class="grid" aria-hidden="true">${ticks.map((v) => `<i style="bottom:${(v / top) * 100}%"></i><span style="bottom:${(v / top) * 100}%;top:auto;transform:translateY(50%)">${v}</span>`).join("")}</div>
        ${buckets.map((b) => `<div class="col${b.n ? "" : " zero"}" tabindex="0" data-tip="<b>${plural(b.n, "registro", "registros")}</b>${fmtDay(b.d)}" aria-label="${fmtDay(b.d)}: ${plural(b.n, "registro", "registros")}"><i style="height:${(b.n / top) * 100}%"></i></div>`).join("")}`;
      $("#chart-dias-axis").innerHTML = [buckets[0], buckets[Math.floor(buckets.length / 2)], buckets[buckets.length - 1]].map((b) => `<span>${fmtDay(b.d)}</span>`).join("");
      $("#dias-total").textContent = `${plural(inRange.length, "registro", "registros")} · pico de ${peak} en un día`;

      // Estados
      const est = count(inRange, "estado");
      const ESTADO_COLOR = { pendiente: "var(--cta)", correccion: "var(--st-correccion)", aprobado: "var(--st-aprobado)", rechazado: "var(--st-rechazado)" };
      const orden = ["pendiente", "correccion", "aprobado", "rechazado"];
      const tot = inRange.length || 1;
      $("#estados-stack").innerHTML = orden.filter((e) => est.get(e)).map((e) => `<i style="flex:${est.get(e)};background:${ESTADO_COLOR[e]}" title="${A.ESTADOS[e]}: ${est.get(e)}"></i>`).join("");
      $("#estados-legend").innerHTML = orden.map((e) => `
        <a href="registros.html?estado=${e}"><span class="sw" style="background:${ESTADO_COLOR[e]}"></span>${A.ESTADOS[e]}
        <span class="n">${est.get(e) || 0}</span><span class="p">${Math.round(((est.get(e) || 0) / tot) * 100)}%</span></a>`).join("");

      // Tipo, género, territorio y rango
      const tipos = count(inRange, "tipo");
      $("#por-tipo").innerHTML = hbars(Object.keys(A.TIPOS).filter((k) => tipos.get(k)).map((k) => [k, A.TIPOS[k], tipos.get(k)]).sort((a, b) => b[2] - a[2]), tot, (k) => `registros.html?tipo=${k}`);
      const gen = [...count(inRange, "genero_principal")].sort((a, b) => b[1] - a[1]).slice(0, 8);
      $("#por-genero").innerHTML = hbars(gen.map(([k, n]) => [k, k, n]), tot, (k) => `registros.html?genero=${encodeURIComponent(k)}`);
      const reg = [...count(inRange, (r) => (r.pais_residencia === "Colombia" ? r.region_residencia : r.pais_residencia))].sort((a, b) => b[1] - a[1]).slice(0, 8);
      $("#por-region").innerHTML = hbars(reg.map(([k, n]) => [k, k, n]), tot, (k) => `registros.html?region=${encodeURIComponent(k)}`);
      const ran = count(inRange, "rango_contratacion");
      $("#por-rango").innerHTML = hbars(A.RANGOS.map(([k, l]) => [k, l, ran.get(k) || 0]), tot, (k) => `registros.html?rango=${k}`);

      const terceros = inRange.filter((r) => r.quien_registra !== "artista").length;
      $("#quien").innerHTML = `
        <div><strong>${inRange.length - terceros}</strong><span>El propio artista</span></div>
        <div><strong>${terceros}</strong><span>Un tercero (integrante, manager, equipo…)</span></div>`;

      // Recientes
      const dup = dupIds();
      $("#recientes").innerHTML = all.slice(0, 6).map((r) => `
        <tr data-href="${detailUrl(r.id)}">
          <td class="col-proj"><div class="proj">${avatar(r)}<div><strong><a href="${detailUrl(r.id)}">${esc(r.nombre_proyecto)}</a></strong><small>${A.TIPOS[r.tipo]} · ${esc(r.genero_principal)}</small></div></div></td>
          <td data-l="Ciudad">${esc(lugar(r))}</td>
          <td data-l="Registrado" class="nowrap">${ago(r.creado)}</td>
          <td>${badge(r.estado)} ${dup.has(r.id) ? dupFlag : ""}</td>
        </tr>`).join("");
    }
    rowLinks($("#recientes"));
    render();
  }

  // Filas de tabla que abren el detalle
  function rowLinks(tbody) {
    tbody.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, label")) return;
      const tr = e.target.closest("tr[data-href]");
      if (tr) location.href = tr.dataset.href;
    });
  }

  /* =========================================================
     REGISTROS
     ========================================================= */
  function pageRegistros() {
    const PER_PAGE = 15;
    const params = new URLSearchParams(location.search);
    const st = {
      estado: params.get("estado") || "todos",
      q: params.get("q") || "",
      tipo: params.get("tipo") || "todos",
      genero: params.get("genero") || "todos",
      region: params.get("region") || "todos",
      rango: params.get("rango") || "todos",
      sort: "creado",
      dir: -1,
      page: 1,
      sel: new Set(),
    };

    const regionDe = (r) => (r.pais_residencia === "Colombia" ? r.region_residencia : r.pais_residencia);
    const unique = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, "es"));
    const opts = (todos, pairs) => [["todos", todos]].concat(pairs).map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
    $("#f-tipo").innerHTML = opts("Todos los tipos", Object.entries(A.TIPOS));
    $("#f-genero").innerHTML = opts("Todos los géneros", unique(A.all().map((r) => r.genero_principal)).map((g) => [g, g]));
    $("#f-region").innerHTML = opts("Todo el territorio", unique(A.all().map(regionDe)).map((g) => [g, g]));
    $("#f-rango").innerHTML = opts("Todos los rangos", A.RANGOS);
    const filters = { tipo: $("#f-tipo"), genero: $("#f-genero"), region: $("#f-region"), rango: $("#f-rango") };
    Object.entries(filters).forEach(([k, el]) => (el.value = st[k]));
    $("#f-q").value = st.q;
    if (window.Dropdown) window.Dropdown.enhance($(".filters-row"));

    const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const matches = (r) => {
      if (st.tipo !== "todos" && r.tipo !== st.tipo) return false;
      if (st.genero !== "todos" && r.genero_principal !== st.genero) return false;
      if (st.region !== "todos" && regionDe(r) !== st.region) return false;
      if (st.rango !== "todos" && r.rango_contratacion !== st.rango) return false;
      if (st.q) {
        const hay = norm([r.id, r.nombre_proyecto, r.nombre_completo, r.contacto_nombre, r.contacto_email, r.ciudad_actual, ...r.miembros.map((m) => m.nombre)].join(" "));
        if (!norm(st.q).split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    };
    const ORDEN_ESTADO = { pendiente: 0, correccion: 1, aprobado: 2, rechazado: 3 };
    const sorters = {
      creado: (a, b) => a.creado.localeCompare(b.creado),
      nombre: (a, b) => a.nombre_proyecto.localeCompare(b.nombre_proyecto, "es"),
      estado: (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.creado.localeCompare(a.creado),
    };

    let visibles = [];

    function syncUrl() {
      const p = new URLSearchParams();
      ["estado", "tipo", "genero", "region", "rango"].forEach((k) => st[k] !== "todos" && p.set(k, st[k]));
      if (st.q) p.set("q", st.q);
      history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`);
    }

    function render() {
      const dup = dupIds();
      const base = A.all().filter(matches);
      // Pestañas de estado con conteo según los demás filtros
      const counts = { todos: base.length };
      base.forEach((r) => (counts[r.estado] = (counts[r.estado] || 0) + 1));
      $("#tabs").innerHTML = [["todos", "Todos"], ...Object.entries(A.ESTADOS)].map(([k, l]) =>
        `<button type="button" role="tab" data-estado="${k}" aria-selected="${st.estado === k}">${l}<span class="n">${counts[k] || 0}</span></button>`).join("");

      visibles = base.filter((r) => st.estado === "todos" || r.estado === st.estado).sort((a, b) => sorters[st.sort](a, b) * st.dir);
      const pages = Math.max(1, Math.ceil(visibles.length / PER_PAGE));
      st.page = Math.min(st.page, pages);
      const slice = visibles.slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE);

      $$("th[data-sort]").forEach((th) => {
        const on = th.dataset.sort === st.sort;
        if (on) th.setAttribute("aria-sort", st.dir > 0 ? "ascending" : "descending"); else th.removeAttribute("aria-sort");
        $(".arr", th).textContent = on ? (st.dir > 0 ? "↑" : "↓") : "";
      });

      $("#rows").innerHTML = slice.length ? slice.map((r) => `
        <tr data-href="${detailUrl(r.id)}" class="${st.sel.has(r.id) ? "is-selected" : ""}">
          <td class="chk"><input type="checkbox" data-id="${r.id}" aria-label="Seleccionar ${esc(r.nombre_proyecto)}" ${st.sel.has(r.id) ? "checked" : ""}></td>
          <td class="col-proj"><div class="proj">${avatar(r)}<div><strong><a href="${detailUrl(r.id)}">${esc(r.nombre_proyecto)}</a></strong><small class="mono">${r.id}</small></div></div></td>
          <td data-l="Tipo" class="nowrap">${A.TIPOS[r.tipo]}${r.identidad === "colectivo" ? ` <span class="muted">· ${r.miembros.length}</span>` : ""}</td>
          <td data-l="Género">${esc(r.genero_principal)}</td>
          <td data-l="Ciudad">${esc(lugar(r))}</td>
          <td data-l="Rango" class="nowrap">${A.rangoLabel(r.rango_contratacion)}</td>
          <td data-l="Registrado" class="nowrap" title="${fmtDateTime(r.creado)}">${fmtDate(r.creado)}</td>
          <td>${badge(r.estado)} ${dup.has(r.id) ? dupFlag : ""}</td>
        </tr>`).join("")
        : `<tr><td colspan="8"><div class="empty"><strong>No hay registros con estos filtros</strong>Prueba con otro estado o limpia los filtros.</div></td></tr>`;

      $("#all-chk").checked = slice.length > 0 && slice.every((r) => st.sel.has(r.id));
      $("#all-chk").indeterminate = !$("#all-chk").checked && slice.some((r) => st.sel.has(r.id));

      const from = visibles.length ? (st.page - 1) * PER_PAGE + 1 : 0;
      $("#pager-info").textContent = `${from}–${Math.min(st.page * PER_PAGE, visibles.length)} de ${visibles.length}`;
      const nums = [];
      for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - st.page) <= 1) nums.push(p); else if (nums[nums.length - 1] !== "…") nums.push("…");
      $("#pager-pages").innerHTML = `<button type="button" data-page="${st.page - 1}" ${st.page === 1 ? "disabled" : ""} aria-label="Anterior">‹</button>` +
        nums.map((p) => (p === "…" ? `<button type="button" disabled>…</button>` : `<button type="button" data-page="${p}" ${p === st.page ? 'aria-current="page"' : ""}>${p}</button>`)).join("") +
        `<button type="button" data-page="${st.page + 1}" ${st.page === pages ? "disabled" : ""} aria-label="Siguiente">›</button>`;

      const n = st.sel.size;
      $("#bulk").hidden = n === 0;
      $("#bulk-n").textContent = `${plural(n, "registro seleccionado", "registros seleccionados")}`;
      const activos = ["tipo", "genero", "region", "rango"].some((k) => st[k] !== "todos") || st.q;
      $("#f-clear").hidden = !activos;
      $("#export").textContent = `Exportar${visibles.length !== A.all().length ? ` (${visibles.length})` : ""}`;
      syncUrl();
      shell();
    }

    $("#tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-estado]");
      if (!b) return;
      st.estado = b.dataset.estado; st.page = 1; render();
    });
    Object.entries(filters).forEach(([k, el]) => el.addEventListener("change", () => { st[k] = el.value; st.page = 1; render(); }));
    let qTimer = 0;
    $("#f-q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { st.q = e.target.value.trim(); st.page = 1; render(); }, 180); });
    $("#f-clear").addEventListener("click", () => {
      Object.entries(filters).forEach(([k, el]) => { st[k] = "todos"; el.value = "todos"; el.dispatchEvent(new Event("change")); });
      st.q = ""; $("#f-q").value = ""; render();
    });
    $("thead").addEventListener("click", (e) => {
      const th = e.target.closest("th[data-sort]");
      if (!th) return;
      if (st.sort === th.dataset.sort) st.dir *= -1; else { st.sort = th.dataset.sort; st.dir = th.dataset.sort === "nombre" ? 1 : -1; }
      render();
    });
    $("#pager-pages").addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b && !b.disabled) { st.page = Number(b.dataset.page); render(); $(".table-card").scrollIntoView({ block: "start" }); } });
    $("#rows").addEventListener("change", (e) => {
      const c = e.target.closest("[data-id]");
      if (!c) return;
      if (c.checked) st.sel.add(c.dataset.id); else st.sel.delete(c.dataset.id);
      render();
    });
    $("#all-chk").addEventListener("change", (e) => {
      const slice = visibles.slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE);
      slice.forEach((r) => (e.target.checked ? st.sel.add(r.id) : st.sel.delete(r.id)));
      render();
    });
    rowLinks($("#rows"));

    $("#bulk").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-bulk]");
      if (!b) return;
      const ids = [...st.sel];
      if (b.dataset.bulk === "clear") { st.sel.clear(); render(); return; }
      if (b.dataset.bulk === "export") { exportar(ids.map(A.get)); return; }
      const res = await confirmEstado(b.dataset.bulk, ids.length);
      if (!res) return;
      A.setEstado(ids, b.dataset.bulk, res.motivo);
      st.sel.clear();
      render();
      toast(`${plural(ids.length, "registro actualizado", "registros actualizados")}: ${A.ESTADOS[b.dataset.bulk].toLowerCase()}.`);
    });
    $("#export").addEventListener("click", () => exportar(visibles));

    render();
  }

  /* =========================================================
     DETALLE DE REGISTRO
     ========================================================= */
  function pageRegistro() {
    const id = new URLSearchParams(location.search).get("id") || A.all()[0].id;
    const rec = A.get(id);
    const root = $("#detalle");
    if (!rec) {
      root.innerHTML = `<div class="card empty"><strong>No encontramos el registro ${esc(id)}</strong><a href="registros.html">Volver a la lista</a></div>`;
      return;
    }
    document.title = `${rec.nombre_proyecto} — Registros — Admin MusicRoster`;
    $("#crumb-id").textContent = rec.id;
    const editing = new Set();

    // Anterior y siguiente en el orden de la lista (más recientes primero)
    const list = A.all();
    const idx = list.indexOf(rec);
    const nav = (el, other) => { if (other) el.href = detailUrl(other.id); else { el.removeAttribute("href"); el.setAttribute("aria-disabled", "true"); el.style.opacity = 0.4; } };
    nav($("#prev"), list[idx - 1]);
    nav($("#next"), list[idx + 1]);

    const vis = (pub) => pub
      ? `<span class="vis pub" title="Se muestra en el perfil público">${ICON.eye}Público</span>`
      : `<span class="vis priv" title="Solo lo ve el equipo de MusicRoster">${ICON.lock}Privado</span>`;
    const val = (v) => (v === "" || v == null ? `<span class="empty-val">Sin dato</span>` : esc(v));
    const link = (url) => {
      const href = /^https?:\/\//.test(url) ? url : url.startsWith("@") ? null : `https://${url}`;
      return href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(url)}</a>` : esc(url);
    };
    const secret = (value, que) => value ? `<span class="secret" data-value="${esc(value)}" data-que="${esc(que)}"><span class="mono">${mask(value)}</span><button type="button" data-reveal>Mostrar</button></span>` : val("");
    const linksHtml = (items) => items.length
      ? `<div class="links-list">${items.map((l) => `<a href="${esc(/^https?:/.test(l.url) ? l.url : "#")}" target="_blank" rel="noopener"><em>${A.PLATAFORMAS[l.plataforma] || l.plataforma}</em><span>${esc(l.url)}</span></a>`).join("")}</div>`
      : val("");

    /* Campos por sección, en el mismo orden que el cuestionario.
       edit: tipo de control al editar (los campos sin edit no se editan desde aquí). */
    const sections = () => {
      const r = rec;
      const ind = r.identidad === "individual";
      return [
        { n: 1, t: "Proyecto", f: [
          { l: "Tipo de proyecto", pub: true, html: `${A.TIPOS[r.tipo]}${r.tipo === "otro" ? ` · ${r.otro_composicion === "colectivo" ? "varias personas" : "una persona"}` : ""}` },
          r.tipo === "otro" && { k: "otro_descripcion", l: "¿Qué tipo de proyecto es?", pub: true, edit: "text" },
          { k: "nombre_proyecto", l: "Nombre artístico", pub: true, edit: "text", full: r.tipo !== "otro" },
        ] },
        { n: 2, t: "Géneros", f: [
          { k: "genero_principal", l: "Género principal", pub: true, edit: A.GENEROS.map((g) => [g, g]), html: `<span class="chip main">${esc(r.genero_principal)}</span>` },
          { l: "Otros géneros", pub: true, html: r.otros_generos.length ? `<div class="chips-row">${r.otros_generos.map((g) => `<span class="chip">${esc(g)}</span>`).join("")}</div>` : val("") },
          r.otro_genero && { k: "otro_genero", l: "Otro género", pub: true, edit: "text" },
        ] },
        { n: 3, t: "Territorio", f: [
          { k: "nacionalidad", l: "Nacionalidad", pub: true, edit: "text", full: true },
          { k: "pais_residencia", l: "País de residencia", pub: true, edit: "text" },
          { k: "region_residencia", l: "Departamento / región", pub: true, edit: "text" },
          { k: "ciudad_actual", l: "Ciudad o municipio actual", pub: true, edit: "text", full: true },
          { k: "pais_origen", l: "País de origen", pub: true, edit: "text" },
          { k: "region_origen", l: "Región de origen", pub: true, edit: "text" },
          { k: "ciudad_origen", l: "Ciudad de origen", pub: true, edit: "text", full: true },
        ] },
        { n: 4, t: ind ? "Identidad del titular" : `Miembros oficiales · ${r.miembros.length}`, members: !ind, f: ind ? [
          { k: "nombre_completo", l: "Nombre completo", pub: true, edit: "text", full: true },
          { k: "tipo_documento", l: "Tipo de documento", pub: false, edit: Object.entries(A.DOCS), html: val(A.DOCS[r.tipo_documento]) },
          { k: "numero_documento", l: "Número de documento", pub: false, edit: "text", html: secret(r.numero_documento, "Número de documento del titular") },
          { k: "pais_expedicion", l: "País de expedición", pub: false, edit: "text", full: true },
        ] : [] },
        { n: 5, t: "Presencia musical e imagen", f: [
          { k: "enlace_musical", l: `Enlace principal · ${A.PLATAFORMAS[r.plataforma_musical]}`, pub: true, edit: "url", full: true, html: link(r.enlace_musical) },
          { l: "Otros enlaces musicales", pub: true, full: true, html: linksHtml(r.otros_enlaces) },
          { k: "red_social", l: `Red social principal · ${A.PLATAFORMAS[r.red_social_tipo]}`, pub: true, edit: "text", html: link(r.red_social) },
          { l: "Otras redes", pub: true, html: linksHtml(r.otras_redes) },
          { l: "Fotografía oficial", pub: true, full: true, html: `<div style="display:flex;gap:14px;align-items:center">${avatar(r, "lg")}<span class="muted" style="font-size:13px">Vista de muestra. Con el backend aquí se ve la foto enviada, con opción de descargarla o reemplazarla.</span></div>` },
        ] },
        { n: 6, t: "Contratación", f: [
          { k: "rango_contratacion", l: "Rango de contratación", pub: true, edit: A.RANGOS, full: true, html: val(A.rangoLabel(r.rango_contratacion)) },
          { k: "contacto_nombre", l: "Contacto", pub: true, edit: "text", full: true },
          { k: "contacto_whatsapp", l: "WhatsApp", pub: true, edit: "tel", html: `<a href="https://wa.me/${r.contacto_whatsapp.replace(/\D/g, "")}" target="_blank" rel="noopener">${esc(r.contacto_whatsapp)}</a>` },
          { k: "contacto_email", l: "Correo", pub: true, edit: "email", html: `<a href="mailto:${esc(r.contacto_email)}">${esc(r.contacto_email)}</a>` },
        ] },
        { n: 7, t: "Registro y autorizaciones", decl: true, f: [
          { l: "Quién hizo el registro", pub: false, html: esc(A.QUIEN[r.quien_registra]), full: r.quien_registra === "artista" },
          r.quien_registra !== "artista" && { k: "registrante_nombre", l: "Nombre de quien diligencia", pub: false, edit: "text" },
          r.quien_registra !== "artista" && { k: "registrante_email", l: "Correo", pub: false, edit: "email" },
          r.quien_registra !== "artista" && { k: "registrante_whatsapp", l: "WhatsApp", pub: false, edit: "tel" },
          { l: "Enviado", pub: false, html: fmtDateTime(r.creado) },
        ] },
      ].map((s) => ({ ...s, f: s.f.filter(Boolean) }));
    };

    const membersHtml = () => `
      <table class="members-t">
        <thead><tr><th>Nombre ${vis(true)}</th><th>Rol ${vis(true)}</th><th>Documento ${vis(false)}</th><th>Expedición ${vis(false)}</th></tr></thead>
        <tbody>${rec.miembros.map((m, i) => `
          <tr>
            <td><strong>${esc(m.nombre)}</strong>${i === rec.lider ? `<span class="lead-tag">${rec.tipo === "orquesta" ? "Director" : "Líder"}</span>` : ""}</td>
            <td>${esc(m.rol === "otro" ? m.rol_otro || "Otro" : A.ROLES[m.rol])}</td>
            <td>${A.DOCS[m.tipo_documento] ? `<span class="muted">${m.tipo_documento}</span> ` : ""}${secret(m.numero_documento, `Documento de ${m.nombre}`)}</td>
            <td>${esc(m.pais_expedicion)}</td>
          </tr>`).join("")}</tbody>
      </table>
      <p class="muted" style="font-size:13px;margin:12px 0 0">El documento del ${rec.tipo === "orquesta" ? "director" : "líder"} es la referencia principal del registro de la agrupación.</p>`;

    const fieldView = (f, tag = true) => `<div class="${f.full ? "full" : ""}"><dt>${esc(f.l)} ${tag ? vis(f.pub) : ""}</dt><dd>${f.html !== undefined ? f.html : val(rec[f.k])}</dd></div>`;
    const fieldEdit = (f, tag = true) => {
      if (!f.edit) return fieldView(f, tag);
      const id = `e-${f.k}`;
      const control = Array.isArray(f.edit)
        ? `<select id="${id}" data-k="${f.k}">${f.edit.map(([v, l]) => `<option value="${esc(v)}" ${v === rec[f.k] ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`
        : `<input type="${f.edit}" id="${id}" data-k="${f.k}" value="${esc(rec[f.k])}">`;
      return `<div class="field ${f.full ? "full" : ""}"><label for="${id}">${esc(f.l)} ${tag ? vis(f.pub) : ""}</label>${control}</div>`;
    };

    function renderHero() {
      const esTercero = rec.quien_registra !== "artista";
      $("#hero").innerHTML = `
        ${avatar(rec, "lg")}
        <div class="info">
          ${badge(rec.estado)}
          <h2>${esc(rec.nombre_proyecto)}</h2>
          <div class="line">
            <span><b>${A.TIPOS[rec.tipo]}</b></span>
            <span>${esc(rec.genero_principal)}</span>
            <span>${esc(lugar(rec))}</span>
            <span class="mono">${rec.id}</span>
            <span>Registrado ${ago(rec.creado)}${esTercero ? ` por ${A.QUIEN[rec.quien_registra].toLowerCase()}` : ""}</span>
          </div>
        </div>`;
    }

    function renderSections() {
      $("#secciones").innerHTML = sections().map((s) => {
        const ed = editing.has(s.n);
        const canEdit = s.f.some((f) => f.edit);
        // Si toda la sección es pública (o privada) la etiqueta va una sola vez, en el título
        const same = !s.members && s.f.every((f) => f.pub === s.f[0].pub);
        return `
        <section class="card" data-sec="${s.n}" aria-labelledby="sec-${s.n}">
          <div class="card-head">
            <span class="sec-n">${s.n}</span><h3 id="sec-${s.n}">${esc(s.t)}</h3>${same ? vis(s.f[0].pub) : ""}
            ${canEdit ? (ed
              ? `<span class="edit-btn" style="display:flex;gap:6px"><button type="button" class="btn btn-ghost btn-sm" data-cancel-edit>Cancelar</button><button type="button" class="btn btn-dark btn-sm" data-save>Guardar</button></span>`
              : `<button type="button" class="btn btn-ghost btn-sm edit-btn" data-edit>Editar</button>`) : ""}
          </div>
          ${s.members ? membersHtml() : ""}
          ${s.f.length ? (ed ? `<div class="field-grid kv-edit">${s.f.map((f) => fieldEdit(f, !same)).join("")}</div>` : `<dl class="kv">${s.f.map((f) => fieldView(f, !same)).join("")}</dl>`) : ""}
          ${s.decl ? `<h3 style="margin:22px 0 10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Declaraciones aceptadas</h3>
            <ul class="decls">${A.DECLARACIONES.filter(([k]) => k !== "decl_integrantes" || rec[k]).map(([k, l]) => `<li class="${rec[k] ? "" : "off"}">${rec[k] ? ICON.check : ICON.x}${esc(l)}</li>`).join("")}</ul>` : ""}
        </section>`;
      }).join("");
    }

    function renderModeracion() {
      const last = rec.historial.slice().reverse().find((h) => !h.privado && h.autor !== "Formulario web");
      const acciones = {
        pendiente: ["aprobado", "correccion", "rechazado"],
        correccion: ["aprobado", "rechazado", "pendiente"],
        aprobado: ["correccion", "pendiente", "rechazado"],
        rechazado: ["pendiente"],
      }[rec.estado];
      const BTN = {
        aprobado: `<button type="button" class="btn btn-ok" data-estado="aprobado">${ICON.check} Aprobar y publicar</button>`,
        correccion: `<button type="button" class="btn btn-ghost" data-estado="correccion">Pedir corrección</button>`,
        rechazado: `<button type="button" class="btn btn-danger" data-estado="rechazado">Rechazar</button>`,
        pendiente: `<button type="button" class="btn btn-ghost" data-estado="pendiente">Volver a pendiente</button>`,
      };
      $("#moderacion").innerHTML = `
        <div class="card-head"><h3>Moderación</h3></div>
        <div class="mod-status">${badge(rec.estado)}<small class="muted">${last ? `${esc(last.autor)} · ${ago(last.fecha)}` : `En cola ${ago(rec.creado)}`}</small></div>
        <div class="mod-actions">${acciones.map((a) => BTN[a]).join("")}</div>
        ${rec.motivo ? `<div class="mod-reason"><b>Motivo</b>${esc(rec.motivo)}</div>` : ""}
        ${rec.estado === "aprobado" ? `<p class="muted" style="font-size:13px;margin:12px 0 0">El perfil está visible en el buscador.</p>` : ""}`;

      // Alertas
      const casos = A.openDuplicates().filter((g) => g.items.includes(rec));
      const KIND = { documento: "el mismo número de documento", nombre: "el mismo nombre de proyecto", email: "el mismo correo de contacto" };
      const alertas = casos.map((g) => {
        const otros = g.items.filter((x) => x !== rec);
        return `<div class="alert">${ICON.alert}<div>Comparte ${g.kinds.map((k) => KIND[k]).join(", ")} con ${otros.map((o) => `<a href="${detailUrl(o.id)}">${esc(o.nombre_proyecto)}</a> (${A.ESTADOS[o.estado].toLowerCase()})`).join(", ")}. <a href="verificacion.html#${encodeURIComponent(g.key)}">Revisar caso →</a></div></div>`;
      });
      if (rec.quien_registra !== "artista") alertas.push(`<div class="alert info">${ICON.info}<div>Lo registró un tercero (${esc(A.QUIEN[rec.quien_registra].toLowerCase())}). Confirma que los datos de identificación corresponden al artista o a los integrantes.</div></div>`);
      $("#alertas").hidden = !alertas.length;
      $("#alertas").innerHTML = `<div class="card-head"><h3>Alertas</h3></div>${alertas.join("")}`;

      $("#notas-list").innerHTML = rec.notas.length
        ? rec.notas.slice().reverse().map((n) => `<div class="note">${esc(n.texto)}<small>${esc(n.autor)} · ${fmtDateTime(n.fecha)}</small></div>`).join("")
        : `<p class="muted" style="font-size:13px;margin:0">Sin notas. Solo las ve el equipo.</p>`;

      $("#historial").innerHTML = rec.historial.slice().reverse().map((h) => `
        <li class="${h.privado ? "priv" : ""}"><strong>${esc(h.accion)}</strong>${h.detalle ? `${esc(h.detalle)}<br>` : ""}<small>${esc(h.autor)} · ${fmtDateTime(h.fecha)}</small></li>`).join("");
    }

    function renderAll() { renderHero(); renderSections(); renderModeracion(); shell(); }

    // Mostrar un documento queda registrado en el historial
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-reveal]");
      if (!b) return;
      const s = b.closest(".secret");
      s.innerHTML = `<span class="mono">${esc(s.dataset.value)}</span><button type="button" data-copy="${esc(s.dataset.value)}" aria-label="Copiar">Copiar</button>`;
      A.logAccess(rec.id, s.dataset.que);
      renderModeracion();
    });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-copy]");
      if (b && navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(() => toast("Copiado."));
    });

    // Edición por sección
    $("#secciones").addEventListener("click", (e) => {
      const sec = e.target.closest("[data-sec]");
      if (!sec) return;
      const n = Number(sec.dataset.sec);
      if (e.target.closest("[data-edit]")) {
        editing.add(n);
        if (n === 4 && rec.identidad === "individual") A.logAccess(rec.id, "Editó los datos de identificación");
        renderSections();
        if (window.Dropdown) window.Dropdown.enhance($(`[data-sec="${n}"]`));
        const first = $(`[data-sec="${n}"] input, [data-sec="${n}"] .dd-trigger`);
        if (first) first.focus();
        if (n === 4) renderModeracion();
      }
      if (e.target.closest("[data-cancel-edit]")) { editing.delete(n); renderSections(); }
      if (e.target.closest("[data-save]")) {
        const patch = {};
        const labels = [];
        $$("[data-k]", sec).forEach((el) => {
          const v = el.value.trim();
          if (v !== String(rec[el.dataset.k] || "")) {
            patch[el.dataset.k] = v;
            labels.push(el.closest(".field").querySelector("label").childNodes[0].textContent.trim());
          }
        });
        editing.delete(n);
        if (labels.length) {
          A.update(rec.id, patch, `Editó ${sections().find((s) => s.n === n).t.split(" · ")[0].toLowerCase()}`, labels.join(", "));
          toast("Cambios guardados.");
        }
        renderAll();
      }
    });

    $("#moderacion").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-estado]");
      if (!b) return;
      const res = await confirmEstado(b.dataset.estado, 1);
      if (!res) return;
      A.setEstado([rec.id], b.dataset.estado, res.motivo);
      renderAll();
      toast(`Estado actualizado: ${A.ESTADOS[rec.estado].toLowerCase()}.`);
    });

    $("#nota-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const t = $("#nota-txt");
      if (!t.value.trim()) return t.focus();
      A.addNote(rec.id, t.value.trim());
      t.value = "";
      renderModeracion();
    });

    renderAll();
  }

  /* =========================================================
     VERIFICACIÓN (posibles duplicados)
     ========================================================= */
  function pageVerificacion() {
    let tab = "abiertos";
    const KIND = {
      documento: ["Mismo número de documento", "Una misma persona aparece en más de un registro. Puede ser un integrante que también es solista (válido) o una suplantación."],
      nombre: ["Mismo nombre de proyecto", "El proyecto pudo registrarse dos veces, por ejemplo una vez el artista y otra su manager."],
      email: ["Mismo correo de contacto", "Varios proyectos comparten contacto. Suele ser un mismo manager o sello: revisa que no sea un duplicado."],
    };

    function render() {
      const all = A.duplicates();
      const groups = { abiertos: all.filter((g) => !g.dismissed && !g.resolved), cerrados: all.filter((g) => g.dismissed || g.resolved) };
      $("#tabs").innerHTML = [["abiertos", "Por revisar"], ["cerrados", "Resueltos"]].map(([k, l]) =>
        `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}<span class="n">${groups[k].length}</span></button>`).join("");

      const list = groups[tab];
      $("#casos").innerHTML = list.length ? list.map((g) => {
        const titulo = KIND[g.kind][0];
        // Si coincide el nombre, lo más probable es el mismo proyecto registrado dos veces
        const ayuda = KIND[g.kinds.includes("nombre") ? "nombre" : g.kind][1];
        const coincide = (rec, kind) => g.kinds.includes(kind) ? "match" : "";
        return `
        <section class="card vgroup ${tab === "cerrados" ? "resolved" : ""}" id="${esc(g.key)}">
          <div class="vgroup-head">
            <span class="flag">${ICON.alert}${g.kinds.length > 1 ? `${g.kinds.length} coincidencias` : "Coincidencia"}</span>
            <h3>${titulo}${g.kinds.slice(1).map((k) => ` + ${KIND[k][0].toLowerCase()}`).join("")}</h3>
            <div class="actions">
              ${g.dismissed ? `<button type="button" class="btn btn-ghost btn-sm" data-undismiss="${esc(g.key)}">Reabrir</button>`
                : g.resolved ? `<span class="muted" style="font-size:13px">Resuelto: queda un solo registro activo</span>`
                : `<button type="button" class="btn btn-ghost btn-sm" data-dismiss="${esc(g.key)}">No es duplicado</button>`}
            </div>
            <p>${ayuda}</p>
          </div>
          <div class="vcols">${g.items.map((r, i) => {
            const docs = g.docs[r.id] || [];
            return `
            <div class="vcol">
              <div class="proj">${avatar(r)}<div><strong><a href="${detailUrl(r.id)}">${esc(r.nombre_proyecto)}</a></strong><small class="mono">${r.id}</small></div></div>
              <dl>
                <div><dt>Estado</dt><dd>${badge(r.estado)}</dd></div>
                <div><dt>Registrado</dt><dd>${fmtDateTime(r.creado)}${i === 0 ? ' <span class="muted">· primero</span>' : ""}</dd></div>
                <div><dt>Tipo</dt><dd>${A.TIPOS[r.tipo]} · ${esc(r.genero_principal)}</dd></div>
                ${docs.length ? `<div><dt>${docs.length > 1 ? `${docs.length} documentos coinciden` : "Documento que coincide"}</dt>${docs.slice(0, 2).map((d) => `<dd class="match mono">${d.tipo} ${mask(d.numero)}</dd><dd style="font-weight:500">${esc(d.persona)}${r.identidad === "colectivo" ? " (integrante)" : " (titular)"}</dd>`).join("")}${docs.length > 2 ? `<dd class="muted" style="font-weight:500">y ${plural(docs.length - 2, "integrante más", "integrantes más")}</dd>` : ""}</div>` : ""}
                <div><dt>Contacto</dt><dd class="${coincide(r, "email")}">${esc(r.contacto_email)}</dd></div>
                <div><dt>Registrado por</dt><dd>${esc(A.QUIEN[r.quien_registra])}${r.registrante_nombre ? ` · ${esc(r.registrante_nombre)}` : ""}</dd></div>
              </dl>
              ${!g.dismissed && !g.resolved && r.estado !== "rechazado" ? `<button type="button" class="btn btn-danger btn-sm" data-reject="${r.id}" data-orig="${g.items.find((x) => x !== r).id}">Rechazar como duplicado</button>` : ""}
            </div>`;
          }).join("")}</div>
        </section>`;
      }).join("") : `<div class="card empty"><strong>${tab === "abiertos" ? "No hay casos por revisar" : "Aún no hay casos resueltos"}</strong>${tab === "abiertos" ? "Cuando dos registros compartan documento, nombre o contacto aparecerán aquí." : ""}</div>`;
      shell();
    }

    $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { tab = b.dataset.tab; render(); } });
    $("#casos").addEventListener("click", async (e) => {
      const d = e.target.closest("[data-dismiss]");
      if (d) { A.dismiss(d.dataset.dismiss); render(); toast("Caso marcado como “no es duplicado”."); return; }
      const u = e.target.closest("[data-undismiss]");
      if (u) { A.undismiss(u.dataset.undismiss); tab = "abiertos"; render(); return; }
      const r = e.target.closest("[data-reject]");
      if (r) {
        const res = await confirmEstado("rechazado", 1, `Registro duplicado de ${r.dataset.orig}.`);
        if (!res) return;
        A.setEstado([r.dataset.reject], "rechazado", res.motivo);
        render();
        toast("Registro rechazado como duplicado.");
      }
    });
    render();
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView({ block: "start" }); }
  }

  /* =========================================================
     ACCESO
     ========================================================= */
  function pageLogin() {
    // Sin backend: cualquier correo y contraseña entran al panel
    $("#login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      let ok = true;
      $$("input[required]", f).forEach((i) => { const bad = !i.checkValidity(); i.closest(".field").classList.toggle("invalid", bad); ok = ok && !bad; });
      if (!ok) return;
      const b = $("button[type=submit]", f);
      b.disabled = true;
      b.textContent = "Ingresando…";
      setTimeout(() => (location.href = "index.html"), 500);
    });
  }

  /* ---------- Inicio ---------- */
  const page = document.body.dataset.page;
  if (page !== "login") { shellOnce(); shell(); }
  ({ resumen: pageResumen, registros: pageRegistros, registro: pageRegistro, verificacion: pageVerificacion, login: pageLogin }[page] || (() => {}))();
})();
