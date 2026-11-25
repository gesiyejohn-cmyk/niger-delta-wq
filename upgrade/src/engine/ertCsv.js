import Papa from 'papaparse';
import { validateERT } from './geophysics.js';

const COLUMN_ALIASES = {
  x: new Set(['x', 'x_m', 'electrode_x', 'electrode_distance', 'electrode_distance_m', 'distance', 'distance_m']),
  depth: new Set(['depth', 'depth_m', 'z', 'z_m', 'depth_below_surface_m']),
  resistivity: new Set([
    'resistivity', 'resistivity_ohm_m', 'resistivity_ohm_meter',
    'resistivity_ohm_metre', 'apparent_resistivity_ohm_m', 'rho', 'rho_ohm_m'
  ])
};

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function parseERTCSV(sourceText) {
  if (typeof sourceText !== 'string' || !sourceText.trim()) {
    throw new Error('ERT CSV is empty.');
  }
  if (sourceText.length > 10 * 1024 * 1024) {
    throw new Error('ERT CSV is larger than the 10 MB import limit.');
  }

  const parsed = Papa.parse(sourceText, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true
  });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message);
  if (!parsed.data.length || !Array.isArray(parsed.data[0])) {
    throw new Error('ERT CSV must contain a header row and data rows.');
  }

  const headers = parsed.data[0].map(normalizeHeader);
  const indexes = {};
  for (const field of Object.keys(COLUMN_ALIASES)) {
    const matches = headers.reduce((found, header, index) =>
      COLUMN_ALIASES[field].has(header) ? [...found, index] : found, []);
    if (!matches.length) {
      throw new Error(`ERT CSV is missing a required ${field === 'x' ? 'distance (x)' : field} column.`);
    }
    if (matches.length > 1) {
      throw new Error(`ERT CSV has multiple columns matching ${field}; keep only one recognised ${field} column.`);
    }
    indexes[field] = matches[0];
  }

  const rows = parsed.data.slice(1).map((row, rowIndex) => {
    if (!Array.isArray(row)) throw new Error(`ERT CSV row ${rowIndex + 2} is invalid.`);
    return {
      x: row[indexes.x],
      depth: row[indexes.depth],
      resistivity: row[indexes.resistivity]
    };
  });
  return validateERT(rows);
}
