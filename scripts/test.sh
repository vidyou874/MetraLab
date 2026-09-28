#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
PYTEST_BIN="${PYTEST_BIN:-$BACKEND_DIR/.venv/bin/pytest}"

if [[ ! -x "$PYTEST_BIN" ]]; then
  printf 'Backend development dependencies are missing. Run pip install -e ".[dev]" in backend/.\n' >&2
  exit 1
fi

cd "$BACKEND_DIR"
"$PYTEST_BIN" "$@"
