#!/usr/bin/env bash
set -euo pipefail

APK="source/niger-delta-wq/android/app/build/outputs/apk/debug/app-debug.apk"

adb_bounded() {
  local seconds="$1"
  shift
  timeout --foreground "${seconds}s" adb "$@"
}

if [ ! -f "$APK" ]; then
  echo "Expected debug APK was not found: $APK"
  exit 1
fi

AAPT2="$(find "$ANDROID_HOME/build-tools" -type f -name aapt2 -perm -u+x | sort -V | tail -n 1)"
if [ -z "$AAPT2" ]; then
  echo "Android build-tools aapt2 executable was not found."
  find "$ANDROID_HOME/build-tools" -maxdepth 2 -type f -name 'aapt*' -print
  exit 1
fi

BADGING="$("$AAPT2" dump badging "$APK")"
APP_ID="$(printf '%s\n' "$BADGING" | grep "^package: name=" | head -n 1 | cut -d "'" -f 2)"
LAUNCHER_ACTIVITY="$(printf '%s\n' "$BADGING" | grep "^launchable-activity: name=" | head -n 1 | cut -d "'" -f 2)"
printf '%s\n' "$BADGING"
test -n "$APP_ID"
test -n "$LAUNCHER_ACTIVITY"
echo "APK application ID: $APP_ID"
echo "APK launcher activity: $LAUNCHER_ACTIVITY"

# Emulator startup is handled by android-emulator-runner. Allow realistic
# transfer/install/startup time rather than applying one 10-second limit.
adb_bounded 30 wait-for-device
adb_bounded 120 install "$APK"
adb_bounded 45 shell am start -W -n "$APP_ID/$LAUNCHER_ACTIVITY"

APP_PID=""
RESUMED_ACTIVITY=""
for attempt in $(seq 1 30); do
  APP_PID="$(adb_bounded 15 shell pidof "$APP_ID" 2>/dev/null | tr -d '\r' || true)"
  RESUMED_ACTIVITY="$(adb_bounded 15 shell dumpsys activity activities 2>/dev/null | grep -E 'mResumedActivity|topResumedActivity' | grep -F "$APP_ID" | tail -n 1 || true)"
  if [ -n "$APP_PID" ] && [ -n "$RESUMED_ACTIVITY" ]; then
    break
  fi
  sleep 1
done

if [ -z "$APP_PID" ] || [ -z "$RESUMED_ACTIVITY" ]; then
  echo "Android launch smoke-test failed: app process or resumed launcher activity not observed."
  adb_bounded 20 shell dumpsys activity activities 2>&1 | tail -n 100 || true
  adb_bounded 20 logcat -d -t 500 2>&1 | tail -n 200 || true
  exit 1
fi

echo "Android app process: $APP_PID"
echo "Android resumed activity: $RESUMED_ACTIVITY"
