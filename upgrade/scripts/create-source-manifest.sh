#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
ARCHIVE="${2:-NDWQ-Source-Compact.zip}"
OUTPUT="${3:-NDWQ-SOURCE-MANIFEST.txt}"

if [[ ! -d "$ROOT/upgrade/src" || ! -d "$ROOT/upgrade/tests" || ! -d "$ROOT/upgrade/scripts" ]]; then
  echo "Expected upgrade/src, upgrade/tests and upgrade/scripts under $ROOT" >&2
  exit 2
fi
if [[ ! -s "$ROOT/$ARCHIVE" ]]; then
  echo "Base source archive is missing or empty: $ROOT/$ARCHIVE" >&2
  exit 2
fi

OVERLAY_COMMIT_VALUE="${OVERLAY_COMMIT:-unknown}"
INTEGRATION_COMMIT_VALUE="${GITHUB_SHA:-unknown}"

{
  echo "Niger Delta WQ integrated source provenance"
  echo "Manifest schema: 2"
  echo "Repository: ${GITHUB_REPOSITORY:-unknown}"
  echo "Workflow run: ${GITHUB_RUN_ID:-local}"
  echo "Workflow attempt: ${GITHUB_RUN_ATTEMPT:-1}"
  echo "Overlay commit: $OVERLAY_COMMIT_VALUE"
  echo "Integration workflow commit: $INTEGRATION_COMMIT_VALUE"
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
grep -q '^Manifest schema: 2$' "$ROOT/$OUTPUT"
grep -q "^Overlay commit: $OVERLAY_COMMIT_VALUE$" "$ROOT/$OUTPUT"
grep -q "^Integration workflow commit: $INTEGRATION_COMMIT_VALUE$" "$ROOT/$OUTPUT"
echo "Created source provenance manifest: $ROOT/$OUTPUT"
