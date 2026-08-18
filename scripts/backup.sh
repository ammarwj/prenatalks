#!/usr/bin/env bash
#
# backup.sh — dump database + arsip berkas unggahan.
#
# Pasang di cron:
#   30 2 * * * /opt/prenatalks/scripts/backup.sh >> /var/log/prenatalks-backup.log 2>&1
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.prod.yml"
ENV_FILE="$ROOT/.env"
DEST="${PRENATALKS_BACKUP_DIR:-/var/backups/prenatalks}"
KEEP_DAYS="${PRENATALKS_BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%F-%H%M)"

compose() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

[ -f "$ENV_FILE" ] || { echo "GAGAL: $ENV_FILE tidak ada." >&2; exit 1; }

DB_USERNAME="$(grep '^DB_USERNAME=' "$ENV_FILE" | cut -d= -f2-)"
DB_DATABASE="$(grep '^DB_DATABASE=' "$ENV_FILE" | cut -d= -f2-)"
PROJECT="${COMPOSE_PROJECT_NAME:-prenatalks-prod}"

mkdir -p "$DEST"

echo "==> dump database → $DEST/db-$STAMP.sql.gz"
compose exec -T db pg_dump -U "${DB_USERNAME:-prenatalks}" "${DB_DATABASE:-prenatalks}" | gzip > "$DEST/db-$STAMP.sql.gz"

# Berkas unggahan (cover artikel, thumbnail, foto tim) dan berkas ekspor TIDAK
# ada di dump SQL — mereka hidup di volume api_storage.
echo "==> arsip volume ${PROJECT}_api_storage → $DEST/storage-$STAMP.tar.gz"
docker run --rm \
    -v "${PROJECT}_api_storage:/data:ro" \
    -v "$DEST:/backup" \
    alpine tar czf "/backup/storage-$STAMP.tar.gz" -C /data .

echo "==> membuang arsip lebih tua dari $KEEP_DAYS hari"
find "$DEST" -name 'db-*.sql.gz'      -mtime "+$KEEP_DAYS" -delete
find "$DEST" -name 'storage-*.tar.gz' -mtime "+$KEEP_DAYS" -delete

echo "Backup selesai:"
ls -lh "$DEST/db-$STAMP.sql.gz" "$DEST/storage-$STAMP.tar.gz" | awk '{print "  " $9 "  " $5}'
