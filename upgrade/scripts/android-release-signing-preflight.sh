#!/usr/bin/env bash
# Fail-closed preflight only: never builds, installs, or replaces an APK.
# This certificate equality check is valid only for direct APK distribution.
set -euo pipefail
required=(NDWQ_DISTRIBUTION_MODEL ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS NDWQ_EXISTING_APP_CERT_SHA256)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || { echo "Missing required environment variable: $name" >&2; exit 2; }
done
case "$NDWQ_DISTRIBUTION_MODEL" in
  direct-apk) ;;
  play-app-signing)
    echo "This preflight cannot compare a Play upload key with the installed app-signing certificate." >&2
    echo "Verify the upload certificate and Play app-signing certificate separately in Play Console." >&2
    exit 2
    ;;
  *)
    echo "NDWQ_DISTRIBUTION_MODEL must be direct-apk; refusing an unknown signing model." >&2
    exit 2
    ;;
esac
for tool in base64 keytool; do command -v "$tool" >/dev/null 2>&1 || { echo "Missing tool: $tool" >&2; exit 2; }; done
normalize() { printf '%s' "$1" | tr -d ':[:space:]' | tr '[:lower:]' '[:upper:]'; }
expected="$(normalize "$NDWQ_EXISTING_APP_CERT_SHA256")"
[[ "$expected" =~ ^[A-F0-9]{64}$ ]] || { echo "Existing-app certificate must be a SHA-256 fingerprint." >&2; exit 2; }
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
ks="$tmp/direct-apk-signing-key.keystore"
printf '%s' "$ANDROID_KEYSTORE_BASE64" | base64 --decode > "$ks" || { echo "Keystore base64 decoding failed." >&2; exit 2; }
chmod 600 "$ks"
if ! keytool -list -v -keystore "$ks" -storepass:env ANDROID_KEYSTORE_PASSWORD -alias "$ANDROID_KEY_ALIAS" > "$tmp/keytool.txt" 2>&1; then
  echo "Keystore or alias validation failed; check protected CI secrets." >&2; exit 1
fi
raw="$(sed -n 's/^[[:space:]]*SHA256: //p' "$tmp/keytool.txt" | head -n 1)"
actual="$(normalize "$raw")"
[[ "$actual" =~ ^[A-F0-9]{64}$ ]] || { echo "Could not read alias SHA-256 fingerprint." >&2; exit 1; }
if [[ "$actual" != "$expected" ]]; then
  echo "Signing certificate mismatch. Refusing a potentially incompatible update." >&2
  echo "Expected: $expected" >&2
  echo "Provided: $actual" >&2
  exit 1
fi
echo "Direct-APK signing preflight passed: keystore, alias and installed-app certificate match."
echo "No APK was built, installed, replaced or uploaded."
