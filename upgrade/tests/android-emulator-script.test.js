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
  assert.match(script, /kill -KILL "\$EMULATOR_PID"[^\n]*\n\s*wait "\$EMULATOR_PID" 2>\/dev\/null \|\| true/);
  assert.ok(
    script.indexOf('kill -KILL -- "-$EMULATOR_PID"') <
    script.indexOf('wait "$EMULATOR_PID"'),
    'the emulator process is force-terminated before it is reaped'
  );
});

const workflowPath = resolve(process.cwd(), '../../.github/workflows/upgrade-build.yml');
const workflow = readFileSync(workflowPath, 'utf8');

test('KVM requirement is isolated to the Android CI job', () => {
  const jobsStart = workflow.indexOf('\njobs:\n');
  const androidStart = workflow.indexOf('\n  android:\n', jobsStart);
  const windowsStart = workflow.indexOf('\n  windows-desktop:\n', androidStart);
  assert.notEqual(jobsStart, -1, 'workflow jobs section exists');
  assert.notEqual(androidStart, -1, 'Android job exists');
  assert.notEqual(windowsStart, -1, 'Windows job exists');

  const webJob = workflow.slice(jobsStart, androidStart);
  const androidJob = workflow.slice(androidStart, windowsStart);
  assert.doesNotMatch(webJob, /Enable Android emulator hardware acceleration|\/dev\/kvm/,
    'web tests and web build must not depend on Android emulator hardware');
  assert.match(androidJob, /Enable Android emulator hardware acceleration/);
  assert.match(androidJob, /\/dev\/kvm/);
});
