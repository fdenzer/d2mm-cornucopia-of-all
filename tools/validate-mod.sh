#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOD_DIR="$ROOT/solo-cornucopia"

echo "[validate] root: $ROOT"

if [[ ! -f "$MOD_DIR/mod.json" ]]; then
  echo "[validate] missing: $MOD_DIR/mod.json" >&2
  exit 1
fi

if [[ ! -f "$MOD_DIR/mod.js" ]]; then
  echo "[validate] missing: $MOD_DIR/mod.js" >&2
  exit 1
fi

if command -v node >/dev/null 2>&1; then
  echo "[validate] node --check mod.js"
  node --check "$MOD_DIR/mod.js"
  echo "[validate] JSON parse mod.json"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('ok');" "$MOD_DIR/mod.json"
else
  echo "[validate] node not installed; skipping JS/JSON parser checks"
fi

echo "[validate] file layout"
find "$MOD_DIR" -maxdepth 2 -type f | sort
echo "[validate] complete"

