const finite = value => value !== '' && value != null && Number.isFinite(Number(value));

function parts(value) {
  if (typeof value === 'number') return [value];
  const raw = String(value).trim();
  if (/[NSEW]/i.test(raw)) throw new Error('Enter numeric coordinate values only; select the hemisphere separately.');
  const text = raw.replace(/[°º'′"″,:;]/g, ' ');
  const values = text.split(/\s+/).filter(Boolean).map(Number);
  if (!values.length || values.some(v => !Number.isFinite(v))) throw new Error('Enter a valid coordinate value.');
  return values;
}

export function coordinateToDecimal(value, format = 'DD', hemisphere = 'N', axis = 'latitude') {
  const limit = axis === 'latitude' ? 90 : 180;
  const hemi = String(hemisphere || (axis === 'latitude' ? 'N' : 'E')).toUpperCase();
  const allowed = axis === 'latitude' ? ['N', 'S'] : ['E', 'W'];
  if (!allowed.includes(hemi)) throw new Error('Choose a valid hemisphere for ' + axis + '.');
  const p = parts(value);
  let magnitude;
  if (format === 'DD') {
    if (p.length !== 1) throw new Error('Decimal Degrees must contain one number.');
    magnitude = Math.abs(p[0]);
    if (p[0] < 0 && !['S', 'W'].includes(hemi)) throw new Error('A negative coordinate conflicts with the selected hemisphere.');
  } else if (format === 'DMS' || format === 'DDM') {
    const expected = format === 'DMS' ? 3 : 2;
    if (p.length !== expected) throw new Error(format + ' requires ' + expected + ' values.');
    const [degrees, minutes, seconds = 0] = p;
    if (!Number.isInteger(degrees) || degrees < 0 || minutes < 0 || seconds < 0 || minutes >= 60 || seconds >= 60) {
      throw new Error('Degrees must be whole, non-negative values; minutes and seconds must be below 60.');
    }
    magnitude = degrees + minutes / 60 + seconds / 3600;
  } else throw new Error('Unsupported coordinate format.');
  if (magnitude > limit) throw new Error(axis + ' must be between 0 and ' + limit + ' degrees.');
  return Number((['S', 'W'].includes(hemi) ? -magnitude : magnitude).toFixed(8));
}

export function decimalToCoordinate(decimal, format = 'DD') {
  const value = Number(decimal);
  if (!Number.isFinite(value) || Math.abs(value) > 180) throw new Error('Coordinate must be a finite value within ±180 degrees.');
  const absolute = Math.abs(value);
  if (format === 'DD') return absolute.toFixed(6);
  if (format === 'DDM') {
    // Round the complete minute count first so 59.99999' carries cleanly.
    const totalMinuteUnits = Math.round(absolute * 60 * 10000);
    const degrees = Math.floor(totalMinuteUnits / 600000);
    const minuteUnits = totalMinuteUnits - degrees * 600000;
    return degrees + '° ' + (minuteUnits / 10000).toFixed(4) + "'";
  }
  if (format === 'DMS') {
    // Work in hundredths of a second to carry rounded 60.00" into minutes/degrees.
    const totalSecondUnits = Math.round(absolute * 3600 * 100);
    const degrees = Math.floor(totalSecondUnits / 360000);
    const remainder = totalSecondUnits - degrees * 360000;
    const minutes = Math.floor(remainder / 6000);
    const seconds = (remainder - minutes * 6000) / 100;
    return degrees + '° ' + minutes + "' " + seconds.toFixed(2) + '"';
  }
  throw new Error('Unsupported coordinate format.');
}

const WGS84_A = 6378137;
const WGS84_E2 = 0.0066943799901413165;
const UTM_K0 = 0.9996;

export function getStandardUTMZone(latitude, longitude) {
  const lat = Number(latitude), lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -80 || lat > 84 || lon < -180 || lon > 180) {
    throw new Error('WGS84 coordinates are outside the supported UTM latitude/longitude range.');
  }
  // Standard six-degree longitude bands, with the official Norway and Svalbard exceptions.
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) return 32;
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) return 31;
    if (lon >= 9 && lon < 21) return 33;
    if (lon >= 21 && lon < 33) return 35;
    if (lon >= 33 && lon < 42) return 37;
  }
  return Math.min(60, Math.max(1, Math.floor((lon + 180) / 6) + 1));
}


export function validateUTMDisplayCRS(latitude, crs) {
  const match = /^UTM Zone ([1-9]|[1-5]\\d|60)([NS]) \\(WGS84\\)$/.exec(String(crs || ''));
  const lat = Number(latitude);
  if (!match || latitude === '' || latitude == null || !Number.isFinite(lat) || lat < -80 || lat > 84) {
    throw new Error('Choose a valid WGS84 UTM zone and latitude within the UTM range.');
  }
  const expectedHemisphere = lat < 0 ? 'S' : 'N';
  if (match[2] !== expectedHemisphere) {
    throw new Error('Selected UTM hemisphere ' + match[2] + ' does not match latitude hemisphere ' + expectedHemisphere + '.');
  }
  return Number(match[1]);
}

