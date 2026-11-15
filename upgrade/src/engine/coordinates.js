const finite = value => value !== '' && value != null && Number.isFinite(Number(value));

function parts(value) {
  if (typeof value === 'number') return [value];
  const text = String(value).trim().replace(/[°º'′"″,:;]/g, ' ').replace(/[NSEW]/ig, ' ');
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
    if (degrees < 0 || minutes < 0 || seconds < 0 || minutes >= 60 || seconds >= 60) throw new Error('Degrees must be non-negative and minutes/seconds must be below 60.');
    magnitude = degrees + minutes / 60 + seconds / 3600;
  } else {
    throw new Error('Unsupported coordinate format.');
  }
  if (magnitude > limit) throw new Error(axis + ' must be between 0 and ' + limit + ' degrees.');
  return Number((['S', 'W'].includes(hemi) ? -magnitude : magnitude).toFixed(8));
}

export function decimalToCoordinate(decimal, format = 'DD') {
  const value = Number(decimal);
  if (!Number.isFinite(value) || Math.abs(value) > 180) throw new Error('Coordinate must be a finite value within ±180 degrees.');
  const absolute = Math.abs(value);
  if (format === 'DD') return absolute.toFixed(6);
  const degrees = Math.floor(absolute);
  const minuteFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minuteFloat);
  const seconds = (minuteFloat - minutes) * 60;
  if (format === 'DDM') return degrees + '° ' + (minuteFloat).toFixed(4) + "'";
  if (format === 'DMS') return degrees + '° ' + minutes + "' " + seconds.toFixed(2) + '"';
  throw new Error('Unsupported coordinate format.');
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
