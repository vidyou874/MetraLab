#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

load_env
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/.local/backups}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/metralab-$(date -u +%Y%m%dT%H%M%SZ).dump"

compose exec -T postgres pg_dump \
  --username "$POSTGRES_USER" \
  --format=custom \
  --file=- \
  "$POSTGRES_DB" > "$BACKUP_FILE"

printf 'Backup written to %s\n' "$BACKUP_FILE"
