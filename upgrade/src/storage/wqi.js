import { getDB } from './db.js';

const makeId = () => globalThis.crypto?.randomUUID?.()
  || 'wqi_' + Date.now() + '_' + Math.random().toString(36).slice(2);

/** Save a point-in-time WQI snapshot; an existing assessment ID is never overwritten. */
export async function saveWQIAssessment(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('A WQI assessment snapshot is required.');
  }
  if (!record.sample || record.sample.id == null) {
    throw new Error('The assessment must identify its source sample.');
  }
  if (!record.result || !Number.isFinite(record.result.wqi)
    || !Array.isArray(record.result.details)) {
    throw new Error('The assessment must contain a valid calculated WQI result.');
  }
  if (!Array.isArray(record.measurements) || !record.measurements.length) {
    throw new Error('The assessment must retain its measurement and standard inputs.');
  }
  if (typeof record.standardSource !== 'string' || !record.standardSource.trim()) {
    throw new Error('The assessment must retain its standard or guideline reference.');
  }
  const saved = {
    ...record,
    id: record.id || makeId(),
    createdAt: record.createdAt || new Date().toISOString(),
    schemaVersion: 1
  };
  await (await getDB()).add('wqiAssessments', saved);
  return saved;
}

export async function listWQIAssessments() {
  const records = await (await getDB()).getAll('wqiAssessments');
  return records.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function deleteWQIAssessment(id) {
  return (await getDB()).delete('wqiAssessments', id);
}
