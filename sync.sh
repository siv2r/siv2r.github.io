#!/usr/bin/env bash
# Sync latest Substack posts into index.html.
# Run after publishing a new post, then review the staged diff and commit manually.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is not installed" >&2
  exit 1
fi

if ! git diff --cached --quiet; then
  echo "error: you have staged changes. Please commit or stash them first." >&2
  exit 1
fi

node scripts/sync-substack.mjs # prints success/failure

if ! git diff --quiet -- index.html; then
  git add index.html
  echo
  echo "Commit with:"
  echo "  git commit -m 'sync substack posts' && git push"
fi
