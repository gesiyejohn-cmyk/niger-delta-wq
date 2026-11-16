#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK_ROOT" ]; then
  echo "ANDROID_HOME or ANDROID_SDK_ROOT must be set."
  exit 1
fi

AVDMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/avdmanager"
EMULATOR="$SDK_ROOT/emulator/emulator"
ADB="$SDK_ROOT/platform-tools/adb"
SERIAL="emulator-5554"
AVD_NAME="ndwq-ci-api35"
SYSTEM_IMAGE="system-images;android-35;default;x86_64"
AVD_HOME="$HOME/.android/avd"
AVD_PATH="$AVD_HOME/$AVD_NAME.avd"
AVD_LOG="/tmp/ndwq-avd-create.log"
EMULATOR_LOG="/tmp/ndwq-android-emulator.log"

# The workflow installs SDK packages before invoking this script.
for tool in "$AVDMANAGER" "$EMULATOR" "$ADB"; do
  if [ ! -x "$tool" ]; then
    echo "Required Android SDK component was not installed: $tool"
    echo "Check the 'Install Android emulator and API 35 system image' workflow step."
    exit 1
  fi
done

# Pin both the AVD manager and emulator to the same explicit home. This avoids
# silently creating an AVD in one directory while the emulator searches another.
export ANDROID_AVD_HOME="$AVD_HOME"
mkdir -p "$ANDROID_AVD_HOME"
rm -rf "$AVD_PATH" "$AVD_HOME/$AVD_NAME.ini"

if ! printf 'no\n' | "$AVDMANAGER" create avd --force --name "$AVD_NAME" \
  --package "$SYSTEM_IMAGE" --device pixel_2 --path "$AVD_PATH" >"$AVD_LOG" 2>&1; then
  echo "Android AVD creation command failed."
  cat "$AVD_LOG" || true
  "$AVDMANAGER" list avd || true
  exit 1
fi

# Do not start an emulator until both its descriptor and hardware config exist
# and the emulator binary can enumerate the exact requested AVD.
if [ ! -s "$AVD_HOME/$AVD_NAME.ini" ] || [ ! -s "$AVD_PATH/config.ini" ] \
  || ! "$EMULATOR" -list-avds | grep -Fxq "$AVD_NAME"; then
  echo "Android AVD creation returned success but did not produce a discoverable device."
  echo "Expected descriptor: $AVD_HOME/$AVD_NAME.ini"
  echo "Expected config: $AVD_PATH/config.ini"
  cat "$AVD_LOG" || true
  ls -la "$AVD_HOME" "$AVD_PATH" 2>&1 || true
  "$AVDMANAGER" list avd || true
  "$EMULATOR" -list-avds || true
  exit 1
fi
echo "Verified Android AVD '$AVD_NAME' in $ANDROID_AVD_HOME."

"$EMULATOR" -avd "$AVD_NAME" -no-window -no-audio -no-boot-anim \
  -gpu swiftshader_indirect -no-snapshot -no-snapshot-save -no-metrics \
  >"$EMULATOR_LOG" 2>&1 &
EMULATOR_PID=$!

cleanup() {
  timeout --foreground 10s "$ADB" -s "$SERIAL" emu kill >/dev/null 2>&1 || true
  if kill -0 "$EMULATOR_PID" >/dev/null 2>&1; then
    kill "$EMULATOR_PID" >/dev/null 2>&1 || true
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

"$ADB" start-server

# First wait for the emulator to register with ADB. If it never appears, fail
# quickly with the emulator log instead of spending 15 minutes on shell calls
# against a device that does not exist.
DEVICE_DEADLINE=$((SECONDS + 180))
DEVICE_READY=0
while [ "$SECONDS" -lt "$DEVICE_DEADLINE" ]; do
  if ! kill -0 "$EMULATOR_PID" >/dev/null 2>&1; then
    echo "Android emulator process exited before registering with ADB."
    tail -n 200 "$EMULATOR_LOG" || true
    exit 1
  fi
  STATE="$(timeout --foreground 5s "$ADB" -s "$SERIAL" get-state 2>/dev/null | tr -d '\r' || true)"
  if [ "$STATE" = "device" ]; then
    DEVICE_READY=1
    break
  fi
  sleep 3
done

if [ "$DEVICE_READY" -ne 1 ]; then
  echo "Android emulator did not register as $SERIAL with ADB within 3 minutes."
  timeout --foreground 10s "$ADB" devices -l || true
  tail -n 250 "$EMULATOR_LOG" || true
  exit 1
fi

# ADB is now connected. Allow up to 10 minutes for first boot and Android
# framework services, while bounding every individual command.
BOOT_DEADLINE=$((SECONDS + 600))
READY_COUNT=0
while [ "$SECONDS" -lt "$BOOT_DEADLINE" ]; do
  if ! kill -0 "$EMULATOR_PID" >/dev/null 2>&1; then
    echo "Android emulator process exited during system boot."
    tail -n 250 "$EMULATOR_LOG" || true
    exit 1
  fi
  BOOTED="$(timeout --foreground 10s "$ADB" -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  if [ "$BOOTED" = "1" ] \
    && timeout --foreground 15s "$ADB" -s "$SERIAL" shell cmd package list packages >/dev/null 2>&1 \
    && timeout --foreground 10s "$ADB" -s "$SERIAL" shell am get-current-user >/dev/null 2>&1; then
    READY_COUNT=$((READY_COUNT + 1))
    if [ "$READY_COUNT" -ge 3 ]; then
      echo "Android emulator boot and core system services are ready."
      break
    fi
  else
    READY_COUNT=0
  fi
  sleep 3
done

if [ "$READY_COUNT" -lt 3 ]; then
  echo "Android emulator did not become fully responsive within 10 minutes after ADB connection."
  timeout --foreground 10s "$ADB" devices -l || true
  tail -n 250 "$EMULATOR_LOG" || true
  timeout --foreground 15s "$ADB" -s "$SERIAL" logcat -d -t 500 2>&1 | tail -n 200 || true
  exit 1
fi

bash upgrade/scripts/android-emulator-smoke-test.sh
