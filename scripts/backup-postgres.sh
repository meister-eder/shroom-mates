#!/bin/sh
# Postgres backup script — designed to run via cron on the Hetzner host
# Usage: 0 3 * * * /opt/shroom-mates/scripts/backup-postgres.sh
#
# Keeps 7 daily backups with automatic rotation.

set -eu

BACKUP_DIR="${BACKUP_DIR:-/opt/shroom-mates/backups/postgres}"
CONTAINER_NAME="${CONTAINER_NAME:-shroom-mates-postgres-1}"
POSTGRES_USER="${POSTGRES_USER:-medusa}"
POSTGRES_DB="${POSTGRES_DB:-shroom-mates}"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="pg_dump_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup of ${POSTGRES_DB}..."

docker exec "$CONTAINER_NAME" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup written to ${BACKUP_DIR}/${FILENAME}"

# Rotate old backups
find "$BACKUP_DIR" -name "pg_dump_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[$(date)] Cleanup complete. Backups older than ${RETENTION_DAYS} days removed."
