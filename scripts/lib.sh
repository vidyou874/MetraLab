#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$ROOT_DIR/infra"
COMPOSE_FILE="$INFRA_DIR/docker-compose.yml"
ENV_FILE="$INFRA_DIR/.env"

require_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    printf 'Missing %s. Create it from infra/.env.example.\n' "$ENV_FILE" >&2
    exit 1
  fi
}

compose() {
  require_env_file
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

load_env() {
  require_env_file
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}
