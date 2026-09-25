# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Billboard MusicRoster: directorio donde los proyectos musicales se registran para que la industria los encuentre. Sitio estático en español (HTML + CSS + JS vanilla), sin backend, sin dependencias y sin paso de build. Todo el texto de la interfaz y los comentarios del código van en español.

## Cómo trabajar

- No hay `package.json`, linter ni tests. Para verlo, abrir los `.html` directamente o servir la carpeta raíz con cualquier servidor estático (p. ej. `npx serve .` o `python -m http.server`).
- Las rutas son relativas: las páginas de `admin/` cargan `../assets/...`.
- Cada archivo JS es un IIFE con `"use strict"` y los helpers locales `$` / `$$` / `esc`. Los módulos se comunican solo por globales en `window` (`Dropdown`, `AdminData`, `MUNICIPIOS_CO`), así que el orden de los `<script>` al final del `<body>` importa.
- Fuentes de Google Fonts (Big Shoulders Display, Hanken Grotesk, Instrument Serif) enlazadas en cada página; el header y el footer están duplicados en cada HTML, así que un cambio de navegación hay que replicarlo en todas.

## Arquitectura

### Sitio público (raíz)
- `index.html` (landing), `registro.html` (cuestionario), `reglamento.html`, `politica-datos.html`, `faq.html`. `buscar.html` y `bmic.html` son marcadores de "próximamente".
- `assets/js/main.js`: comportamiento común (header, menú móvil) y animaciones/mapa del landing. Se carga en todas las páginas públicas.
- `assets/css/styles.css`: tokens de diseño en `:root` (colores `--ink`, `--paper`, `--cta`, un acento `--g-*` por género musical) y todos los componentes públicos.

### Cuestionario de registro (`registro.html` + `assets/js/registro.js`)
- Formulario de 7 pasos (`data-title`), con campos condicionales (`data-show-if`), grupos obligatorios (`data-required-group`) y filas repetibles de integrantes y enlaces.
- Los catálogos (géneros, documentos, roles, plataformas, rangos de contratación, países/regiones) se definen en `registro.js` y se inyectan en el HTML al cargar. `municipios-co.js` es generado desde DIVIPOLA (datos.gov.co): no editar a mano.
- Dos constantes al inicio de `registro.js`: `ENDPOINT` (null → el envío se simula y se genera una referencia `MR-AAAA-XXXXXX`; si se define, hace POST multipart/form-data) y `TEST_MODE` (permite saltar pasos sin validar; debe quedar en `false` antes de publicar).
- `assets/js/dropdown.js` (`Dropdown.enhance(contenedor)`) reemplaza visualmente `<select>` y `<input list>`; el control nativo conserva el valor, así que validación y envío no cambian. Es idempotente: llamarlo de nuevo tras añadir filas dinámicas.

### Panel de administración (`admin/`)
- Solo vistas con datos de prueba; el login acepta cualquier credencial.
- Cada página marca `<body class="adm" data-page="resumen|registros|registro|verificacion|login">` y `assets/js/admin.js` despacha a la función `page*` correspondiente.
- `assets/js/admin-data.js` genera registros ficticios deterministas (semilla) con los mismos campos que envía el cuestionario y los persiste en `localStorage` (`mr-admin-v1`). Expone `window.AdminData` (`all`, `get`, `update`, `setEstado`, `addNote`, `logAccess`, `duplicates`, `reset`, catálogos…). Las vistas solo deben tocar datos a través de esta API: está pensada para reemplazarse por llamadas a una API real cuando se migre a Next.js.
- Estados de un registro: `pendiente`, `correccion`, `aprobado` (publicado), `rechazado`. Cada cambio queda en `historial`; consultar un dato privado (documento) se registra con `logAccess`, como exige la política de datos.
- `assets/css/admin.css` se carga después de `styles.css` y reutiliza sus tokens, botones, `.field` y `.dd`.

## Acoplamientos a mantener

- Los catálogos están duplicados entre `registro.js` y `admin-data.js` (mismos valores clave). Si cambia uno, cambiar el otro.
- El formulario, el reglamento y la política de datos deben describir los mismos datos y las mismas reglas. Decisiones vigentes:
  - Solo mayores de 18 (artista, integrantes y quien diligencia). No se acepta Tarjeta de identidad.
  - **Públicos:** nombres legales completos del solista y de los integrantes, rango de contratación y contacto para contratación (nombre, WhatsApp, correo).
  - **No públicos:** tipo y número de documento, país de expedición y datos de quien diligencia.
- Si cambian los campos de `registro.html`/`registro.js`, revisar en `reglamento.html` los Arts. 9, 25, 26, 28 y 60 y el anexo "Aceptaciones del formulario", y en `politica-datos.html` las secciones 5 y 6.
- Los datos de NGNART (razón social, NIT, dirección, correo, área responsable) y la fecha de vigencia están pendientes y marcados con `<span class="tbd">` en las dos páginas legales. Cuando lleguen, reemplazar todos los `.tbd`.
