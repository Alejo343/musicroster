/* Billboard MusicRoster — datos del directorio público (quienes contratan)
   Hoy toma los registros publicados de AdminData (datos de prueba) y expone SOLO los campos públicos
   del perfil (Reglamento, Art. 25; Política de datos, sección 6). Documentos y datos de quien diligencia
   nunca salen de aquí. Al migrar a Next.js, este módulo se reemplaza por la API pública: las vistas solo
   usan window.Directorio. */
(function () {
  "use strict";

  /* Cuando exista backend, URL que recibe las solicitudes de contratación (JSON).
     Si queda en null, el envío se simula y se guarda en este navegador. */
  const ENDPOINT = null;

  const A = window.AdminData;
  if (!A) return;

  const KEY_SELECCION = "mr-seleccion-v1";
  const KEY_SOLICITUDES = "mr-solicitudes-v1";

  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const read = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) || def; } catch (e) { return def; } };
  const write = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* sin almacenamiento */ } };

  const RANGO_ORDEN = A.RANGOS.map((r) => r[0]);
  /* Presupuesto máximo del comprador → incluye los rangos que caben completos en él */
  const PRESUPUESTOS = [
    ["0", "Hasta $2 M"], ["1", "Hasta $5 M"], ["2", "Hasta $10 M"], ["3", "Hasta $20 M"], ["4", "Hasta $50 M"], ["5", "Hasta $100 M"],
  ];

  /* ---------- Perfil público ---------- */
  function perfil(rec) {
    const publicado = rec.historial.slice().reverse().find((h) => /public/i.test(h.accion));
    const individual = rec.identidad === "individual";
    return {
      id: rec.id,
      nombre: rec.nombre_proyecto,
      tipo: rec.tipo,
      tipoLabel: rec.tipo === "otro" && rec.otro_descripcion ? rec.otro_descripcion : A.TIPOS[rec.tipo],
      individual,
      genero: rec.genero_principal === "Otro" && rec.otro_genero ? rec.otro_genero : rec.genero_principal,
      otrosGeneros: rec.otros_generos.slice(),
      acento: A.acento(rec.genero_principal),
      nacionalidad: rec.nacionalidad,
      residencia: { pais: rec.pais_residencia, region: rec.region_residencia, ciudad: rec.ciudad_actual },
      origen: { pais: rec.pais_origen, region: rec.region_origen, ciudad: rec.ciudad_origen },
      titular: individual ? rec.nombre_completo : "",
      integrantes: individual ? [] : rec.miembros.map((m, i) => ({
        nombre: m.nombre,
        rol: m.rol === "otro" && m.rol_otro ? m.rol_otro : A.ROLES[m.rol] || "",
        lider: rec.lider === i,
      })),
      musica: [{ plataforma: rec.plataforma_musical, url: rec.enlace_musical }].concat(rec.otros_enlaces).filter((l) => l.url),
      redes: [{ plataforma: rec.red_social_tipo, url: rec.red_social }].concat(rec.otras_redes).filter((l) => l.url),
      rango: rec.rango_contratacion,
      rangoLabel: A.rangoLabel(rec.rango_contratacion),
      rangoIndex: RANGO_ORDEN.indexOf(rec.rango_contratacion),
      contacto: { nombre: rec.contacto_nombre, whatsapp: rec.contacto_whatsapp, email: rec.contacto_email },
      publicado: publicado ? publicado.fecha : rec.creado,
    };
  }

  let cache = null;
  const perfiles = () => (cache = cache || A.all().filter((r) => r.estado === "aprobado").map(perfil));

  /* ---------- Búsqueda ---------- */
  const texto = (p) => norm([p.nombre, p.titular, p.genero, p.residencia.ciudad, p.residencia.region, p.origen.ciudad]
    .concat(p.integrantes.map((m) => m.nombre)).join(" "));

  /* filtros: { q, tipos: [], genero, territorio: "residencia"|"origen", region, presupuesto, segunEvento, orden } */
  function buscar(f = {}) {
    const q = norm(f.q);
    const tope = f.presupuesto === "" || f.presupuesto == null ? null : Number(f.presupuesto);
    const donde = f.territorio === "origen" ? "origen" : "residencia";
    let out = perfiles().filter((p) => {
      if (q && !texto(p).includes(q)) return false;
      if (f.tipos && f.tipos.length && !f.tipos.includes(p.tipo)) return false;
      if (f.genero && p.genero !== f.genero && !p.otrosGeneros.includes(f.genero)) return false;
      if (f.region && p[donde].region !== f.region) return false;
      if (tope != null) {
        if (p.rango === "segun_evento") return f.segunEvento !== false;
        if (p.rangoIndex > tope) return false;
      }
      return true;
    });
    const score = (p) => { const n = norm(p.nombre); return n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2; };
    // "Según el evento" queda al final en ambos sentidos
    const asc = (p) => (p.rango === "segun_evento" ? 99 : p.rangoIndex);
    const desc = (p) => (p.rango === "segun_evento" ? -1 : p.rangoIndex);
    const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
    const orden = {
      recientes: (a, b) => b.publicado.localeCompare(a.publicado),
      nombre: porNombre,
      rango_asc: (a, b) => asc(a) - asc(b) || porNombre(a, b),
      rango_desc: (a, b) => desc(b) - desc(a) || porNombre(a, b),
    }[f.orden] || ((a, b) => b.publicado.localeCompare(a.publicado));
    out = out.slice().sort(orden);
    if (!f.orden || f.orden === "relevancia") {
      if (q) out.sort((a, b) => score(a) - score(b));
      // Primero los que tienen el género como principal, luego los que lo tienen como asociado
      if (f.genero) out.sort((a, b) => (a.genero !== f.genero) - (b.genero !== f.genero));
    }
    return out;
  }

  /* Valores presentes en el directorio, con cuántos proyectos tiene cada uno */
  function conteo(fn) {
    const c = {};
    perfiles().forEach((p) => [].concat(fn(p)).forEach((v) => v && (c[v] = (c[v] || 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  }

  /* Géneros principales con cuántos proyectos los tienen como principal o asociado (lo mismo que filtra buscar) */
  function generos() {
    const principales = new Set(perfiles().map((p) => p.genero));
    return conteo((p) => [...new Set([p.genero].concat(p.otrosGeneros))]).filter(([g]) => principales.has(g));
  }

  function similares(id, n = 4) {
    const base = perfiles().find((p) => p.id === id);
    if (!base) return [];
    const puntos = (p) => (p.acento === base.acento ? 2 : 0) + (p.genero === base.genero ? 2 : 0) + (p.residencia.region === base.residencia.region ? 1 : 0);
    return perfiles().filter((p) => p.id !== id).map((p) => [p, puntos(p)]).filter((x) => x[1] > 0)
      .sort((a, b) => b[1] - a[1] || a[0].nombre.localeCompare(b[0].nombre, "es")).slice(0, n).map((x) => x[0]);
  }

  /* ---------- Selección del comprador (solo en este navegador) ---------- */
  const seleccion = {
    ids: () => read(KEY_SELECCION, []).filter((id) => perfiles().some((p) => p.id === id)),
    has: (id) => seleccion.ids().includes(id),
    add(id) { const s = seleccion.ids(); if (!s.includes(id)) s.push(id); write(KEY_SELECCION, s); emit(); },
    remove(id) { write(KEY_SELECCION, seleccion.ids().filter((x) => x !== id)); emit(); },
    toggle(id) { seleccion.has(id) ? seleccion.remove(id) : seleccion.add(id); return seleccion.has(id); },
    clear() { write(KEY_SELECCION, []); emit(); },
  };
  const emit = () => document.dispatchEvent(new CustomEvent("seleccion:cambio"));
  // Otra pestaña cambió la selección
  window.addEventListener("storage", (e) => e.key === KEY_SELECCION && emit());

  /* ---------- Cuenta de quien busca ----------
     Simulada: guarda los datos de la cuenta (sin contraseña) en este navegador. Con backend, esto pasa a ser
     la sesión real y el servidor debe negar el directorio a quien no la tenga. */
  const KEY_SESION = "mr-comprador-v1";
  const sesion = {
    actual: () => read(KEY_SESION, null),
    iniciar(datos) { write(KEY_SESION, { ...datos, desde: new Date().toISOString() }); },
    cerrar() { try { localStorage.removeItem(KEY_SESION); } catch (e) { /* nada */ } },
  };

  /* ---------- Solicitud de contratación ---------- */
  function referencia() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return `SC-${new Date().getFullYear()}-${s}`;
  }

  async function solicitar(datos) {
    if (ENDPOINT) {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 900));
    const ref = referencia();
    const todas = read(KEY_SOLICITUDES, []);
    todas.push({ ...datos, ref, fecha: new Date().toISOString() });
    write(KEY_SOLICITUDES, todas);
    return { ref };
  }

  window.Directorio = {
    TIPOS: A.TIPOS, RANGOS: A.RANGOS, PLATAFORMAS: A.PLATAFORMAS, PRESUPUESTOS,
    perfiles,
    get: (id) => perfiles().find((p) => p.id === id) || null,
    buscar,
    conteo,
    generos,
    similares,
    seleccion,
    sesion,
    solicitar,
  };
})();
