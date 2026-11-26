import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { saveSample } from '../storage/samples.js';
import { PARAMETER_REGISTRY } from '../engine/parameters.js';
import { availableUnits, toCanonical } from '../engine/units.js';
import { isBlankImportValue, parseImportedNumericValue } from '../engine/importValues.js';
import { detectMetadataMapping } from '../engine/importMapping.js';

export default function ImportPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    sampleCode: '',
    stationName: '',
    latitude: '',
    longitude: '',
    coordinateFormat: '',
    latitudeHemisphere: '',
    longitudeHemisphere: '',
    coordinateDatum: '',
    coordinateCRS: '',
    collectionDate: '',
    waterSourceType: '',
    collector: '',
    notes: ''
  });
  const [paramMap, setParamMap] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function read(file) {
    try {
      let data;
      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
          header: 1,
          defval: ''
        });
      } else {
        const parsed = Papa.parse(await file.text(), { skipEmptyLines: true });
        if (parsed.errors.length) throw new Error(parsed.errors[0].message);
        data = parsed.data;
      }

      const [headerRow, ...dataRows] = data;
      const sourceHeaders = (headerRow || []).map(String);
      setHeaders(sourceHeaders);
      setRows(dataRows);

      const detectedMeta = detectMetadataMapping(sourceHeaders);
      const detectedParams = {};
      for (const [key, config] of Object.entries(PARAMETER_REGISTRY)) {
        const index = sourceHeaders.findIndex(header => {
          const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalized === key
            || normalized === config.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        });
        if (index >= 0) detectedParams[key] = sourceHeaders[index];
      }

      setMapping(detectedMeta);
      setParamMap(detectedParams);
      setMessage(dataRows.length + ' data rows loaded. Check the column mappings before importing.');
    } catch (error) {
      setMessage('Could not read file: ' + error.message);
    }
  }

  async function run() {
    setBusy(true);
    let imported = 0;
    const failed = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const meta = {
        sampleCode: '',
        stationName: '',
        waterSourceType: 'borehole',
        latitude: '',
        longitude: '',
        coordinateFormat: 'DD',
        coordinateDatum: 'WGS84',
        coordinateCRS: 'Geographic (WGS84)',
        collectionDate: '',
        collector: '',
        notes: ''
      };

      for (const [key, header] of Object.entries(mapping)) {
        if (!header) continue;
        const value = row[headers.indexOf(header)];
        if (!isBlankImportValue(value)) meta[key] = value;
      }

      if (typeof meta.collectionDate === 'number') {
        meta.collectionDate = new Date(Date.UTC(1899, 11, 30) + meta.collectionDate * 86400000)
          .toISOString().slice(0, 10);
      }

      const params = {};
      try {
        if (!String(meta.sampleCode || '').trim()) throw new Error('Missing sample code');
        for (const [key, header] of Object.entries(paramMap)) {
          if (!header) continue;
          const raw = row[headers.indexOf(header)];
          const numericValue = parseImportedNumericValue(raw);
          if (numericValue == null) continue;
          const unit = inferUnit(headers[headers.indexOf(header)] || '', key);
          const converted = toCanonical(key, numericValue, unit);
          params[key] = {
            value: numericValue,
            unit,
            canonical: converted.canonical,
            canonicalUnit: converted.unit
          };
        }
        if (Object.keys(params).length === 0) {
          throw new Error('No mapped parameter values in this row');
        }
        await saveSample({ meta, params });
        imported++;
      } catch (error) {
        failed.push('Row ' + (rowIndex + 2) + ': ' + error.message);
      }
    }

    setBusy(false);
    setMessage('Imported ' + imported + ' rows; ' + failed.length + ' failed. ' + failed.slice(0, 8).join(' | '));
    if (imported && failed.length === 0) setTimeout(() => navigate('/'), 1300);
  }

  const metadataLabels = {
    sampleCode: 'Sample code',
    stationName: 'Station / location',
    latitude: 'Latitude',
    longitude: 'Longitude',
    coordinateFormat: 'Coordinate format (DD / DMS / DDM)',
    latitudeHemisphere: 'Latitude hemisphere (N / S)',
    longitudeHemisphere: 'Longitude hemisphere (E / W)',
    coordinateDatum: 'Coordinate datum',
    coordinateCRS: 'Coordinate display CRS',
    collectionDate: 'Collection date',
    waterSourceType: 'Water source',
    collector: 'Collector',
    notes: 'Notes'
  };

  return <div className="page">
    <p className="eyebrow">BULK DATA ENTRY</p>
    <h1>Import laboratory results</h1>
    <section className="panel">
      <p>Upload CSV or Excel (.xlsx/.xls). Ensure numeric water-quality values use the expected units. This wizard assumes the first worksheet and first row contain column headers.</p>
      <label className="upload-box">Choose CSV or Excel file
        <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={event => event.target.files?.[0] && read(event.target.files[0])} />
      </label>
      {message && <p className="notice" role="status">{message}</p>}
    </section>

    {headers.length > 0 && <section className="panel">
      <h2>Map sample and coordinate columns</h2>
      <div className="form-grid">
        {Object.keys(mapping).map(key =>
          <label key={key}>{metadataLabels[key]}
            <select value={mapping[key]} onChange={event => setMapping(previous => ({
              ...previous,
              [key]: event.target.value
            }))}>
              <option value="">Not mapped</option>
              {headers.map(header => <option key={header}>{header}</option>)}
            </select>
          </label>
        )}
      </div>

      <h2>Map water-quality parameter columns</h2>
      <div className="parameter-grid">
        {Object.entries(PARAMETER_REGISTRY).map(([key, config]) =>
          <label key={key}>{config.name}
            <select value={paramMap[key] || ''} onChange={event => setParamMap(previous => ({
              ...previous,
              [key]: event.target.value
            }))}>
              <option value="">Not mapped</option>
              {headers.map(header => <option key={header}>{header}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="muted">Coordinate columns may be DD, DMS or DDM. Map the format and hemisphere columns when they are present. Coordinates are validated and stored as WGS84 geographic decimal degrees (EPSG:4326); the original entered values and selected display CRS are retained. If no coordinate format column is mapped, DD is assumed.</p>
      <p className="muted">Automatic unit assumption: the first supported unit for each parameter. Use canonical units in the import file or review the unit mapping before importing.</p>
      <button className="primary" disabled={busy || !rows.length} onClick={run}>
        {busy ? 'Importing…' : 'Import ' + rows.length + ' rows'}
      </button>
    </section>}
  </div>;
}

function inferUnit(header, key) {
  const normalized = String(header).toLowerCase().replace(/\s+/g, ' ').trim();
  const units = availableUnits(key).sort((a, b) => b.length - a.length);
  const found = units.find(unit => unit && normalized.includes(unit.toLowerCase()));
  if (found) return found;
  if (key === 'no3' && /(no3\s*-\s*n|as\s*n|nitrate\s*as\s*n)/i.test(normalized)) return 'mg/L as NO3-N';
  if (key === 'no2' && /(no2\s*-\s*n|as\s*n|nitrite\s*as\s*n)/i.test(normalized)) return 'mg/L as NO2-N';
  return availableUnits(key)[0];
}
