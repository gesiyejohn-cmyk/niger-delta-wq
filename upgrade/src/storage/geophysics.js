import { validateERTMeasurements } from '../engine/ertAcquisition.js';
import { getDB } from './db.js';

const makeId = () => globalThis.crypto?.randomUUID?.() || `geo_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export async function saveVES(record) {
  const db = await getDB();
  const { interpretation, ...rawRecord } = record;
  const saved = { ...rawRecord, id: record.id || makeId(), createdAt: record.createdAt || new Date().toISOString() };
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  await tx.objectStore('ves').put(saved);
  if (interpretation) await tx.objectStore('vesInterpretations').put({ ...interpretation, id: saved.id, vesId: saved.id });
  await tx.done;
  return saved;
}

export async function listVES() {
  const db = await getDB();
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  const rawRecords = await tx.objectStore('ves').getAll();
  const interpretations = tx.objectStore('vesInterpretations');
  // One-time, non-destructive migration of earlier records that stored the
  // interpretation object inside the raw VES record.
  for (const record of rawRecords) {
    if (record.interpretation) {
      await interpretations.put({ ...record.interpretation, id: record.id, vesId: record.id });
      delete record.interpretation;
      await tx.objectStore('ves').put(record);
    }
  }
  const savedInterpretations = await interpretations.getAll();
  await tx.done;
  const byVesId = new Map(savedInterpretations.map(item => [item.vesId || item.id, item]));
  return rawRecords.map(record => ({ ...record, interpretation: byVesId.get(record.id) || null }));
}

export async function deleteVES(id) {
  const db = await getDB();
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  await tx.objectStore('ves').delete(id);
  await tx.objectStore('vesInterpretations').delete(id);
  await tx.done;
}

export async function saveVESInterpretation(vesId, interpretation) {
  const db = await getDB();
  const tx = db.transaction(['ves', 'vesInterpretations'], 'readwrite');
  const raw = await tx.objectStore('ves').get(vesId);
  if (!raw) {
    tx.abort();
    throw new Error('The selected raw VES sounding no longer exists.');
  }
  await tx.objectStore('vesInterpretations').put({
    ...interpretation,
    id: vesId,
    vesId
  });
  await tx.done;
  return interpretation;
}

export async function saveERT(record) {
  const db = await getDB();
  const id = record.id || makeId();
  const { sourceImport, ...model } = record;
  const saved = { ...model, id, createdAt: record.createdAt || new Date().toISOString() };
  const tx = db.transaction(['ert', 'ertSource'], 'readwrite');
  if (sourceImport?.content != null) {
    await tx.objectStore('ertSource').put({
      id,
      fileName: sourceImport.fileName || 'imported-ert-model.csv',
      content: sourceImport.content,
      contentType: 'text/csv',
      importedAt: sourceImport.importedAt || new Date().toISOString()
    });
    saved.sourceImportId = id;
  }
  await tx.objectStore('ert').put(saved);
  await tx.done;
  return saved;
}
async function migrateLegacyERTSourceImports(db) {
  const tx = db.transaction(['ert', 'ertSource'], 'readwrite');
  const transactionDone = tx.done;
  transactionDone.catch(() => {});
  const models = await tx.objectStore('ert').getAll();
  const modelStore = tx.objectStore('ert');
  const sourceStore = tx.objectStore('ertSource');

  try {
    for (const model of models) {
      const legacySource = model.sourceImport;
      if (!legacySource || typeof legacySource !== 'object' || legacySource.content == null) continue;

      const existingSource = await sourceStore.get(model.id);
      if (existingSource && existingSource.content !== legacySource.content) {
        throw new Error(`ERT record ${model.id} already has a different separately stored source file.`);
      }

      if (!existingSource) {
        const sourceMetadata = { ...legacySource };
        delete sourceMetadata.id;
        await sourceStore.put({
          ...sourceMetadata,
          id: model.id,
          fileName: sourceMetadata.fileName || 'imported-ert-model.csv',
          contentType: sourceMetadata.contentType || 'text/csv',
          ...(!sourceMetadata.importedAt && model.createdAt ? { importedAt: model.createdAt } : {})
        });
      }

      const normalizedModel = { ...model };
      delete normalizedModel.sourceImport;
      normalizedModel.sourceImportId = model.id;
      await modelStore.put(normalizedModel);
    }
    await transactionDone;
  } catch (error) {
    try { tx.abort(); } catch { /* transaction may already be closed */ }
    await transactionDone.catch(() => {});
    throw new Error('ERT source migration was not completed: ' + error.message);
  }
}

export async function listERT() {
  const db = await getDB();
  await migrateLegacyERTSourceImports(db);
  return db.getAll('ert');
}

export async function getERTSource(id) {
  const db = await getDB();
  await migrateLegacyERTSourceImports(db);
  return db.get('ertSource', id);
}
export async function deleteERT(id) {
  const db = await getDB();
  const tx = db.transaction(['ert', 'ertSource'], 'readwrite');
  await tx.objectStore('ert').delete(id);
  await tx.objectStore('ertSource').delete(id);
  await tx.done;
}

export async function saveERTFieldReadings(surveyId, readings) {
  if (typeof surveyId !== 'string' || !surveyId.trim()) {
    throw new Error('An ERT survey/line ID is required for field readings.');
  }
  const validated = validateERTMeasurements(readings);
  const db = await getDB();
  const saved = validated.map(reading => ({
    ...reading,
    id: makeId(),
    surveyId: surveyId.trim(),
    recordedAt: reading.recordedAt || new Date().toISOString()
  }));
  const tx = db.transaction('ertFieldReadings', 'readwrite');
  for (const record of saved) await tx.store.add(record);
  await tx.done;
  return saved;
}

export async function listERTFieldReadings(surveyId) {
  const db = await getDB();
  const records = await db.getAll('ertFieldReadings');
  return surveyId == null ? records : records.filter(record => record.surveyId === surveyId);
}

export async function deleteERTFieldReadings(surveyId) {
  if (typeof surveyId !== 'string' || !surveyId.trim()) {
    throw new Error('An ERT survey/line ID is required.');
  }
  const db = await getDB();
  const tx = db.transaction('ertFieldReadings', 'readwrite');
  const records = await tx.store.getAll();
  for (const record of records) {
    if (record.surveyId === surveyId) await tx.store.delete(record.id);
  }
  await tx.done;
}
