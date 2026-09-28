#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

compose ps
load_env
curl --fail --silent "http://localhost:${BACKEND_HOST_PORT}/api/health"
printf '\n'
