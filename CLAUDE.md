# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Billboard MusicRoster: directorio donde los proyectos musicales se registran para que la industria los encuentre. Sitio estático en español (HTML + CSS + JS vanilla), sin backend, sin dependencias y sin paso de build. Todo el texto de la interfaz y los comentarios del código van en español.

## Cómo trabajar

- No hay `package.json`, linter ni tests. Para verlo, abrir los `.html` directamente o servir la carpeta raíz con cualquier servidor estático (p. ej. `npx serve .` o `python -m http.server`).
- Las rutas son relativas: las páginas de `admin/` cargan `../assets/...`.
- Cada archivo JS es un IIFE con `"use strict"` y los helpers locales `$` / `$$` / `esc`. Los módulos se comunican solo por globales en `window` (`Dropdown`, `AdminData`, `Directorio`, `MUNICIPIOS_CO`), así que el orden de los `<script>` al final del `<body>` importa.
- Fuentes de Google Fonts (Big Shoulders Display, Hanken Grotesk, Instrument Serif) enlazadas en cada página; el header y el footer están duplicados en cada HTML, así que un cambio de navegación hay que replicarlo en todas. El menú está al límite de ancho (pasa a hamburguesa desde 1180 px en `styles.css`): no agregarle ítems sin revisar ese punto de corte.

## Arquitectura

### Sitio público (raíz)
- `index.html` (landing), `registro.html` (cuestionario), `reglamento.html`, `politica-datos.html`, `faq.html`. `bmic.html` es un marcador de "próximamente".
- `assets/js/main.js`: comportamiento común (header, menú móvil) y animaciones/mapa del landing. Se carga en todas las páginas públicas.
- `assets/css/styles.css`: tokens de diseño en `:root` (colores `--ink`, `--paper`, `--cta`, un acento `--g-*` por género musical) y todos los componentes públicos.

### Cuestionario de registro (`registro.html` + `assets/js/registro.js`)
- Formulario de 7 pasos (`data-title`), con campos condicionales (`data-show-if`), grupos obligatorios (`data-required-group`) y filas repetibles de integrantes y enlaces.
- Los catálogos (géneros, documentos, roles, plataformas, rangos de contratación, países/regiones) se definen en `registro.js` y se inyectan en el HTML al cargar. `municipios-co.js` es generado desde DIVIPOLA (datos.gov.co): no editar a mano.
- Dos constantes al inicio de `registro.js`: `ENDPOINT` (null → el envío se simula y se genera una referencia `MR-AAAA-XXXXXX`; si se define, hace POST multipart/form-data) y `TEST_MODE` (permite saltar pasos sin validar; debe quedar en `false` antes de publicar).
- `assets/js/dropdown.js` (`Dropdown.enhance(contenedor)`) reemplaza visualmente `<select>` y `<input list>`; el control nativo conserva el valor, así que validación y envío no cambian. Es idempotente: llamarlo de nuevo tras añadir filas dinámicas.

### Para quienes contratan (`contratar.html`, `acceso.html`, `buscar.html`, `artista.html`, `solicitud.html`)
- `contratar.html`: landing para compradores. `buscar.html`: directorio con filtros (tipo, género, territorio por residencia u origen, presupuesto) sincronizados con la URL. `artista.html?id=MR-…`: perfil público. `solicitud.html`: una solicitud de contratación dirigida a uno o varios proyectos (`?id=` agrega ese proyecto).
- Cargan `admin-data.js` → `directorio.js` → (`dropdown.js`) → `contratar.js`, que despacha según `<body data-page="contratar|acceso|buscar|artista|solicitud">`.
- `assets/js/directorio.js` expone `window.Directorio`: toma de `AdminData` solo los registros `aprobado` y solo los campos públicos (Reglamento Art. 25). Documentos y datos de quien diligencia nunca deben salir de ahí. Las vistas no tocan `AdminData` directamente.
- La "lista" del comprador vive en `localStorage` (`mr-seleccion-v1`). `ENDPOINT` al inicio de `directorio.js` funciona como en `registro.js`: en null la solicitud se simula (referencia `SC-AAAA-XXXXXX`, guardada en `mr-solicitudes-v1`); si se define, hace POST JSON.
- `acceso.html` (`data-page="acceso"`): cuenta de quienes buscan (crear cuenta / ingresar; `#ingresar` abre esa pestaña). `buscar`, `artista` y `solicitud` exigen sesión: sin ella, `contratar.js` redirige a `acceso.html?volver=<página>` y al ingresar se vuelve ahí. `contratar.html` sigue abierta. La sesión es simulada (`Directorio.sesion`, `localStorage` `mr-comprador-v1`, sin contraseña); con backend, el servidor debe negar el directorio sin sesión. Si cambian los campos de la cuenta, revisar las secciones 3 y 5 de la política de datos.
- Sin fotografía real, las portadas son tipográficas: color de acento del género, iniciales y un punto por integrante.
- Pendiente antes de publicar: estas páginas cargan `admin-data.js` (que contiene datos privados de prueba) solo para tener datos; con backend, `directorio.js` debe consumir una API que entregue únicamente perfiles publicados y campos públicos. Las solicitudes (`mr-solicitudes-v1`) aún no se ven en el panel de administración.

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
  - Los perfiles "públicos" solo los ven usuarios con cuenta de comprador (Reglamento Art. 58, niveles de acceso). Los Arts. 25 y 29 y la sección 6 de la política aún hablan de perfil público sin mencionar la cuenta: revisar con el área legal.
  - Datos de compradores (cuenta y solicitudes): no se publican; los de una solicitud solo se comparten con el contacto de los proyectos a los que se dirige.
- Si cambian los campos de `registro.html`/`registro.js`, revisar en `reglamento.html` los Arts. 9, 25, 26, 28 y 60 y el anexo "Aceptaciones del formulario", y en `politica-datos.html` las secciones 5 y 6.
- Si cambian los campos de `solicitud.html`, revisar el Art. 30 del Reglamento y las secciones 3, 5, 6 y 7 de la política de datos. Si cambia lo que muestra el perfil público (`directorio.js`/`artista.html`), revisar el Art. 25 y la sección 6.
- Los datos de NGNART (razón social, NIT, dirección, correo, área responsable) y la fecha de vigencia están pendientes y marcados con `<span class="tbd">` en las dos páginas legales. Cuando lleguen, reemplazar todos los `.tbd`.
