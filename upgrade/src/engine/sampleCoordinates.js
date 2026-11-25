import {
  decimalToCoordinate,
  validateCoordinatePair,
  validateUTMDisplayCRS,
  WGS84_GEOGRAPHIC_CRS
} from './coordinates.js';

const FORMATS = ['DD', 'DMS', 'DDM'];

function finiteStoredCoordinate(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const number = Number(value.trim());
  return Number.isFinite(number) ? number : null;
}

function inferredHemisphere(value, axis) {
  const number = finiteStoredCoordinate(value);
  if (number == null) return axis === 'latitude' ? 'N' : 'E';
  if (axis === 'latitude') return number < 0 ? 'S' : 'N';
  return number < 0 ? 'W' : 'E';
}

function normalizeDisplayCRS(value) {
  const crs = String(value || 'Geographic (WGS84)').trim();
  if (crs === 'Geographic (WGS84)' || crs.toUpperCase() === 'EPSG:4326') {
    return 'Geographic (WGS84)';
  }

  const epsg = /^EPSG:(326|327)(\d{2})$/i.exec(crs);
  if (epsg) {
    const zone = Number(epsg[2]);
    if (zone >= 1 && zone <= 60) {
      return 'UTM Zone ' + zone + (epsg[1] === '327' ? 'S' : 'N') + ' (WGS84)';
    }
  }

  if (/^UTM Zone (?:[1-9]|[1-5]\d|60)[NS] \(WGS84\)$/i.test(crs)) {
    return crs.replace(/\s+/g, ' ');
  }
  throw new Error('Coordinate display CRS must be Geographic (WGS84) or a supported WGS84 UTM zone.');
}

export function buildSampleCoordinateMetadata(input = {}) {
  const pair = validateCoordinatePair({
    latitude: input.latitude,
    longitude: input.longitude,
    format: input.format || 'DD',
    latitudeHemisphere: input.latitudeHemisphere || 'N',
    longitudeHemisphere: input.longitudeHemisphere || 'E'
  });

  if (!pair) return { latitude: null, longitude: null };

  const datum = String(input.datum || 'WGS84').toUpperCase().replace(/\s+/g, '');
  if (datum !== 'WGS84') {
    throw new Error('Only WGS84 geographic coordinates are currently supported for canonical sample storage.');
  }

  const coordinateCRS = normalizeDisplayCRS(input.crs);
  if (coordinateCRS.startsWith('UTM Zone ')) {
    validateUTMDisplayCRS(pair.latitude, coordinateCRS);
  }

  return {
    ...pair,
    coordinateDatum: 'WGS84',
    coordinateCRS,
    coordinateStorageCRS: WGS84_GEOGRAPHIC_CRS
  };
}

export function sampleCoordinateInputFromRecord(record = {}) {
  const format = FORMATS.includes(record.coordinateFormat) ? record.coordinateFormat : 'DD';
  const original = record.coordinateOriginal && typeof record.coordinateOriginal === 'object'
    ? record.coordinateOriginal
    : null;
  const latitudeNumber = finiteStoredCoordinate(record.latitude);
  const longitudeNumber = finiteStoredCoordinate(record.longitude);

  const latitude = original && original.latitude != null
    ? String(original.latitude)
    : latitudeNumber == null ? '' : decimalToCoordinate(Math.abs(latitudeNumber), format);
  const longitude = original && original.longitude != null
    ? String(original.longitude)
    : longitudeNumber == null ? '' : decimalToCoordinate(Math.abs(longitudeNumber), format);

  return {
    latitude,
    longitude,
    format,
    latitudeHemisphere: original?.latitudeHemisphere || inferredHemisphere(record.latitude, 'latitude'),
    longitudeHemisphere: original?.longitudeHemisphere || inferredHemisphere(record.longitude, 'longitude'),
    datum: record.coordinateDatum || 'WGS84',
    crs: record.coordinateCRS || 'Geographic (WGS84)'
  };
}

export function sampleCoordinateValuesMatchStored(record, coordinates) {
  if (record?.coordinateStorageCRS !== WGS84_GEOGRAPHIC_CRS) return true;
  for (const axis of ['latitude', 'longitude']) {
    const stored = finiteStoredCoordinate(record[axis]);
    if (stored == null || Math.abs(stored - coordinates[axis]) > 1e-7) {
      throw new Error('Stored ' + axis + ' does not match the preserved original coordinate entry. Recheck the sample coordinates before saving.');
    }
  }
  return true;
}
