import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getDB } from '../src/storage/db.js';
import {
  saveERTInterpretation,
  getERTInterpretation,
  deleteERTInterpretation,
  deleteERT
} from '../src/storage/geophysics.js';

test('ERT geological interpretations persist by model, reject orphan saves and cascade on model deletion', async () => {
  const db = await getDB();
  const model = {
    id: 'ert-storage-test-01',
    lineId: 'ERT-STORAGE-01',
    cells: [{ x: 0, depth: 0, resistivity: 100 }, { x: 10, depth: 10, resistivity: 80 }]
  };
  await db.put('ert', model);

  const interpretation = {
    schemaVersion: 1,
    ertModelId: model.id,
    lineId: model.lineId,
    xRange: [0, 10],
    depthRange: [0, 10],
    interpretationStatus: 'provisional',
    units: [{ id: 'u1', name: 'Sand', confidence: 'low', evidence: 'Needs borehole confirmation', aquiferPotential: 'possible' }],
    stations: [
      { x: 0, boundaries: [0, 10] },
      { x: 10, boundaries: [0, 10] }
    ]
  };

  const saved = await saveERTInterpretation(model.id, interpretation);
  assert.equal(saved.id, model.id);
  assert.equal(saved.ertModelId, model.id);
  assert.ok(Number.isFinite(Date.parse(saved.updatedAt)));
  assert.deepEqual(await getERTInterpretation(model.id), saved);

  const revised = await saveERTInterpretation(model.id, { ...interpretation, notes: 'Reviewed against field notes' });
  assert.equal(revised.notes, 'Reviewed against field notes');
  assert.equal((await getERTInterpretation(model.id)).notes, 'Reviewed against field notes');

  await assert.rejects(
    saveERTInterpretation('missing-ert-model', interpretation),
    /selected raw ERT model no longer exists/
  );
  assert.equal(await getERTInterpretation('missing-ert-model'), undefined);

  await deleteERTInterpretation(model.id);
  assert.equal(await getERTInterpretation(model.id), undefined);

  await saveERTInterpretation(model.id, interpretation);
  await deleteERT(model.id);
  assert.equal(await db.get('ert', model.id), undefined);
  assert.equal(await getERTInterpretation(model.id), undefined);
});
