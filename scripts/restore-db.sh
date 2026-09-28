#!/usr/bin/env bash
# Restaura un respaldo generado por backup-db.sh. Uso:
#   ./scripts/restore-db.sh backups/musicroster-2026-09-28_030000.sql.gz
#
# ADVERTENCIA: esto reemplaza los datos actuales de la base. Úsalo solo cuando
# de verdad quieras volver a ese punto (por ejemplo, tras un incidente).
set -euo pipefail

ARCHIVO="${1:?Uso: restore-db.sh <archivo.sql.gz>}"
DIR_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR_REPO"

# shellcheck disable=SC1091
[ -f app-next/.env ] && set -a && source app-next/.env && set +a

read -r -p "Esto reemplaza los datos actuales de '${POSTGRES_DB:-musicroster}'. ¿Continuar? [escribe 'si']: " CONFIRMA
[ "$CONFIRMA" = "si" ] || { echo "Cancelado."; exit 1; }

gunzip -c "$ARCHIVO" | docker compose exec -T postgres psql -U "${POSTGRES_USER:-musicroster}" "${POSTGRES_DB:-musicroster}"

echo "Restaurado desde $ARCHIVO."
