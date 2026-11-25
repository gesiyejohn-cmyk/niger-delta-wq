import { getDB } from './db.js';
import { computeDerived } from '../engine/derived.js';
import { computeDualWQI } from '../engine/wqi.js';
import { computeVulnerability } from '../engine/drastic.js';
import { buildSampleCoordinateMetadata, sampleCoordinateValuesMatchStored } from '../engine/sampleCoordinates.js';

const id = () => globalThis.crypto?.randomUUID?.()
  || 'smp_' + Date.now() + '_' + Math.random().toString(36).slice(2);

const COORDINATE_KEYS = [
  'latitude', 'longitude', 'coordinateFormat', 'coordinateOriginal',
  'coordinateDatum', 'coordinateCRS', 'coordinateStorageCRS',
  'latitudeHemisphere', 'longitudeHemisphere'
];

async function loadOverrides(db) {
  return (await db.get('settings', 'guidelineOverrides'))?.value || {};
}

function normalizeSampleMetadata(meta = {}) {
  const {
    latitude,
    longitude,
    coordinateFormat,
    coordinateOriginal,
    coordinateDatum,
    coordinateCRS,
    coordinateStorageCRS,
    latitudeHemisphere,
    longitudeHemisphere,
    ...other
  } = meta;

  const hasOriginal = coordinateOriginal && typeof coordinateOriginal === 'object'
    && !Array.isArray(coordinateOriginal);
  const inputLatitude = hasOriginal ? coordinateOriginal.latitude : latitude;
  const inputLongitude = hasOriginal ? coordinateOriginal.longitude : longitude;
  const format = coordinateFormat || 'DD';
  const normalized = buildSampleCoordinateMetadata({
    latitude: inputLatitude,
    longitude: inputLongitude,
    format,
    latitudeHemisphere: (hasOriginal && coordinateOriginal.latitudeHemisphere)
      || latitudeHemisphere
      || (format === 'DD' && typeof latitude === 'number' && latitude < 0 ? 'S' : undefined),
    longitudeHemisphere: (hasOriginal && coordinateOriginal.longitudeHemisphere)
      || longitudeHemisphere
      || (format === 'DD' && typeof longitude === 'number' && longitude < 0 ? 'W' : undefined),
    datum: coordinateDatum,
    crs: coordinateCRS
  });

  if (hasOriginal && coordinateStorageCRS === 'EPSG:4326'
    && normalized.latitude != null && normalized.longitude != null) {
    sampleCoordinateValuesMatchStored({ latitude, longitude, coordinateStorageCRS }, normalized);
  }
  if (coordinateStorageCRS && coordinateStorageCRS !== 'EPSG:4326') {
    throw new Error('Sample coordinates must use WGS84 geographic storage (EPSG:4326).');
  }

  return { ...other, ...normalized };
}

export async function saveSample({ meta = {}, params = {}, drasticFactors = null, existingId = null }) {
  const db = await getDB();
  const now = new Date().toISOString();
  const normalizedMeta = normalizeSampleMetadata(meta);
  const canonical = {};
  for (const [key, value] of Object.entries(params || {})) {
    canonical[key] = value?.canonical ?? null;
  }

  const overrides = await loadOverrides(db);
  const derived = computeDerived(canonical);
  const wqi = computeDualWQI(canonical, { overrides });
  const vulnerability = drasticFactors
    ? computeVulnerability(drasticFactors, { model: drasticFactors.model })
    : null;
  const prior = existingId ? await db.get('samples', existingId) : null;
  const priorWithoutOldCoordinates = { ...(prior || {}) };
  for (const key of COORDINATE_KEYS) delete priorWithoutOldCoordinates[key];

  const record = {
    ...priorWithoutOldCoordinates,
    ...normalizedMeta,
    id: existingId || id(),
    parameters: params || {},
    derived,
    wqi,
    vulnerability,
    syncStatus: 'pending',
    createdAt: prior?.createdAt || now,
    updatedAt: now
  };

  const tx = db.transaction(['samples', 'syncQueue'], 'readwrite');
  await tx.objectStore('samples').put(record);
  await tx.objectStore('syncQueue').add({
    sampleId: record.id,
    action: existingId ? 'update' : 'create',
    queuedAt: now,
    attempts: 0
  });
  await tx.done;
  return record;
}

export async function getSample(sampleId) {
  return (await getDB()).get('samples', sampleId);
}

export async function listSamples({ search = '', source = '', limit = null } = {}) {
  let rows = await (await getDB()).getAll('samples');
  if (search) {
    const query = search.toLowerCase();
    rows = rows.filter(record =>
      (record.sampleCode || '').toLowerCase().includes(query)
      || (record.stationName || '').toLowerCase().includes(query)
    );
  }
  if (source) rows = rows.filter(record => record.waterSourceType === source);
  rows.sort((a, b) => (b.collectionDate || '').localeCompare(a.collectionDate || ''));
  return limit == null ? rows : rows.slice(0, limit);
}

export async function deleteSample(sampleId) {
  const db = await getDB();
  const tx = db.transaction(['samples', 'syncQueue'], 'readwrite');
  await tx.objectStore('samples').delete(sampleId);
  await tx.objectStore('syncQueue').add({
    sampleId,
    action: 'delete',
    queuedAt: new Date().toISOString(),
    attempts: 0
  });
  await tx.done;
}

export async function recomputeAll() {
  const db = await getDB();
  const overrides = await loadOverrides(db);
  const records = await db.getAll('samples');
  const tx = db.transaction('samples', 'readwrite');
  for (const record of records) {
    const canonical = {};
    for (const [key, entry] of Object.entries(record.parameters || {})) {
      canonical[key] = entry?.canonical ?? null;
    }
    const vulnerability = record.vulnerability?.inputs
      ? computeVulnerability(record.vulnerability.inputs, { model: record.vulnerability.model })
      : record.vulnerability || null;
    await tx.store.put({
      ...record,
      derived: computeDerived(canonical),
      wqi: computeDualWQI(canonical, { overrides }),
      vulnerability,
      updatedAt: new Date().toISOString()
    });
  }
  await tx.done;
  return records.length;
}

export async function backupDatabase() {
  return {
    format: 'niger-delta-wq-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    samples: await listSamples(),
    settings: await (await getDB()).getAll('settings')
  };
}

export async function restoreDatabase(data) {
  if (data?.format !== 'niger-delta-wq-backup' || !Array.isArray(data.samples)) {
    throw new Error('This is not a valid Niger Delta WQ backup file.');
  }
  const db = await getDB();
  const tx = db.transaction(['samples', 'settings'], 'readwrite');
  for (const sample of data.samples) {
    if (sample.id) await tx.objectStore('samples').put(sample);
  }
  for (const setting of data.settings || []) {
    if (setting.key) await tx.objectStore('settings').put(setting);
  }
  await tx.done;
  return data.samples.length;
}
