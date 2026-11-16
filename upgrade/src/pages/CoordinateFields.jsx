import { useState } from 'react';
import { coordinateToDecimal, decimalToCoordinate, decimalToUTM, getStandardUTMZone } from '../engine/coordinates.js';

const field = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };

export default function CoordinateFields({ value, onChange, label = 'Location coordinates' }) {
  const [gpsMessage, setGpsMessage] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  let converted = null;
  try {
    if (value.latitude !== '' && value.longitude !== '') {
      const latitude = coordinateToDecimal(value.latitude, value.format, value.latitudeHemisphere, 'latitude');
      const longitude = coordinateToDecimal(value.longitude, value.format, value.longitudeHemisphere, 'longitude');
      converted = { latitude, longitude };
    }
  } catch { /* Validation is reported when the record is saved. */ }
  let utm = null;
  let standardZone = null;
  let selectedZone = null;
  if (converted && value.crs.startsWith('UTM Zone')) {
    selectedZone = Number(value.crs.match(/Zone (\d+)/)?.[1]);
    try {
      utm = decimalToUTM(converted.latitude, converted.longitude, selectedZone);
      standardZone = getStandardUTMZone(converted.latitude, converted.longitude);
    } catch { utm = null; }
  }
  const set = (key, next) => onChange(old => ({ ...old, [key]: next }));
  return <div className="span-two" style={{ border: '1px solid #dbe3ea', borderRadius: 9, padding: 12, margin: '8px 0' }}>
    <h3>{label}</h3>
    <label>Coordinate input format
      <select style={field} value={value.format} onChange={event => {
        const nextFormat = event.target.value;
        try {
          if (value.latitude !== '' && value.longitude !== '') {
            const lat = coordinateToDecimal(value.latitude, value.format, value.latitudeHemisphere, 'latitude');
            const lon = coordinateToDecimal(value.longitude, value.format, value.longitudeHemisphere, 'longitude');
            onChange(old => ({ ...old, format: nextFormat, latitude: decimalToCoordinate(lat, nextFormat), longitude: decimalToCoordinate(lon, nextFormat) }));
          } else onChange(old => ({ ...old, format: nextFormat }));
        } catch { onChange(old => ({ ...old, format: nextFormat })); }
      }}>
        <option value="DD">Decimal Degrees (DD)</option>
        <option value="DMS">Degrees-Minutes-Seconds (DMS)</option>
        <option value="DDM">Degrees-Decimal Minutes (DDM)</option>
      </select>
    </label>
    <button type="button" style={{ ...field, marginTop: 8, cursor: 'pointer' }} disabled={gpsBusy} onClick={() => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGpsMessage('GPS location is not available in this browser.');
        return;
      }
      setGpsBusy(true);
      setGpsMessage('Requesting device location…');
      try {
        navigator.geolocation.getCurrentPosition(position => {
          try {
            const lat = Number(position?.coords?.latitude);
            const lon = Number(position?.coords?.longitude);
            const accuracy = Number(position?.coords?.accuracy);
            if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
              throw new Error('The device returned invalid coordinates.');
            }
            onChange(old => ({
              ...old,
              latitude: decimalToCoordinate(lat, old.format),
              longitude: decimalToCoordinate(lon, old.format),
              latitudeHemisphere: lat < 0 ? 'S' : 'N',
              longitudeHemisphere: lon < 0 ? 'W' : 'E'
            }));
            setGpsMessage('Location captured.' + (Number.isFinite(accuracy) && accuracy >= 0
              ? ' Estimated accuracy: ' + Math.round(accuracy) + ' m.' : '') + ' Check the coordinates before saving.');
          } catch {
            setGpsMessage('The device location could not be converted or applied. Check the coordinate fields and try again.');
          } finally {
            setGpsBusy(false);
          }
        }, error => {
          try {
            setGpsMessage(error?.code === 1 ? 'Location permission was denied.'
              : error?.code === 2 ? 'Device location is unavailable.'
                : 'Location request timed out. Try again.');
          } finally {
            setGpsBusy(false);
          }
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      } catch {
        setGpsMessage('The device location request could not be started. Check browser permissions and try again.');
        setGpsBusy(false);
      }
    }}>{gpsBusy ? 'Getting GPS location…' : 'Use device GPS location'}</button>
    {gpsMessage && <p className="muted" role="status">{gpsMessage}</p>}
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
    {converted && <><p className="muted">Canonical WGS84 decimal degrees: {converted.latitude.toFixed(8)}°, {converted.longitude.toFixed(8)}°</p>{utm && <p className="muted">Derived {utm.zone}{utm.hemisphere} UTM (EPSG:{utm.epsg}): Easting {utm.easting.toFixed(3)} m · Northing {utm.northing.toFixed(3)} m</p>}</>}
    {utm && standardZone !== null && selectedZone !== standardZone && <p className="muted" role="status">The selected UTM Zone {selectedZone} differs from the standard zone {standardZone} for this location. Confirm the intended coordinate reference system before using or exporting these values. Adjacent-zone or custom-zone projections may still be intentional.</p>}
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
    <p className="muted">Enter coordinates in the selected DD, DMS or DDM geographic format. For DMS and DDM, enter whole degrees followed by minutes (and seconds for DMS); choose N/S/E/W with the separate hemisphere selectors rather than typing hemisphere letters into the coordinate fields. Values are stored in WGS84 decimal degrees and the original entry is retained. When a UTM zone is selected, WGS84 UTM coordinates are calculated for display; the geographic decimal-degree values remain the canonical stored coordinates.</p>
  </div>;
}
