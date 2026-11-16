#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK_ROOT" ]; then
  echo "ANDROID_HOME or ANDROID_SDK_ROOT must be set."
  exit 1
fi

SDKMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
AVDMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/avdmanager"
EMULATOR="$SDK_ROOT/emulator/emulator"
SERIAL="emulator-5554"
AVD_NAME="ndwq-ci-api35"

for tool in "$SDKMANAGER" "$AVDMANAGER" "$EMULATOR"; do
  if [ ! -x "$tool" ]; then
    echo "Required Android SDK tool is unavailable: $tool"
    exit 1
  fi
done

yes | "$SDKMANAGER" --licenses >/dev/null
"$SDKMANAGER" --install emulator "system-images;android-35;default;x86_64" >/dev/null
printf 'no\n' | "$AVDMANAGER" create avd --force --name "$AVD_NAME" \
  --package "system-images;android-35;default;x86_64" --device pixel_2

"$EMULATOR" -avd "$AVD_NAME" -no-window -no-audio -no-boot-anim \
  -gpu swiftshader_indirect -no-snapshot -no-snapshot-save -no-metrics \
  > /tmp/ndwq-android-emulator.log 2>&1 &
EMULATOR_PID=$!

cleanup() {
  timeout --foreground 15s adb -s "$SERIAL" emu kill >/dev/null 2>&1 || true
  if kill -0 "$EMULATOR_PID" >/dev/null 2>&1; then
    kill "$EMULATOR_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

adb start-server
BOOT_DEADLINE=$((SECONDS + 900))
READY_COUNT=0
while [ "$SECONDS" -lt "$BOOT_DEADLINE" ]; do
  BOOTED="$(timeout --foreground 20s adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  if [ "$BOOTED" = "1" ] && \
     timeout --foreground 30s adb -s "$SERIAL" shell cmd package list packages >/dev/null 2>&1 && \
     timeout --foreground 20s adb -s "$SERIAL" shell am get-current-user >/dev/null 2>&1; then
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
  echo "Android emulator did not become fully responsive within 15 minutes."
  timeout --foreground 20s adb devices -l || true
  tail -n 200 /tmp/ndwq-android-emulator.log || true
  timeout --foreground 20s adb -s "$SERIAL" logcat -d -t 500 2>&1 | tail -n 200 || true
  exit 1
fi

bash upgrade/scripts/android-emulator-smoke-test.sh
