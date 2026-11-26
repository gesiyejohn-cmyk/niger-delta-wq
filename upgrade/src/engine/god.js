/**
 * Classical GOD intrinsic aquifer-vulnerability index.
 *
 * Factor values are entered by the investigator from the documented
 * hydrogeological classification; this calculator does not infer them from
 * geophysics or water chemistry.
 * Reference: Foster et al. (2002), Groundwater Quality Protection,
 * World Bank, Technical Guide B1, Figure 1.2, pp. 22–23.
 */
export const GOD_FACTORS = [
  { key: 'g', label: 'G — Groundwater confinement', min: 0, max: 1, description: 'Hydraulic confinement / groundwater occurrence rating.' },
  { key: 'o', label: 'O — Overlying strata', min: 0.4, max: 1, description: 'Lithology and consolidation of the vadose zone or confining beds.' },
  { key: 'd', label: 'D — Depth to groundwater / strike', min: 0.6, max: 1, description: 'Depth to water table in an unconfined aquifer, or first major groundwater strike in a confined aquifer.' }
];

function parseFactor(value, factor) {
  const validType = typeof value === 'number'
    || (typeof value === 'string' && /^\\+?(?:\\d+(?:\\.\\d*)?|\\.\\d+)$/.test(value.trim()));
  const parsed = validType ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < factor.min || parsed > factor.max) {
    throw new Error(factor.key.toUpperCase() + ' rating must be a finite number from ' + factor.min + ' to ' + factor.max + '.');
  }
  return parsed;
}

export function classifyGod(index) {
  if (typeof index !== 'number' || !Number.isFinite(index) || index < 0 || index > 1) {
    throw new Error('GOD index must be a number from 0 to 1.');
  }
  if (index < 0.1) return 'Negligible vulnerability';
  if (index < 0.3) return 'Low vulnerability';
  if (index < 0.5) return 'Moderate vulnerability';
  if (index < 0.7) return 'High vulnerability';
  return 'Extreme vulnerability';
}

export function calculateGod(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('Enter the three GOD factor ratings.');
  }
  const g = parseFactor(values.g, GOD_FACTORS[0]);
  const o = parseFactor(values.o, GOD_FACTORS[1]);
  const d = parseFactor(values.d, GOD_FACTORS[2]);
  const index = Number((g * o * d).toFixed(6));
  return {
    method: 'GOD intrinsic aquifer-vulnerability index',
    index,
    classification: classifyGod(index),
    factors: { g, o, d },
    equation: 'G × O × D'
  };
}

const csvCell = value => {
  const text = String(value ?? '');
  const safe = typeof value === 'string' && /^\\s*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
};

export function exportGodCSV(records) {
  if (!Array.isArray(records)) throw new Error('GOD records must be supplied as a list.');
  const headers = ['assessment_id','site_id','created_at','latitude_dd','longitude_dd','coordinate_datum','coordinate_crs','g_rating','o_rating','d_rating','god_index','classification','supporting_notes'];
  const rows = records.filter(record => record?.method === 'GOD intrinsic aquifer-vulnerability index').map(record => {
    const factors = record.factors || {};
    return [
      record.id, record.siteId, record.createdAt, record.latitude, record.longitude,
      record.coordinateDatum, record.coordinateCRS, factors.g, factors.o, factors.d,
      record.index, record.classification, record.notes
    ].map(csvCell).join(',');
  });
  return '\\uFEFF' + [headers.map(csvCell).join(','), ...rows].join('\\r\\n') + '\\r\\n';
}
