#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PYTHON_BIN="${PYTHON_BIN:-$BACKEND_DIR/.venv/bin/python}"
RUFF_BIN="${RUFF_BIN:-$BACKEND_DIR/.venv/bin/ruff}"

printf '==> Checking backend...\n'
if [[ ! -x "$PYTHON_BIN" || ! -x "$RUFF_BIN" ]]; then
  printf 'Backend development dependencies are missing. Run pip install -e ".[dev]" in backend/.\n' >&2
  exit 1
fi

cd "$BACKEND_DIR"
"$PYTHON_BIN" -m compileall app tests migrations
"$RUFF_BIN" check app tests migrations
"$RUFF_BIN" format --check app tests migrations

printf '==> Checking frontend...\n'
cd "$FRONTEND_DIR"
if [[ -d "$FRONTEND_DIR/node_modules" ]]; then
  npm run lint
  npm run typecheck
else
  printf 'Frontend node_modules missing. Run npm install in frontend/ to enable frontend checks.\n'
fi

printf 'All checks passed successfully!\n'
