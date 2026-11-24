import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('full backup export remains available when mobile file download is unavailable', () => {
  const source = readFileSync(new URL('../src/pages/DataBackupPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /setBackupText\(text\)/);
  assert.match(source, /Backup JSON fallback/);
  assert.match(source, /navigator\.clipboard\?\.writeText/);
  assert.match(source, /ndwq-backup-json/);
  assert.match(source, /setSelectionRange\(0, field\.value\.length\)/);
  assert.match(source, /Keep the file private/);
});
