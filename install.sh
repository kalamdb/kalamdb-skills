#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to run the KalamDB skills installer" >&2
  exit 1
fi

exec node "$ROOT_DIR/scripts/install.mjs" "$@"