# Billboard MusicRoster — app-next

App Next.js (App Router + TypeScript) que reemplaza la simulación en `localStorage` del sitio estático de la raíz del repo por un backend real: Postgres (Prisma), correo transaccional (Resend) para el enlace mágico de compradores y las notificaciones, y sesiones firmadas en cookies httpOnly.

El sitio estático en la raíz del repo sigue intacto y en producción hasta el corte del dominio principal (Fase 9 del plan de migración; ver más abajo). Este proyecto no debe tocarse desde ahí.

## Estado actual

**Desplegado y en línea** en `https://musicroaster.billboard.com.co` (VPS, puerto interno 3009, PM2 proceso `musicroaster`). No es todavía el dominio público definitivo del sitio (ver Fase 9 más abajo).

- ✅ Base de datos de producción migrada (Postgres nativo del VPS, rol `musicroaster_app` / DB `musicroaster`).
- ✅ TLS con Let's Encrypt (vía `certbot --webroot`, autorrenovación configurada por certbot).
- ✅ Cuenta admin real creada (`contacto@billboard.com.co`, rol `admin`) — la contraseña se definió directamente por chat con el usuario y no está en ningún archivo del repo; si se pierde, recrearla con el patrón de "Crear/actualizar un admin" abajo.
- ✅ `/var/www/musicroaster` **es ahora un `git clone` real** del repo (no una copia por `tar`, como en el primer despliegue): el primer `git push` del asistente fue bloqueado por su propio clasificador de seguridad, pero el usuario terminó subiendo esos cambios (y varios más, directo al header/landing y BMIC) por su cuenta. El VPS se resincronizó clonando `origin/main` desde cero, conservando el `.env` y `public/uploads/` del despliegue anterior. A partir de ahora "Actualizar tras un cambio" (abajo) funciona tal cual.
- 🟡 `RESEND_API_KEY` configurada y funcionando, pero **el remitente sigue en `onboarding@resend.dev`** (temporal) porque el dominio `billboard.com.co` está en proceso de verificación en Resend. Cuando la verificación termine, cambiar `RESEND_FROM` en el `.env` del VPS a `no-responder@billboard.com.co` (o el que se decida) y `pm2 restart musicroaster`.
- Conocido, no bloqueante: el formulario de `/admin/login` muestra el mismo mensaje genérico ("Correo o contraseña incorrectos") tanto para credenciales inválidas como para un `429` de rate limiting (`lib/rateLimit.ts`, 5 intentos/15 min por correo). Si alguien prueba varias veces seguidas puede confundirse — distinguirlo en el frontend queda pendiente como mejora menor.
- `/var/www/musicroaster.old/` quedó en el VPS como respaldo del despliegue anterior (852M, principalmente `node_modules`) — se puede borrar cuando se confirme que todo sigue estable.

## Desarrollo local

Requiere una instancia de Postgres accesible (local o remota) y Node 20+.

```bash
cp .env.example .env
```

Edita `.env`:
- `DATABASE_URL` → tu Postgres local, p. ej. `postgresql://musicroster:devlocal@127.0.0.1:5432/musicroster?schema=public`.
- Deja `MINIO_*` y `RESEND_API_KEY` vacíos: las fotos caen a `public/uploads/` y los correos (enlace mágico incluido) se imprimen en la consola de `npm run dev` en vez de enviarse — así puedes probar el flujo completo sin credenciales externas.
- `AUTH_SECRET` → cualquier valor largo de prueba, no necesita coincidir con producción.

```bash
npm install
npx prisma migrate deploy   # o `npx prisma migrate dev` si vas a crear una migración nueva
npm run db:seed             # opcional: ~96 registros ficticios deterministas + 2 admins de prueba
                             # (laura@musicroster.dev / oscar@musicroster.dev, clave "cambiar-esta-clave")
npm run dev
```

Abre `http://localhost:3000`. El panel admin queda en `http://localhost:3000/admin/login`.

