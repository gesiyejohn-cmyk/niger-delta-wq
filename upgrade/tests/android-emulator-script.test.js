import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const scriptPath = resolve(process.cwd(), '../../upgrade/scripts/android-emulator-boot-and-smoke-test.sh');
const script = readFileSync(scriptPath, 'utf8');

test('Android emulator ADB startup is bounded', () => {
  assert.match(script, /timeout --foreground 15s "\$ADB" start-server/);
});

test('Android emulator cleanup bounds shutdown and terminates its process group', () => {
  assert.match(script, /timeout --foreground 5s "\$ADB" -s "\$SERIAL" emu kill/);
  assert.match(script, /kill -TERM -- "-\$EMULATOR_PID"/);
  assert.match(script, /for attempt in \$\(seq 1 25\)/);
  assert.match(script, /kill -KILL -- "-\$EMULATOR_PID"/);
  assert.doesNotMatch(script, /wait "\$EMULATOR_PID"[^\n]*\n\s*fi/);
});
