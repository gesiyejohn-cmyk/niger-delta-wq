import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openDB } from 'idb';
import { getDB } from '../src/storage/db.js';
import { saveWQIAssessment, listWQIAssessments, deleteWQIAssessment } from '../src/storage/wqi.js';

test('database upgrades from schema v6 to v9 without losing existing records', async () => {
  const legacy = await openDB('niger-delta-wq', 6, {
    upgrade(db) {
      db.createObjectStore('samples', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'key' });
      db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('ves', { keyPath: 'id' });
      db.createObjectStore('vesInterpretations', { keyPath: 'id' });
      db.createObjectStore('ert', { keyPath: 'id' });
      db.createObjectStore('ertSource', { keyPath: 'id' });
      db.createObjectStore('vulnerability', { keyPath: 'id' });
    }
  });
  await legacy.put('samples', { id: 'legacy-v6-sample', sampleCode: 'V6-KEEP' });
  legacy.close();

  const db = await getDB();
  assert.equal(db.version, 9);
  assert.ok(db.objectStoreNames.contains('wqiAssessments'));
  assert.equal((await db.get('samples', 'legacy-v6-sample')).sampleCode, 'V6-KEEP');
  const sampleStore = db.transaction('samples', 'readonly').store;
  assert.ok(sampleStore.indexNames.contains('byCode'));
  assert.ok(sampleStore.indexNames.contains('byDate'));
});

test('WQI assessments save immutable input/result snapshots, list newest first and delete by ID', async () => {
  const db = await getDB();
  const tx = db.transaction(['wqiAssessments'], 'readwrite');
  await tx.objectStore('wqiAssessments').clear();
  await tx.done;

  const snapshot = {
    id: 'wqi-history-1',
    sample: { id: 'sample-1', sampleCode: 'GW-01' },
    standardSource: 'User-entered project reference',
    method: 'Weighted arithmetic WQI',
    measurements: [{
      key: 'tds', label: 'TDS', unit: 'mg/L', measuredValue: 100,
      minStandard: '', maxStandard: '500', ideal: '0', weightStandard: '500'
    }],
    result: {
      wqi: 20, parameterCount: 1, missingExcluded: 0,
      details: [{ key: 'tds', qualityRating: 20, applicableLimit: 500, unitWeight: 1, contribution: 20 }]
    },
    createdAt: '2026-11-15T10:00:00.000Z'
  };
  const saved = await saveWQIAssessment(snapshot);
  snapshot.sample.sampleCode = 'CHANGED';
  snapshot.measurements[0].measuredValue = 999;
  snapshot.result.wqi = 999;

  await saveWQIAssessment({
    ...saved,
    id: 'wqi-history-2',
    sample: { ...saved.sample, sampleCode: 'GW-02' },
    createdAt: '2026-11-16T10:00:00.000Z'
  });
  const records = await listWQIAssessments();
  assert.deepEqual(records.map(item => item.id), ['wqi-history-2', 'wqi-history-1']);
  assert.equal(records[1].sample.sampleCode, 'GW-01');
  assert.equal(records[1].measurements[0].measuredValue, 100);
  assert.equal(records[1].result.wqi, 20);
  assert.equal(records[1].standardSource, 'User-entered project reference');
  await assert.rejects(saveWQIAssessment(saved), error => error?.name === 'ConstraintError');
  await deleteWQIAssessment('wqi-history-1');
  assert.deepEqual((await listWQIAssessments()).map(item => item.id), ['wqi-history-2']);
});

test('WQI storage rejects incomplete or scientifically untraceable snapshots', async () => {
  await assert.rejects(saveWQIAssessment({}), /identify its source sample/);
  await assert.rejects(saveWQIAssessment({
    sample: { id: 'sample-1' },
    standardSource: 'Reference',
    measurements: [{ key: 'tds', measuredValue: 1 }],
    result: { wqi: NaN, details: [] }
  }), /valid calculated WQI result/);
  await assert.rejects(saveWQIAssessment({
    sample: { id: 'sample-1' },
    standardSource: ' ',
    measurements: [{ key: 'tds', measuredValue: 1 }],
    result: { wqi: 10, details: [] }
  }), /standard or guideline reference/);
});
