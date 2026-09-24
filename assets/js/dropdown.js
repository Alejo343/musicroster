/* Billboard MusicRoster — desplegables propios
   Reemplaza la lista nativa de <select> y de <input list="…"> (datalist) por un panel con el diseño del sitio.
   El control original sigue guardando el valor, así que la validación y el envío del formulario no cambian.
   Uso: Dropdown.enhance(contenedor) — es seguro llamarlo varias veces. */
(function () {
  "use strict";

  const MAX_ITEMS = 120;
  const CHEVRON = '<svg class="dd-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>';
  let uid = 0;

  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Resalta la coincidencia sin importar tildes ni mayúsculas
  const highlight = (text, q) => {
    if (!q) return esc(text);
    let flat = "";
    const map = [];
    [...text].forEach((ch, i) => { const n = norm(ch); for (const c of n) { flat += c; map.push(i); } });
    const at = flat.indexOf(q);
    if (at < 0) return esc(text);
    const chars = [...text];
    const start = map[at];
    const end = map[at + q.length - 1] + 1;
    return esc(chars.slice(0, start).join("")) + "<mark>" + esc(chars.slice(start, end).join("")) + "</mark>" + esc(chars.slice(end).join(""));
  };

  const accessibleName = (el) => {
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    const field = el.closest(".field");
    const lab = field && field.querySelector("label, .label");
    return lab ? lab.textContent.trim() : "";
  };

  // Abre el panel hacia arriba cuando no cabe debajo
  const place = (wrap, panel) => {
    wrap.classList.remove("dd-up");
    const r = wrap.getBoundingClientRect();
    const h = Math.min(panel.scrollHeight, 300);
    if (window.innerHeight - r.bottom < h + 16 && r.top > h + 16) wrap.classList.add("dd-up");
  };

  let openInstance = null;
  const closeOpen = () => { if (openInstance) openInstance.close(); };
  document.addEventListener("pointerdown", (e) => {
    if (openInstance && !openInstance.wrap.contains(e.target)) closeOpen();
  });
  window.addEventListener("resize", closeOpen);

  /* ---------- <select> ---------- */
  function enhanceSelect(select) {
    const id = `dd${++uid}`;
    const wrap = document.createElement("div");
    wrap.className = "dd dd-select";
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add("dd-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "dd-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", `${id}-list`);
    trigger.innerHTML = `<span class="dd-value"></span>${CHEVRON}`;
    const valueEl = trigger.firstElementChild;

    const panel = document.createElement("ul");
    panel.className = "dd-panel";
    panel.id = `${id}-list`;
    panel.setAttribute("role", "listbox");
    panel.hidden = true;
    wrap.append(trigger, panel);

    let active = -1;
    let typed = "";
    let typedTimer = 0;
    const options = () => [...select.options].filter((o) => o.value !== "");

    const refresh = () => {
      const sel = select.selectedOptions[0];
      const empty = !sel || sel.value === "";
      valueEl.textContent = sel ? sel.textContent : "";
      trigger.classList.toggle("is-placeholder", empty);
      trigger.disabled = select.disabled;
      const name = accessibleName(select);
      trigger.setAttribute("aria-label", empty ? name : `${name}: ${sel.textContent}`);
    };

    const setActive = (i) => {
      const items = [...panel.children];
      if (!items.length) return;
      active = Math.max(0, Math.min(i, items.length - 1));
      items.forEach((li, j) => li.classList.toggle("is-active", j === active));
      trigger.setAttribute("aria-activedescendant", items[active].id);
      items[active].scrollIntoView({ block: "nearest" });
    };

    const render = () => {
      panel.innerHTML = options().map((o, i) =>
        `<li role="option" id="${id}-o${i}" data-value="${esc(o.value)}" aria-selected="${o.selected}">${esc(o.textContent)}</li>`
      ).join("");
    };

    const choose = (i) => {
      const o = options()[i];
      if (!o) return;
      const changed = select.value !== o.value;
      select.value = o.value;
      refresh();
      api.close();
      trigger.focus();
      if (changed) select.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const api = {
      wrap,
      open() {
        if (select.disabled) return;
        closeOpen();
        render();
        panel.hidden = false;
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        place(wrap, panel);
        const cur = options().findIndex((o) => o.selected && o.value !== "");
        setActive(cur < 0 ? 0 : cur);
        openInstance = api;
      },
      close() {
        panel.hidden = true;
        wrap.classList.remove("is-open", "dd-up");
        trigger.setAttribute("aria-expanded", "false");
        trigger.removeAttribute("aria-activedescendant");
        if (openInstance === api) openInstance = null;
      },
    };

    trigger.addEventListener("click", () => (wrap.classList.contains("is-open") ? api.close() : api.open()));
    panel.addEventListener("pointerdown", (e) => e.preventDefault());
    panel.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (li) choose([...panel.children].indexOf(li));
    });
    panel.addEventListener("pointermove", (e) => {
      const li = e.target.closest("li");
      if (li) setActive([...panel.children].indexOf(li));
    });

    trigger.addEventListener("keydown", (e) => {
      const isOpen = wrap.classList.contains("is-open");
      const n = panel.children.length;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) api.open();
          else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
          return;
        case "Home": case "End":
          if (isOpen) { e.preventDefault(); setActive(e.key === "Home" ? 0 : n - 1); }
          return;
        case "Enter": case " ":
          e.preventDefault();
          if (isOpen) choose(active); else api.open();
          return;
        case "Escape":
          if (isOpen) { e.preventDefault(); api.close(); }
          return;
        case "Tab":
          if (isOpen) api.close();
          return;
      }
      // Escribir letras salta a la opción que empieza así
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        clearTimeout(typedTimer);
        typed += norm(e.key);
        typedTimer = setTimeout(() => (typed = ""), 600);
        const i = options().findIndex((o) => norm(o.textContent).startsWith(typed));
        if (i < 0) return;
        if (!isOpen) api.open();
        setActive(i);
      }
    });

    // Validación y etiquetas enfocan el <select>; se pasa el foco al botón
    select.addEventListener("focus", () => trigger.focus());
    select.addEventListener("change", refresh);
    new MutationObserver(refresh).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    refresh();
  }

  /* ---------- <input list="…"> (autocompletar) ---------- */
  function enhanceCombo(input) {
    const listId = input.getAttribute("list");
    const id = `dd${++uid}`;
    input.removeAttribute("list");
    input.dataset.list = listId;
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", `${id}-list`);

    const wrap = document.createElement("div");
    wrap.className = "dd dd-combo";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    wrap.insertAdjacentHTML("beforeend", CHEVRON);

    const panel = document.createElement("ul");
    panel.className = "dd-panel";
    panel.id = `${id}-list`;
    panel.setAttribute("role", "listbox");
    panel.hidden = true;
    wrap.appendChild(panel);

    let active = -1;
    let shown = [];

    const source = () => {
      const dl = document.getElementById(listId);
      return dl ? [...dl.options].map((o) => ({ value: o.value, label: o.label && o.label !== o.value ? o.label : "" })) : [];
    };

    const setActive = (i) => {
      const items = [...panel.querySelectorAll("[role=option]")];
      if (!items.length) { active = -1; input.removeAttribute("aria-activedescendant"); return; }
      active = Math.max(0, Math.min(i, items.length - 1));
      items.forEach((li, j) => li.classList.toggle("is-active", j === active));
      input.setAttribute("aria-activedescendant", items[active].id);
      items[active].scrollIntoView({ block: "nearest" });
    };

    // filtrar=false muestra toda la lista (al enfocar); true filtra por lo escrito
    const render = (filtrar) => {
      const all = source();
      const q = filtrar ? norm(input.value.trim()) : "";
      let list = all;
      if (q) {
        const starts = [], contains = [];
        all.forEach((o) => {
          const n = norm(o.value);
          if (n.startsWith(q)) starts.push(o);
          else if (n.includes(q) || norm(o.label).includes(q)) contains.push(o);
        });
        list = starts.concat(contains);
      }
      shown = list.slice(0, MAX_ITEMS);
      const current = norm(input.value.trim());
      panel.innerHTML = shown.map((o, i) =>
        `<li role="option" id="${id}-o${i}" aria-selected="${norm(o.value) === current}"><span>${highlight(o.value, q)}</span>${o.label ? `<small>${esc(o.label)}</small>` : ""}</li>`
      ).join("") + (list.length > MAX_ITEMS ? `<li class="dd-more" aria-hidden="true">Sigue escribiendo para ver más resultados</li>` : "");
      return shown.length;
    };

    const api = {
      wrap,
      open(filtrar) {
        if (input.disabled || input.readOnly) return;
        if (!render(filtrar)) { api.close(); return; }
        if (openInstance !== api) closeOpen();
        panel.hidden = false;
        wrap.classList.add("is-open");
        input.setAttribute("aria-expanded", "true");
        place(wrap, panel);
        const cur = shown.findIndex((o) => norm(o.value) === norm(input.value.trim()));
        setActive(filtrar && input.value.trim() ? 0 : Math.max(cur, 0));
        if (cur >= 0 && !filtrar) panel.children[cur].scrollIntoView({ block: "center" });
        openInstance = api;
      },
      close() {
        panel.hidden = true;
        wrap.classList.remove("is-open", "dd-up");
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        if (openInstance === api) openInstance = null;
      },
    };

    const choose = (i) => {
      const o = shown[i];
      if (!o) return;
      input.value = o.value;
      api.close();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    input.addEventListener("focus", () => api.open(false));
    input.addEventListener("click", () => { if (!wrap.classList.contains("is-open")) api.open(false); });
    input.addEventListener("input", (e) => { if (e.isTrusted) api.open(true); });
    input.addEventListener("blur", () => setTimeout(() => { if (!wrap.contains(document.activeElement)) api.close(); }, 0));
    input.addEventListener("keydown", (e) => {
      const isOpen = wrap.classList.contains("is-open");
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) api.open(false);
          else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
          break;
        case "Enter":
          if (isOpen && active >= 0) { e.preventDefault(); choose(active); }
          break;
        case "Escape":
          if (isOpen) { e.preventDefault(); api.close(); }
          break;
        case "Tab":
          if (isOpen) api.close();
          break;
      }
    });
    wrap.querySelector(".dd-chevron").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (wrap.classList.contains("is-open")) api.close();
      else { input.focus(); api.open(false); }
    });
    panel.addEventListener("pointerdown", (e) => e.preventDefault());
    panel.addEventListener("click", (e) => {
      const li = e.target.closest("[role=option]");
      if (li) choose([...panel.querySelectorAll("[role=option]")].indexOf(li));
    });
    panel.addEventListener("pointermove", (e) => {
      const li = e.target.closest("[role=option]");
      if (li) setActive([...panel.querySelectorAll("[role=option]")].indexOf(li));
    });
  }

  window.Dropdown = {
    enhance(root = document) {
      root.querySelectorAll("select:not(.dd-native)").forEach(enhanceSelect);
      root.querySelectorAll("input[list]").forEach(enhanceCombo);
    },
  };
})();
