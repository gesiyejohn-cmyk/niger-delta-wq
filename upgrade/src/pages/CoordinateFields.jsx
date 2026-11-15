import { coordinateToDecimal, decimalToCoordinate } from '../engine/coordinates.js';

const field = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };

export default function CoordinateFields({ value, onChange, label = 'Location coordinates' }) {
  let converted = null;
  try {
    if (value.latitude !== '' && value.longitude !== '') {
      const latitude = coordinateToDecimal(value.latitude, value.format, value.latitudeHemisphere, 'latitude');
      const longitude = coordinateToDecimal(value.longitude, value.format, value.longitudeHemisphere, 'longitude');
      converted = { latitude, longitude };
    }
  } catch { /* Validation is reported when the record is saved. */ }
  const set = (key, next) => onChange(old => ({ ...old, [key]: next }));
  return <div className="span-two" style={{ border: '1px solid #dbe3ea', borderRadius: 9, padding: 12, margin: '8px 0' }}>
    <h3>{label}</h3>
    <label>Coordinate input format
      <select style={field} value={value.format} onChange={event => set('format', event.target.value)}>
        <option value="DD">Decimal Degrees (DD)</option>
        <option value="DMS">Degrees-Minutes-Seconds (DMS)</option>
        <option value="DDM">Degrees-Decimal Minutes (DDM)</option>
      </select>
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 90px', gap: 8, marginTop: 8 }}>
      <label>Latitude ({value.format})
        <input style={field} value={value.latitude} placeholder={value.format === 'DD' ? 'e.g. 4.920000' : value.format === 'DMS' ? 'e.g. 4 55 12' : 'e.g. 4 55.2000'} onChange={event => set('latitude', event.target.value)} />
      </label>
      <label>Hemisphere
        <select style={field} value={value.latitudeHemisphere} onChange={event => set('latitudeHemisphere', event.target.value)}>
          <option value="N">N</option><option value="S">S</option>
        </select>
      </label>
      <label>Longitude ({value.format})
        <input style={field} value={value.longitude} placeholder={value.format === 'DD' ? 'e.g. 6.260000' : value.format === 'DMS' ? 'e.g. 6 15 36' : 'e.g. 6 15.6000'} onChange={event => set('longitude', event.target.value)} />
      </label>
      <label>Hemisphere
        <select style={field} value={value.longitudeHemisphere} onChange={event => set('longitudeHemisphere', event.target.value)}>
          <option value="E">E</option><option value="W">W</option>
        </select>
      </label>
    </div>
    {converted && <p className="muted">Converted to decimal degrees (WGS84 values): {converted.latitude.toFixed(8)}°, {converted.longitude.toFixed(8)}°</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
      <label>Datum
        <select style={field} value={value.datum} onChange={event => set('datum', event.target.value)}>
          <option value="WGS84">WGS 84</option>
        </select>
      </label>
      <label>Coordinate reference system
        <select style={field} value={value.crs} onChange={event => set('crs', event.target.value)}>
          <option value="Geographic (WGS84)">Geographic (WGS84)</option>
          <option value="UTM Zone 31N (WGS84)">UTM Zone 31N (WGS84)</option>
          <option value="UTM Zone 32N (WGS84)">UTM Zone 32N (WGS84)</option>
        </select>
      </label>
    </div>
    <p className="muted">Coordinates are validated and stored in decimal degrees, with the original entry retained. UTM choices currently record the declared CRS only; automatic UTM reprojection is not yet available.</p>
  </div>;
}
