# Billboard MusicRoster — app-next

App Next.js (App Router + TypeScript) que reemplaza la simulación en `localStorage` del sitio estático de la raíz del repo por un backend real: Postgres (Prisma), MinIO para fotos, correo transaccional (Resend) para el enlace mágico de compradores y las notificaciones, y sesiones firmadas en cookies httpOnly.

El sitio estático en la raíz del repo sigue intacto y en producción hasta el corte (ver abajo). Este proyecto no debe tocarse desde ahí.

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
- `npm run build` — build de producción (`output: "standalone"`).

En dev, si `MINIO_ENDPOINT` no está configurado, las fotos se guardan en `public/uploads/` (ver `src/lib/storage.ts`). En producción siempre debe usarse MinIO.

## Variables de entorno

Ver `.env.example` para la lista completa. Resumen:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión Prisma a Postgres |
| `MINIO_*` | Almacenamiento de fotos de perfil (S3-compatible) |
| `RESEND_API_KEY`, `RESEND_FROM` | Enlace mágico, confirmaciones, avisos de solicitud |
| `AUTH_SECRET` | Firma de sesiones (comprador y admin), vía `jose` |
| `DOMINIO`, `DOMINIO_ARCHIVOS` | Documentación de qué dominio apunta a qué servicio en OpenLiteSpeed |

`AUTH_SECRET` debe ser un valor aleatorio largo (`openssl rand -base64 48`), distinto entre dev y producción, y nunca commiteado.

## Despliegue en el VPS (Docker Compose + OpenLiteSpeed)

El VPS ya corre **OpenLiteSpeed** como servidor/proxy con TLS. `docker-compose.yml` (en la raíz del repo) levanta `app`, `postgres` y `minio`, todos publicados **solo en `127.0.0.1`** — OLS es lo único que los expone al público.

### 1. Primer despliegue

```bash
git clone <repo> && cd musicroster
cp app-next/.env.example app-next/.env   # completar con los valores reales de producción
docker compose up --build -d
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed   # opcional: solo si quieres datos de prueba, normalmente NO en prod
```

### 2. Configurar OpenLiteSpeed

Para la app (`DOMINIO`, p. ej. `musicroster.tudominio.co`):
1. **External App** (tipo *Web Server*) apuntando a `localhost:3000`.
2. **Context** `/` en el vhost del dominio, `Type: Proxy`, apuntando a ese External App.
3. Certificado TLS del dominio vía el panel de OLS (LiteSpeed/Let's Encrypt integrado).

Repetir lo mismo para MinIO (`DOMINIO_ARCHIVOS`, p. ej. `archivos.tudominio.co`) apuntando a `localhost:9000`. `MINIO_PUBLIC_URL` en `.env` debe coincidir con ese dominio: es la URL que queda guardada en Postgres para cada foto, así que si se define mal las fotos ya guardadas quedan rotas.

### 3. Respaldos

`scripts/backup-db.sh` (raíz del repo) hace `pg_dump` + gzip, con retención de 14 días. Instalar en cron del VPS:

```
crontab -e
0 3 * * * /ruta/al/repo/scripts/backup-db.sh >> /var/log/musicroster-backup.log 2>&1
```

`scripts/restore-db.sh backups/archivo.sql.gz` para restaurar (pide confirmación explícita).

### 4. Actualizar tras un cambio

```bash
git pull
docker compose up --build -d
docker compose exec app npx prisma migrate deploy   # solo si hay migraciones nuevas
```

### 5. Verificación post-despliegue

- `curl -s https://<DOMINIO>/api/health` → `{"ok":true,"db":"up"}`.
- Cabeceras de seguridad presentes (`curl -I`).
- Flujo de enlace mágico real (revisa que llegue el correo, no el fallback de consola de dev).
- Subida de foto en `/registro` termina en una URL de `DOMINIO_ARCHIVOS`, no en `localhost`.

## Pendiente para el corte final (Fase 8)

Antes de apuntar el dominio principal del sitio (el que hoy sirve el HTML estático) a esta app:

1. **Reemplazar los `.tbd`** de `/reglamento` y `/politica-datos` — requiere que NGNART entregue razón social, NIT, dirección, correo, área responsable y fecha de vigencia. No se inventan.
2. **Decisión legal**: Reglamento Arts. 25/29 (perfil público) vs. Art. 58 (niveles de acceso) — si "público" es sin condición o solo para compradores con cuenta. Ya implementado como "requiere cuenta"; falta la confirmación del área legal para que el texto del Reglamento no quede contradictorio.
3. Confirmar en producción real (no local): enlace mágico, export CSV completo bloqueado para rol `moderador`, rate limiting, `/api/health`, respaldo real y una restauración de prueba.
4. Cuando todo lo anterior esté confirmado: cambiar el DNS/vhost del dominio principal de OLS para que apunte al External App de esta app en vez de servir los `.html` estáticos de la raíz del repo.
