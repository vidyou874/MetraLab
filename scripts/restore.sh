#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 || "$1" != "--confirm" ]]; then
  printf 'Usage: %s --confirm /path/to/backup.dump\n' "$0" >&2
  printf 'Restore is destructive: it replaces the current development database.\n' >&2
  exit 1
fi

BACKUP_FILE="$2"
if [[ ! -f "$BACKUP_FILE" ]]; then
  printf 'Backup file not found: %s\n' "$BACKUP_FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

load_env
compose stop backend
compose exec -T postgres pg_restore \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --clean \
  --if-exists \
  --no-owner \
  < "$BACKUP_FILE"
compose start backend
compose up --wait backend
"$SCRIPT_DIR/migrate.sh"
printf 'Database restored from %s\n' "$BACKUP_FILE"