- `npm test` — Vitest (todo lo que no es UI: esquemas Zod, catálogos, lógica de búsqueda/duplicados, rate limiting, etc.).
- `npm run lint` / `npx tsc --noEmit` — antes de cualquier commit.
- `npm run build` — build de producción.

Si `MINIO_ENDPOINT` no está configurado (el caso normal, incluido en producción — ver abajo), las fotos se guardan en `public/uploads/` (ver `src/lib/storage.ts`), servidas directamente por `next start`.

### Crear/actualizar un admin manualmente

Fuera del seed (que no debe correr contra una base real), para crear o resetear un `AdminUser` puntual:

```bash
ADMIN_EMAIL="correo@ejemplo.co" ADMIN_PASSWORD="clave-real" ADMIN_ROL=admin node -e '
import("@prisma/client").then(async ({ PrismaClient }) => {
  const bcrypt = (await import("bcryptjs")).default;
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  const u = await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: { passwordHash, rol: process.env.ADMIN_ROL },
    create: { email: process.env.ADMIN_EMAIL, passwordHash, rol: process.env.ADMIN_ROL, nombre: "Admin" },
  });
  console.log(`Listo: ${u.email} (${u.rol})`);
  process.exit(0);
});
'
```

## Variables de entorno

Ver `.env.example` para la lista completa. Resumen:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión Prisma a Postgres |
| `MINIO_*` | Opcional — solo si se decide migrar fotos a object storage más adelante; el VPS actual no lo usa |
| `RESEND_API_KEY`, `RESEND_FROM` | Enlace mágico, confirmaciones, avisos de solicitud |
| `AUTH_SECRET` | Firma de sesiones (comprador y admin), vía `jose` |
| `PORT` | Puerto donde escucha `next start`; OpenLiteSpeed hace proxy a él |
| `DOMINIO` | Documentación de qué dominio sirve este despliegue |

`AUTH_SECRET` debe ser un valor aleatorio largo (`openssl rand -base64 48`), distinto entre dev y producción, y nunca commiteado.

## Despliegue en el VPS (PM2 + Postgres nativo + OpenLiteSpeed)

El VPS (`ssh mivps`) no usa Docker Compose para los sitios normales — `docker-compose.yml`, `Dockerfile` y `scripts/backup-db.sh`/`restore-db.sh` en la raíz del repo son de un plan de despliegue anterior, escrito **sin conocer el servidor real**, y no se usan. El patrón real de todos los sitios `*.billboard.com.co` existentes (`bmic`, `canciones`, `market`, `billboard-colombia`) es:

- Proceso Node nativo gestionado con **PM2**.
- **Postgres nativo compartido** del VPS (un rol + base de datos por sitio dentro del mismo cluster).
- **OpenLiteSpeed** como proxy directo (`context / { type proxy; handler <extprocessor> }`) al puerto de la app — sin Nginx/Caddy intermedios.
- Fotos y demás archivos subidos: **disco local**, no S3/MinIO.

Este proyecto (`musicroaster.billboard.com.co`, puerto **3009**) sigue exactamente ese mismo patrón. Los pasos de abajo ya se ejecutaron una vez (ver "Estado actual"); quedan documentados para el próximo despliegue desde cero o como referencia.

### 1. Primer despliegue

```bash
# En el VPS, como root:

# Base de datos (Postgres nativo)
sudo -u postgres psql -c "CREATE ROLE musicroaster_app LOGIN PASSWORD '<clave-generada>';"
sudo -u postgres psql -c "CREATE DATABASE musicroaster OWNER musicroaster_app;"

# Código
git clone https://github.com/Alejo343/musicroster /var/www/musicroaster
cd /var/www/musicroaster/app-next
cp .env.example .env   # completar DATABASE_URL (host 127.0.0.1), AUTH_SECRET, RESEND_*, PORT=3009

npm ci
npx prisma migrate deploy
npm run build

# PM2 (ver ecosystem.config.js de ejemplo abajo)
pm2 start ecosystem.config.js
pm2 save
```

`ecosystem.config.js` (mismo formato que `/var/www/billboard-colombia/backend/ecosystem.config.js`):

