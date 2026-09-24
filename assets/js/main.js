/* Billboard MusicRoster — interacciones comunes y del landing */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header y menú ---------- */
  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    $$(".main-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Fold 2: recorrido animado ---------- */
  if ($("#typed")) {
    const cards = $$(".step-card");
    const typed = $("#typed");
    const hit = $("#hit");
    const n1 = $("#notif1");
    const n2 = $("#notif2");
    const query = "salsa · Cali";
    let timers = [];
    let running = false;

    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const setStage = (i) => {
      // etapa 0 y 1 → tarjeta "Haz parte"; 2 → encontrar; 3 → contactar
      const cardIdx = i <= 1 ? 0 : i - 1;
      cards.forEach((c, k) => c.classList.toggle("is-active", k === cardIdx));
    };

    const cycle = () => {
      clear();
      typed.textContent = "";
      hit.classList.remove("hit");
      n1.classList.remove("show");
      n2.classList.remove("show");
      setStage(0);
      at(1500, () => setStage(1));
      at(3000, () => {
        setStage(2);
        [...query].forEach((ch, k) => at(k * 70, () => (typed.textContent += ch)));
      });
      at(4200, () => hit.classList.add("hit"));
      at(5200, () => setStage(3));
      at(5600, () => n1.classList.add("show"));
      at(6600, () => n2.classList.add("show"));
      at(9500, cycle);
    };

    if (reduceMotion) {
      typed.textContent = query;
      hit.classList.add("hit");
      n1.classList.add("show");
      n2.classList.add("show");
    } else {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !running) { running = true; cycle(); }
          else if (!e.isIntersecting && running) { running = false; clear(); }
        });
      }, { threshold: 0.2 }).observe($("#como-funciona"));
    }
  }

  /* ---------- Fold 3: líneas del hub ---------- */
  const hub = $("#hub");
  const hubLines = $("#hub-lines");
  if (hub && hubLines) {
    const drawLines = () => {
      const center = $(".hub-center", hub);
      if (getComputedStyle(hubLines).display === "none") return;
      const hr = hub.getBoundingClientRect();
      const cr = center.getBoundingClientRect();
      const cx = cr.left + cr.width / 2 - hr.left;
      const cy = cr.top + cr.height / 2 - hr.top;
      hubLines.setAttribute("viewBox", `0 0 ${hr.width} ${hr.height}`);
      hubLines.innerHTML = $$(".universe", hub)
        .map((u) => {
          const r = u.getBoundingClientRect();
          const left = r.left - hr.left;
          const x = left < cx ? left + r.width : left;
          const y = r.top - hr.top + r.height / 2;
          return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
        })
        .join("");
    };
    drawLines();
    window.addEventListener("resize", drawLines);
    window.addEventListener("load", drawLines);
  }

  /* ---------- Fold 4: filtros territoriales que se encienden ---------- */
  const chips = $$("#territory-chips li");
  if (chips.length && !reduceMotion) {
    let k = 0;
    setInterval(() => {
      chips.forEach((c, i) => c.classList.toggle("on", i === k));
      k = (k + 1) % chips.length;
    }, 1400);
  }

  /* ---------- Fold 4: mapa de puntos de Colombia ---------- */
  const svg = $("#music-map");
  if (svg) buildMap(svg);

  function buildMap(svg) {
    const G = {
      urbano: ["var(--g-urbano)", "Urbano"],
      salsa: ["var(--g-salsa)", "Salsa"],
      afro: ["var(--g-afro)", "Música afro"],
      vallenato: ["var(--g-vallenato)", "Vallenato"],
      popular: ["var(--g-popular)", "Música popular"],
      electronica: ["var(--g-electronica)", "Electrónica / DJs"],
      pop: ["var(--g-pop)", "Pop"],
      rock: ["var(--g-rock)", "Rock"],
      regional: ["var(--g-regional)", "Músicas regionales"],
    };
    const keys = Object.keys(G);

    // [ciudad, lat, lon, género destacado, peso]
    const cities = [
      ["Barranquilla", 10.96, -74.8, "urbano", 5],
      ["Cartagena", 10.39, -75.51, "afro", 5],
      ["Santa Marta", 11.24, -74.2, "popular", 3],
      ["Valledupar", 10.46, -73.25, "vallenato", 5],
      ["Riohacha", 11.54, -72.91, "vallenato", 2],
      ["Montería", 8.75, -75.88, "regional", 3],
      ["Sincelejo", 9.3, -75.39, "regional", 2],
      ["Apartadó", 7.88, -76.63, "urbano", 2],
      ["Medellín", 6.24, -75.58, "urbano", 8],
      ["Rionegro", 6.15, -75.37, "electronica", 2],
      ["Bucaramanga", 7.12, -73.12, "pop", 4],
      ["Barrancabermeja", 7.07, -73.85, "popular", 2],
      ["Cúcuta", 7.89, -72.51, "popular", 3],
      ["Tunja", 5.54, -73.36, "regional", 2],
      ["Bogotá", 4.71, -74.07, "rock", 10],
      ["Girardot", 4.3, -74.8, "pop", 1],
      ["Manizales", 5.07, -75.52, "rock", 2],
      ["Pereira", 4.81, -75.69, "popular", 3],
      ["Armenia", 4.53, -75.68, "popular", 2],
      ["Ibagué", 4.44, -75.23, "regional", 3],
      ["Neiva", 2.93, -75.28, "regional", 2],
      ["Quibdó", 5.69, -76.66, "afro", 3],
      ["Cali", 3.45, -76.53, "salsa", 8],
      ["Buenaventura", 3.88, -77.03, "afro", 3],
      ["Guapi", 2.57, -77.89, "afro", 2],
      ["Tumaco", 1.8, -78.76, "afro", 2],
      ["Popayán", 2.44, -76.61, "regional", 2],
      ["Pasto", 1.21, -77.28, "regional", 3],
      ["Mocoa", 1.15, -76.65, "regional", 1],
      ["Florencia", 1.61, -75.61, "popular", 1],
      ["Villavicencio", 4.14, -73.63, "regional", 4],
      ["Yopal", 5.34, -72.39, "regional", 2],
      ["Arauca", 7.08, -70.76, "regional", 2],
      ["Puerto Carreño", 6.19, -67.49, "regional", 1],
      ["Inírida", 3.87, -67.92, "regional", 1],
      ["San José del Guaviare", 2.57, -72.64, "popular", 1],
      ["Mitú", 1.25, -70.23, "regional", 1],
      ["Leticia", -4.21, -69.94, "regional", 1],
    ];

    const K = 30;
    const LON0 = -79.6, LAT0 = 12.9, W = (79.6 - 66.7) * K, H = (12.9 + 4.5) * K;
    const px = (lat, lon) => [(lon - LON0) * K, (LAT0 - lat) * K];

    // PRNG determinista para que el mapa sea siempre igual
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const pick = (main) => (rnd() < 0.55 ? main : keys[Math.floor(rnd() * keys.length)]);

    let out = "";

    const regions = [
      ["Caribe", 12.3, -70.4, 34, 0],
      ["Pacífico", 5.6, -78.7, 30, -90],
      ["Andes", 8.7, -74.4, 26, 0],
      ["Llanos", 5.6, -70.9, 34, 0],
      ["Amazonía", 0.1, -72.2, 32, 0],
    ];
    regions.forEach(([name, lat, lon, size, rot]) => {
      const [x, y] = px(lat, lon);
      out += `<text class="region-label" x="${x}" y="${y}" font-size="${size}" text-anchor="middle" transform="rotate(${rot} ${x} ${y})">${name}</text>`;
    });

    // Nube de puntos: muchos proyectos alrededor de cada ciudad
    let dots = "";
    cities.forEach(([, lat, lon, g, w]) => {
      const [cx, cy] = px(lat, lon);
      const n = 6 + w * 7;
      const spread = 10 + w * 3.2;
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * spread;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const s = 1 + rnd() * 1.8;
        dots += `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="${G[pick(g)][0]}" style="transition-delay:${(rnd() * 1.2).toFixed(2)}s"/>`;
      }
    });
    out += `<g>${dots}</g>`;

    // Ciudades destacadas
    out += cities
      .map(([name, lat, lon, g], i) => {
        const [x, y] = px(lat, lon);
        const c = G[g][0];
        return `<g class="city" data-name="${name}" data-genre="${G[g][1]}" tabindex="0">
          <circle class="halo" cx="${x}" cy="${y}" r="4" stroke="${c}" style="--d:${(i * 0.37) % 3}s"/>
          <circle class="core" cx="${x}" cy="${y}" r="4.5" fill="${c}"/>
        </g>`;
      })
      .join("");

    // Recuadro San Andrés y Providencia
    out += `<g class="inset"><rect x="6" y="6" width="74" height="54" rx="6"/><text x="12" y="52">San Andrés</text>
      <g class="city" data-name="San Andrés" data-genre="Música afro · Reggae" tabindex="0">
        <circle class="halo" cx="30" cy="26" r="4" stroke="var(--g-afro)" style="--d:1s"/>
        <circle class="core" cx="30" cy="26" r="4.5" fill="var(--g-afro)"/></g>
      <circle class="dot" cx="42" cy="18" r="2" fill="var(--g-afro)"/><circle class="dot" cx="24" cy="36" r="1.6" fill="var(--g-urbano)"/><circle class="dot" cx="38" cy="32" r="1.4" fill="var(--g-regional)"/></g>`;

    svg.setAttribute("viewBox", `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    svg.innerHTML = out;

    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { svg.classList.add("is-in"); obs.disconnect(); }
    }, { threshold: 0.2 }).observe(svg);

    // Tooltip
    const tip = $("#map-tip");
    const wrap = svg.parentElement;
    const show = (g) => {
      const core = $(".core", g).getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      tip.innerHTML = `<b>${g.dataset.name}</b><span>${g.dataset.genre} y más</span>`;
      tip.style.left = core.left + core.width / 2 - wr.left + "px";
      tip.style.top = core.top - wr.top + "px";
      tip.classList.add("show");
    };
    const hide = () => tip.classList.remove("show");
    $$(".city", svg).forEach((g) => {
      g.addEventListener("mouseenter", () => show(g));
      g.addEventListener("focus", () => show(g));
      g.addEventListener("mouseleave", hide);
      g.addEventListener("blur", hide);
    });
  }

  /* ---------- Fold 5: muro de artistas ---------- */
  const wallA = $("#wall-a");
  const wallB = $("#wall-b");
  if (wallA && wallB) {
    const a = [
      ["Salsa", "Orquesta · Cali", "--g-salsa"],
      ["Champeta", "Solista · Cartagena", "--g-afro", 1],
      ["Urbano", "Solista · Medellín", "--g-urbano"],
      ["Vallenato", "Agrupación · Valledupar", "--g-vallenato"],
      ["Electrónica", "DJ · Bogotá", "--g-electronica"],
      ["Currulao", "Agrupación · Tumaco", "--g-regional"],
      ["Pop", "Dúo · Bucaramanga", "--g-pop"],
    ];
    const b = [
      ["Popular", "Solista · Pereira", "--g-popular"],
      ["Rock", "Banda · Bogotá", "--g-rock", 1],
      ["Llanera", "Agrupación · Villavicencio", "--g-regional"],
      ["Afro", "Colectivo · Quibdó", "--g-afro", 1],
      ["Hip hop", "Solista · Barranquilla", "--g-urbano"],
      ["Andina", "Agrupación · Pasto", "--g-vallenato"],
      ["House", "DJ · Medellín", "--g-electronica"],
    ];
    const tile = ([g, cap, c, dark]) =>
      `<figure class="tile${dark ? " dark-text" : ""}${Math.random() > 0.6 ? " vinyl" : ""}" style="--a:var(${c})"><div class="eq"><i></i><i></i><i></i><i></i></div><span class="tile-genre">${g}</span><figcaption>${cap}</figcaption></figure>`;
    // Se duplica para que el desplazamiento infinito no tenga cortes
    wallA.innerHTML = [...a, ...a].map(tile).join("");
    wallB.innerHTML = [...b, ...b].map(tile).join("");
  }
})();
