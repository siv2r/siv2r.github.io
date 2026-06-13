#!/usr/bin/env bash
# Build the /notes/ pages from the Obsidian vault. Mirrors sync-blogs.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null 2>&1 || { echo "node is required"; exit 1; }
[ -d node_modules ] || { echo "run 'npm ci' first"; exit 1; }
node scripts/build-notes.mjs
