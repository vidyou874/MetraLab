#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

compose up -d --build
compose up --wait backend
"$SCRIPT_DIR/migrate.sh"
printf 'MetraLab API is ready at http://localhost:%s/docs\n' "$(grep '^BACKEND_HOST_PORT=' "$ENV_FILE" | cut -d= -f2-)"
