#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

copy_env_if_missing() {
  local example_file="$1"
  local target_file="$2"

  if [[ -f "$target_file" ]]; then
    printf '%s already exists; it was not changed.\n' "$target_file"
  else
    cp "$example_file" "$target_file"
    printf 'Created %s from %s. Replace local example secrets before sharing.\n' "$target_file" "$example_file"
  fi
}

copy_env_if_missing "$ROOT_DIR/infra/.env.example" "$ROOT_DIR/infra/.env"
copy_env_if_missing "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
copy_env_if_missing "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
