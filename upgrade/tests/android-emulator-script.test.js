import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const scriptPath = resolve(process.cwd(), '../../upgrade/scripts/android-emulator-boot-and-smoke-test.sh');
const script = readFileSync(scriptPath, 'utf8');
const smokeScriptPath = resolve(process.cwd(), '../../upgrade/scripts/android-emulator-smoke-test.sh');
const smokeScript = readFileSync(smokeScriptPath, 'utf8');

test('Android emulator ADB startup is bounded', () => {
  assert.match(script, /timeout --foreground 15s "\$ADB" start-server/);
});

test('Android emulator cleanup bounds shutdown and terminates its process group', () => {
  assert.match(script, /timeout --foreground 5s "\$ADB" -s "\$SERIAL" emu kill/);
  assert.match(script, /kill -TERM -- "-\$EMULATOR_PID"/);
  assert.match(script, /for attempt in \$\(seq 1 25\)/);
  assert.match(script, /kill -KILL -- "-\$EMULATOR_PID"/);
  assert.match(script, /kill -KILL "\$EMULATOR_PID"[^\n]*\n\s*wait "\$EMULATOR_PID" 2>\/dev\/null \|\| true/);
  assert.ok(
    script.indexOf('kill -KILL -- "-$EMULATOR_PID"') <
    script.indexOf('wait "$EMULATOR_PID"'),
    'the emulator process is force-terminated before it is reaped'
  );
});

test('Android emulator smoke test captures and validates a PNG screenshot after launch', () => {
  assert.match(smokeScript, /exec-out screencap -p > "\$SCREENSHOT"/);
  assert.match(smokeScript, /stat\(\)\.st_size < 1024/);
  assert.match(smokeScript, /b"\\x89PNG\\r\\n\\x1a\\n"/);
});

test('Android emulator smoke test preserves UI hierarchy when available', () => {
  assert.match(smokeScript, /uiautomator dump \/sdcard\/ndwq-window\.xml/);
  assert.match(smokeScript, /Captured Android UI hierarchy/);
});