export function decimalToUTM(latitude, longitude, requestedZone) {
  const lat = Number(latitude), lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -80 || lat > 84 || lon < -180 || lon > 180) {
    throw new Error('WGS84 coordinates are outside the supported UTM latitude/longitude range.');
  }
  const zone = requestedZone == null ? getStandardUTMZone(lat, lon) : Number(requestedZone);
  if (!Number.isInteger(zone) || zone < 1 || zone > 60) throw new Error('UTM zone must be an integer from 1 to 60.');
  const phi = lat * Math.PI / 180, lambda = lon * Math.PI / 180;
  const lambda0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  const e2p = WGS84_E2 / (1 - WGS84_E2);
  const sin = Math.sin(phi), cos = Math.cos(phi), tan = Math.tan(phi);
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sin * sin);
  const T = tan * tan, C = e2p * cos * cos, A = cos * (lambda - lambda0);
  const M = WGS84_A * ((1 - WGS84_E2 / 4 - 3 * WGS84_E2 ** 2 / 64 - 5 * WGS84_E2 ** 3 / 256) * phi
    - (3 * WGS84_E2 / 8 + 3 * WGS84_E2 ** 2 / 32 + 45 * WGS84_E2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * WGS84_E2 ** 2 / 256 + 45 * WGS84_E2 ** 3 / 1024) * Math.sin(4 * phi)
    - (35 * WGS84_E2 ** 3 / 3072) * Math.sin(6 * phi));
  let easting = UTM_K0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * e2p) * A ** 5 / 120) + 500000;
  let northing = UTM_K0 * (M + N * tan * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * e2p) * A ** 6 / 720));
  if (lat < 0) northing += 10000000;
  return { easting: Number(easting.toFixed(3)), northing: Number(northing.toFixed(3)), zone, hemisphere: lat < 0 ? 'S' : 'N', epsg: (lat < 0 ? 32700 : 32600) + zone, datum: 'WGS84' };
}

export function utmToDecimal(easting, northing, zone, hemisphere = 'N') {
  const e = Number(easting), y0 = Number(northing);
  const x = e - 500000;
  const z = Number(zone), hemi = String(hemisphere).toUpperCase();
  // Standard UTM coordinates use an easting between 100,000 and 900,000 m.
  // Reject out-of-grid values rather than returning plausible-looking but invalid locations.
  if (!Number.isFinite(e) || e < 100000 || e > 900000
    || !Number.isFinite(y0) || y0 < 0 || y0 > 10000000
    || !Number.isInteger(z) || z < 1 || z > 60 || !['N', 'S'].includes(hemi)) {
    throw new Error('Enter valid UTM easting (100,000–900,000 m), northing, zone and hemisphere.');
  }
  const y = y0 - (hemi === 'S' ? 10000000 : 0);
  const e1 = (1 - Math.sqrt(1 - WGS84_E2)) / (1 + Math.sqrt(1 - WGS84_E2));
  const M = y / UTM_K0;
  const mu = M / (WGS84_A * (1 - WGS84_E2 / 4 - 3 * WGS84_E2 ** 2 / 64 - 5 * WGS84_E2 ** 3 / 256));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const e2p = WGS84_E2 / (1 - WGS84_E2);
  const sin = Math.sin(phi1), cos = Math.cos(phi1), tan = Math.tan(phi1);
  const N1 = WGS84_A / Math.sqrt(1 - WGS84_E2 * sin * sin);
  const R1 = WGS84_A * (1 - WGS84_E2) / (1 - WGS84_E2 * sin * sin) ** 1.5;
  const T1 = tan * tan, C1 = e2p * cos * cos, D = x / (N1 * UTM_K0);
  const lat = phi1 - (N1 * tan / R1) * (D ** 2 / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e2p) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * e2p - 3 * C1 ** 2) * D ** 6 / 720);
  const lon0 = ((z - 1) * 6 - 180 + 3) * Math.PI / 180;
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e2p + 24 * T1 ** 2) * D ** 5 / 120) / cos;
  const latitude = lat * 180 / Math.PI;
  const longitude = lon * 180 / Math.PI;
  if (latitude < -80 || latitude > 84 || longitude < -180 || longitude > 180) {
    throw new Error('UTM coordinates resolve outside the supported WGS84 UTM area.');
  }
  return { latitude: Number(latitude.toFixed(8)), longitude: Number(longitude.toFixed(8)), zone: z, hemisphere: hemi, datum: 'WGS84' };
}

export function validateCoordinatePair({ latitude, longitude, format = 'DD', latitudeHemisphere = 'N', longitudeHemisphere = 'E' }) {
  if (latitude === '' || latitude == null || longitude === '' || longitude == null) {
    if ((latitude === '' || latitude == null) && (longitude === '' || longitude == null)) return null;
    throw new Error('Enter both latitude and longitude, or leave both blank.');
  }
  return {
    latitude: coordinateToDecimal(latitude, format, latitudeHemisphere, 'latitude'),
    longitude: coordinateToDecimal(longitude, format, longitudeHemisphere, 'longitude'),
    coordinateFormat: format,
    coordinateOriginal: { latitude: String(latitude), longitude: String(longitude), latitudeHemisphere, longitudeHemisphere }
  };
}


// Convert each entered axis independently so a partially completed location
// remains numerically stable when the user changes DD/DMS/DDM input format.
export function convertCoordinatePairFormat({
  latitude,
  longitude,
  format = 'DD',
  nextFormat,
  latitudeHemisphere = 'N',
  longitudeHemisphere = 'E'
}) {
  if (!['DD', 'DMS', 'DDM'].includes(nextFormat)) {
    throw new Error('Choose DD, DMS or DDM as the coordinate format.');
  }
  const convert = (value, hemisphere, axis) => {
    if (value === '' || value == null) return '';
    const decimal = coordinateToDecimal(value, format, hemisphere, axis);
    return decimalToCoordinate(decimal, nextFormat);
  };
  return {
    format: nextFormat,
    latitude: convert(latitude, latitudeHemisphere, 'latitude'),
    longitude: convert(longitude, longitudeHemisphere, 'longitude')
  };
}