```js
module.exports = {
  apps: [{
    name: "musicroaster",
    script: "npm",
    args: "start",
    cwd: "/var/www/musicroaster/app-next",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: { NODE_ENV: "production", PORT: 3009 },
    error_file: "/var/www/musicroaster/logs/err.log",
    out_file: "/var/www/musicroaster/logs/out.log",
    time: true,
  }],
};
```

### 2. Certificado TLS (certbot, igual que los demás sitios)

```bash
certbot certonly --webroot -w /var/www/musicroaster/acme -d musicroaster.billboard.com.co
```

### 3. Vhost de OpenLiteSpeed

En `/usr/local/lsws/conf/httpd_config.conf`, agregar a los listeners `Default` y `Defaultssl`:

```
map                     musicroaster musicroaster.billboard.com.co
```

Y un nuevo `extprocessor`:

```
extprocessor musicroaster_node_proxy {
  type                    proxy
  address                 127.0.0.1:3009
  maxConns                100
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}
```

`/usr/local/lsws/conf/vhosts/musicroaster/vhconf.conf` (mismo esqueleto que `thebarrilmarket.conf`):

```
docRoot                   /var/www/musicroaster/acme
vhDomain                  musicroaster.billboard.com.co

context /.well-known/ {
  location                /var/www/musicroaster/acme/.well-known/
  allowBrowse             1
  addDefaultCharset       off
}

context / {
  type                    proxy
  handler                 musicroaster_node_proxy
  addDefaultCharset       off
}

vhssl  {
  keyFile                 /etc/letsencrypt/live/musicroaster.billboard.com.co/privkey.pem
  certFile                /etc/letsencrypt/live/musicroaster.billboard.com.co/fullchain.pem
  certChain               1
}
```

Recargar OpenLiteSpeed (graceful restart) para aplicar.

### 4. Respaldos

Igual que el resto de sitios: `pg_dump` contra el Postgres nativo (no `docker compose exec`, el `scripts/backup-db.sh` de la raíz asume Docker y no aplica tal cual aquí). Instalar en cron:

```bash
crontab -e
0 3 * * * pg_dump -U musicroaster_app musicroaster | gzip > /var/backups/musicroaster-$(date +\%F).sql.gz
```

### 5. Actualizar tras un cambio

```bash
cd /var/www/musicroaster/app-next
git pull
npm ci
npx prisma migrate deploy   # solo si hay migraciones nuevas
npm run build
pm2 restart musicroaster
```

Las fotos ya subidas quedan en `public/uploads/` (fuera de git, ver `.gitignore`) y no se ven afectadas por `git pull`.

### 6. Verificación post-despliegue

- `pm2 status musicroaster` → `online`, sin reinicios en bucle.
- `curl -s https://musicroaster.billboard.com.co/api/health` → `{"ok":true,"db":"up"}`.
- `curl -I https://musicroaster.billboard.com.co/` → 200, cabeceras de seguridad presentes, certificado válido.
- Flujo de enlace mágico real (revisa que llegue el correo, no el fallback de consola de dev).
- Subida de foto en `/registro` termina en `https://musicroaster.billboard.com.co/uploads/...` y carga correctamente.

## Pendiente para el corte del dominio principal (Fase 9)

Antes de apuntar el dominio público definitivo del sitio (el que hoy sirve el HTML estático) a esta app:

1. **Reemplazar los `.tbd`** de `/reglamento` y `/politica-datos` — requiere que NGNART entregue razón social, NIT, dirección, correo, área responsable y fecha de vigencia. No se inventan.
2. **Decisión legal**: Reglamento Arts. 25/29 (perfil público) vs. Art. 58 (niveles de acceso) — si "público" es sin condición o solo para compradores con cuenta. Ya implementado como "requiere cuenta"; falta la confirmación del área legal para que el texto del Reglamento no quede contradictorio.
3. Haber verificado `musicroaster.billboard.com.co` de forma estable en producción real (sección anterior).
