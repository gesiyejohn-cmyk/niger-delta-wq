#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
ARCHIVE="${2:-NDWQ-Source-Compact.zip}"
OUTPUT="${3:-NDWQ-SOURCE-MANIFEST.txt}"

if [[ ! -d "$ROOT/upgrade/src" || ! -d "$ROOT/upgrade/tests" ]]; then
  echo "Expected upgrade/src and upgrade/tests under $ROOT" >&2
  exit 2
fi
if [[ ! -s "$ROOT/$ARCHIVE" ]]; then
  echo "Base source archive is missing or empty: $ROOT/$ARCHIVE" >&2
  exit 2
fi

{
  echo "Niger Delta WQ integrated source provenance"
  echo "Manifest schema: 2"
  echo "Repository: ${GITHUB_REPOSITORY:-unknown}"
  echo "Workflow run: ${GITHUB_RUN_ID:-local}"
  echo "Workflow attempt: ${GITHUB_RUN_ATTEMPT:-1}"
  echo "Overlay commit: ${OVERLAY_COMMIT:-unknown}"
  echo "Integration workflow commit: ${GITHUB_SHA:-unknown}"
  echo
  echo "Base archive SHA-256:"
  sha256sum "$ROOT/$ARCHIVE"
  echo
  echo "Overlay file SHA-256 (upgrade/src, upgrade/tests, upgrade/scripts):"
  find "$ROOT/upgrade/src" "$ROOT/upgrade/tests" "$ROOT/upgrade/scripts" -type f -print0 \
    | LC_ALL=C sort -z \
    | while IFS= read -r -d '' file; do
        sha256sum "$file"
      done
} > "$ROOT/$OUTPUT"

test -s "$ROOT/$OUTPUT"
echo "Created source provenance manifest: $ROOT/$OUTPUT"
