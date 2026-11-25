import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/storage/db.js';
import { saveVESInterpretation, listVES } from '../src/storage/geophysics.js';

test('VES interpretation save rejects a deleted parent without an unhandled transaction abort', async () => {
  const db = await getDB();
  const orphanId = 'missing-ves-parent-test';
  await assert.rejects(
    saveVESInterpretation(orphanId, { layers: [{ layer: 1, resistivity: 100 }] }),
    /selected raw VES sounding no longer exists/
  );
  assert.equal(await db.get('vesInterpretations', orphanId), undefined);
  assert.deepEqual(await listVES(), []);
});
