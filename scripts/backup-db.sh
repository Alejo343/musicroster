#!/usr/bin/env bash
# Respaldo diario de Postgres — pensado para cron en el VPS, junto a docker-compose.yml.
#
# Instalación (una vez, en el VPS, como el usuario que tiene docker compose):
#   crontab -e
#   0 3 * * * /ruta/al/repo/scripts/backup-db.sh >> /var/log/musicroster-backup.log 2>&1
#
# Variables de entorno opcionales:
#   BACKUP_DIR   carpeta donde quedan los .sql.gz (por defecto ./backups junto al repo)
#   RETENCION_DIAS  cuántos días de respaldos conservar (por defecto 14)
set -euo pipefail

DIR_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$DIR_REPO/backups}"
RETENCION_DIAS="${RETENCION_DIAS:-14}"
FECHA="$(date +%Y-%m-%d_%H%M%S)"
ARCHIVO="$BACKUP_DIR/musicroster-$FECHA.sql.gz"

mkdir -p "$BACKUP_DIR"

cd "$DIR_REPO"
# shellcheck disable=SC1091
[ -f app-next/.env ] && set -a && source app-next/.env && set +a

docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-musicroster}" "${POSTGRES_DB:-musicroster}" | gzip > "$ARCHIVO"

echo "Respaldo creado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

# Borra respaldos más viejos que RETENCION_DIAS.
find "$BACKUP_DIR" -name 'musicroster-*.sql.gz' -mtime +"$RETENCION_DIAS" -print -delete
