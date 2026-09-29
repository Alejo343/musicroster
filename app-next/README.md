# Billboard MusicRoster — app-next

App Next.js (App Router + TypeScript) que reemplaza la simulación en `localStorage` del sitio estático de la raíz del repo por un backend real: Postgres (Prisma), correo transaccional (Resend) para el enlace mágico de compradores y las notificaciones, y sesiones firmadas en cookies httpOnly.

El sitio estático en la raíz del repo sigue intacto y en producción hasta el corte del dominio principal (Fase 9 del plan de migración; ver más abajo). Este proyecto no debe tocarse desde ahí.

## Desarrollo local

Requiere una instancia de Postgres accesible (local o remota) y Node 20+.

```bash
cp .env.example .env   # completar DATABASE_URL, AUTH_SECRET, etc.
npm install
npx prisma migrate deploy   # o `npx prisma migrate dev` si vas a crear una migración nueva
npm run db:seed             # datos de prueba deterministas (equivalentes a admin-data.js)
npm run dev
```

- `npm test` — Vitest (todo lo que no es UI: esquemas Zod, catálogos, lógica de búsqueda/duplicados, rate limiting, etc.).
- `npm run lint` / `npx tsc --noEmit` — antes de cualquier commit.
- `npm run build` — build de producción.

Si `MINIO_ENDPOINT` no está configurado (el caso normal, incluido en producción — ver abajo), las fotos se guardan en `public/uploads/` (ver `src/lib/storage.ts`), servidas directamente por `next start`.

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

Este proyecto (`musicroaster.billboard.com.co`, puerto **3009**) sigue exactamente ese mismo patrón.

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
