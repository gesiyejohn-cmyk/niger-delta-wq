import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { calculateVES, validateVES, validateERT } from '../engine/geophysics.js';
import VESInterpretation from './VESInterpretation.jsx';
import CoordinateFields from './CoordinateFields.jsx';
import { validateCoordinatePair } from '../engine/coordinates.js';
import { saveVES, listVES, deleteVES, saveERT, listERT, deleteERT } from '../storage/geophysics.js';

const input = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };
const panel = { background: '#fff', border: '1px solid #dbe3ea', borderRadius: 12, padding: 16, marginBottom: 16 };

export default function GeophysicsPage() {
  const [tab, setTab] = useState('VES');
  const [ves, setVes] = useState([]);
  const [ert, setErt] = useState([]);
  const [meta, setMeta] = useState({ stationId: '', latitude: '', longitude: '', array: 'Schlumberger', notes: '' });
  const [vesCoordinates, setVesCoordinates] = useState({ latitude: '', longitude: '', format: 'DD', latitudeHemisphere: 'N', longitudeHemisphere: 'E', datum: 'WGS84', crs: 'Geographic (WGS84)' });
  const [ertCoordinates, setErtCoordinates] = useState({ latitude: '', longitude: '', format: 'DD', latitudeHemisphere: 'N', longitudeHemisphere: 'E', datum: 'WGS84', crs: 'Geographic (WGS84)' });
  const [readings, setReadings] = useState([{ ab2: '', mn2: '', spacing: '', resistance: '' }]);
  const [line, setLine] = useState({ lineId: '', spacing: '', electrodes: '', rms: '', software: '', notes: '' });
  const [cells, setCells] = useState([]);
  const [sourceImport, setSourceImport] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedErtModelId, setSelectedErtModelId] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  async function refresh() {
    try {
      setVes(await listVES());
      const savedERT = await listERT();
      setErt(savedERT);
      setSelectedErtModelId(current => current || savedERT[0]?.id || '');
    } catch (error) {
      setMsg('Could not load saved geophysical records: ' + error.message);
      setMsgType('error');
    }
  }
  useEffect(() => { refresh(); }, []);

  function notify(message, type = 'info') {
    setMsg(message);
    setMsgType(type);
  }
  function editRow(i, key, value) {
    setReadings(old => old.map((row, index) => index === i ? { ...row, [key]: value } : row));
  }
  function rowPreview(row) {
    if (row.resistance === '' || (meta.array === 'Wenner' ? row.spacing === '' : row.ab2 === '' || row.mn2 === '')) return null;
    try {
      return calculateVES({ ...row, array: meta.array });
    } catch {
      return null;
    }
  }
  async function saveSounding() {
    try {
      const completeRows = readings.filter(row =>
        row.resistance !== '' && (meta.array === 'Wenner' ? row.spacing !== '' : row.ab2 !== '' && row.mn2 !== '')
      );
      const clean = validateVES(completeRows, meta.array);
      const partial = clean.length < 2;
      const coordinates = validateCoordinatePair(vesCoordinates);
      await saveVES({
        ...meta,
        ...(coordinates || {}),
        coordinateDatum: vesCoordinates.datum,
        coordinateCRS: vesCoordinates.crs,
        readings: clean,
        method: meta.array,
        interpretationStatus: partial ? 'Partial sounding - additional readings required' : 'Uninterpreted',
        dataStatus: partial ? 'One valid reading stored; curve requires at least two readings' : 'Field readings stored'
      });
      setReadings([{ ab2: '', mn2: '', spacing: '', resistance: '' }]);
      notify(partial
        ? 'VES reading saved. Add at least one more valid reading to produce a sounding curve.'
        : 'VES sounding saved. Apparent resistivity and geometric factors were calculated; layer interpretation remains a separate expert task.', 'success');
      await refresh();
    } catch (error) {
      notify('VES not saved: ' + error.message, 'error');
    }
  }

  async function importERT(file) {
    try {
      const sourceText = await file.text();
      if (sourceText.length > 10 * 1024 * 1024) throw new Error('ERT CSV is larger than the 10 MB import limit.');
      const parsed = Papa.parse(sourceText, { header: true, skipEmptyLines: true, dynamicTyping: true });
      if (parsed.errors.length) throw new Error(parsed.errors[0].message);
      const rows = parsed.data.map(row => ({
        x: row.x ?? row.X ?? row.electrode_x ?? row.distance,
        depth: row.depth ?? row.Depth ?? row.depth_m,
        resistivity: row.resistivity ?? row.Resistivity ?? row.resistivity_ohm_m
      }));
      const clean = validateERT(rows);
      setCells(clean);
      setSourceImport({ fileName: file.name, content: sourceText, importedAt: new Date().toISOString() });
      setSelectedCell(clean[0] || null);
      notify(clean.length + ' ERT model points loaded. Confirm the metadata and save the imported model.', 'success');
    } catch (error) {
      notify('ERT import failed: ' + error.message, 'error');
    }
  }

  async function saveModel() {
    try {
      const clean = validateERT(cells);
      const coordinates = validateCoordinatePair(ertCoordinates);
      await saveERT({
        ...line,
        ...(coordinates || {}),
        coordinateDatum: ertCoordinates.datum,
        coordinateCRS: ertCoordinates.crs,
        cells: clean,
        sourceImport,
        source: 'Imported inverted resistivity model',
        inversionPerformedInApp: false
      });
      setCells([]);
      setSourceImport(null);
      setSelectedCell(null);
      notify('ERT model saved. The app displays imported inversion results; it does not perform geophysical inversion.', 'success');
      await refresh();
    } catch (error) {
      notify('ERT model not saved: ' + error.message, 'error');
    }
  }

  const allCells = useMemo(() => ert.flatMap(model =>
    model.cells.map((cell, index) => ({ ...cell, modelId: model.id, lineId: model.lineId || 'Unlabelled line', key: model.id + '-' + index }))
  ), [ert]);
  const activeERTModel = ert.find(model => model.id === selectedErtModelId) || ert[0] || null;
  const displayCells = activeERTModel ? allCells.filter(cell => cell.modelId === activeERTModel.id) : [];
  const minX = displayCells.length ? Math.min(...displayCells.map(cell => cell.x)) : 0;
  const maxX = displayCells.length ? Math.max(...displayCells.map(cell => cell.x)) : 1;
  const maxDepth = displayCells.length ? Math.max(1, ...displayCells.map(cell => cell.depth)) : 1;
  const minR = displayCells.length ? Math.min(...displayCells.map(cell => cell.resistivity)) : 1;
  const maxR = displayCells.length ? Math.max(...displayCells.map(cell => cell.resistivity)) : 1;

  function colourFor(value) {
    const ratio = (Math.log10(value) - Math.log10(minR)) /
      (Math.log10(maxR) - Math.log10(minR) || 1);
    if (ratio < 0.33) return '#2563eb';
    if (ratio < 0.66) return '#eab308';
    return '#dc2626';
  }

  return <div className="page">
    <p className="eyebrow">INTEGRATED GEOPHYSICAL DATA</p>
    <h1>VES &amp; ERT workspace</h1>
    <p className="muted">Record Schlumberger or Wenner VES measurements with array-specific apparent resistivity, and visualise imported ERT inversion points. Raw observations and interpreted models are stored separately from water-quality samples.</p>
    <section style={panel}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('VES')} className={tab === 'VES' ? 'primary' : ''}>VES soundings</button>
        <button onClick={() => setTab('ERT')} className={tab === 'ERT' ? 'primary' : ''}>ERT sections</button>
      </div>
      {msg && <p className={msgType === 'error' ? 'notice error' : 'notice'} role="status">{msg}</p>}

      {tab === 'VES' ? <>
        <h2>VES station metadata</h2>
        <div className="form-grid">
          <label>Station / sounding ID
            <input style={input} value={meta.stationId} onChange={event => setMeta(old => ({ ...old, stationId: event.target.value }))} />
          </label>
          <CoordinateFields value={vesCoordinates} onChange={setVesCoordinates} label="VES station coordinates" />
          <label>Array configuration
            <select style={input} value={meta.array} onChange={event => setMeta(old => ({ ...old, array: event.target.value }))}>
              <option>Schlumberger</option>
              <option>Wenner</option>
            </select>
          </label>
          <label className="span-two">Field notes
            <textarea style={input} value={meta.notes} onChange={event => setMeta(old => ({ ...old, notes: event.target.value }))} />
          </label>
        </div>
        <h2>Field readings</h2>
        <p className="muted">{meta.array === "Wenner" ? "Enter equal adjacent-electrode spacing a in metres; Wenner uses K = 2πa. " : "AB/2 and MN/2 are in metres; Schlumberger uses K = π[(AB/2)² − (MN/2)²] / [2(MN/2)]. "}Resistance is in ohms. Blank rows are ignored. At least one complete reading can be stored; two or more are needed for a sounding curve.</p>
        {readings.map((row, index) => {
          const preview = rowPreview(row);
          return <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
              {(meta.array === 'Wenner' ? [
                ['spacing', 'Electrode spacing a (m)'],
                ['resistance', 'Resistance (Ω)']
              ] : [
                ['ab2', 'AB/2 (m)'],
                ['mn2', 'MN/2 (m)'],
                ['resistance', 'Resistance (Ω)']
              ]).map(([key, label]) => <label key={key}>{label}
                <input style={input} type="number" min="0" step="any" value={row[key]} onChange={event => editRow(index, key, event.target.value)} />
              </label>)}
            </div>
            {preview && <p className="muted">{meta.array} geometric factor: {preview.geometricFactor.toFixed(3)} m · Apparent resistivity: <strong>{preview.apparentResistivity.toFixed(2)} Ωm</strong></p>}
            <button type="button" onClick={() => setReadings(old => old.filter((_, i) => i !== index))} disabled={readings.length === 1}>Remove reading</button>
          </div>;
        })}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setReadings(old => [...old, { ab2: '', mn2: '', spacing: '', resistance: '' }])}>Add reading</button>
          <button type="button" className="primary" onClick={saveSounding}>Save VES sounding</button>
        </div>
        <h2>Saved VES soundings</h2>
        {ves.map(record => <div key={record.id} style={{ padding: 8, borderTop: '1px solid #e2e8f0' }}>
          <strong>{record.stationId || 'Unlabelled sounding'}</strong> · {record.readings.length} readings · {record.createdAt.slice(0, 10)}
          <button onClick={async () => { await deleteVES(record.id); await refresh(); }}>Delete</button>
        </div>)}
        {ves.map(record => <VESPlot key={record.id} record={record} />)}
        <VESInterpretation records={ves} onSaved={refresh} notify={notify} />
      </> : <>
        <h2>ERT line metadata</h2>
        <div className="form-grid">
          {[
            ['lineId', 'ERT line ID'],
            ['spacing', 'Electrode spacing (m)'],
            ['electrodes', 'Electrode count'],
            ['rms', 'Inversion RMS error (%)'],
            ['software', 'Inversion software / version']
          ].map(([key, label]) => <label key={key}>{label}
            <input style={input} value={line[key]} onChange={event => setLine(old => ({ ...old, [key]: event.target.value }))} />
          </label>)}
          <label className="span-two">Notes
            <textarea style={input} value={line.notes} onChange={event => setLine(old => ({ ...old, notes: event.target.value }))} />
          </label>
          <CoordinateFields value={ertCoordinates} onChange={setErtCoordinates} label="ERT survey location coordinates" />
        </div>
        <p className="muted">Import a CSV exported from inversion software with columns x, depth, resistivity (or electrode_x, depth_m, resistivity_ohm_m). RMS error and software details should come from the actual inversion report.</p>
        <input type="file" accept=".csv,text/csv" onChange={event => event.target.files?.[0] && importERT(event.target.files[0])} />
        <p>{cells.length} model points staged for import.</p>
        <button type="button" className="primary" disabled={!cells.length} onClick={saveModel}>Save imported ERT model</button>
        <h2>Saved ERT lines</h2>
        {ert.map(record => <div key={record.id} style={{ padding: 8, borderTop: '1px solid #e2e8f0' }}>
          <strong>{record.lineId || 'Unlabelled line'}</strong> · {record.cells.length} points · RMS {record.rms || 'not recorded'}%
          <button onClick={async () => { await deleteERT(record.id); if (selectedErtModelId === record.id) { setSelectedErtModelId(''); setSelectedCell(null); } await refresh(); }}>Delete</button>
        </div>)}
        {allCells.length > 0 && <>
          <h2>ERT resistivity point section</h2>
          <label>Survey line to display
            <select style={input} value={activeERTModel?.id || ''} onChange={event => { setSelectedErtModelId(event.target.value); setSelectedCell(null); }}>
              {ert.map((model, index) => <option key={model.id} value={model.id}>{model.lineId || 'Unlabelled line'} — {model.cells.length} points (model {index + 1})</option>)}
            </select>
          </label>
          <p className="muted">Showing {activeERTModel?.lineId || 'Unlabelled line'} only. Other survey lines are kept separate because their distance coordinates may have different origins.</p>
          <p className="muted">This is a plot of imported model points, not a continuous interpolated tomogram. Select a point to inspect its measured/imported value. A dense, gridded inversion export is needed for a continuous colour section.</p>
          <svg viewBox="0 0 760 390" role="img" aria-label="ERT resistivity point plot with distance and depth axes" style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <path d="M65 25V330H730" fill="none" stroke="#475569" strokeWidth="1.5" />
            <text x="65" y="16" fontSize="12" fill="#334155">Depth (m)</text>
            <text x="350" y="375" fontSize="12" fill="#334155">Distance along line (m)</text>
            <text x="20" y="335" fontSize="11" fill="#64748b">0</text>
            <text x="20" y="45" fontSize="11" fill="#64748b">{maxDepth}</text>
            <text x="65" y="348" fontSize="11" fill="#64748b">{minX}</text>
            <text x="700" y="348" fontSize="11" fill="#64748b">{maxX}</text>
            {displayCells.map(cell => {
              const x = 65 + ((cell.x - minX) / (maxX - minX || 1)) * 650;
              const y = 30 + (cell.depth / maxDepth) * 295;
              return <circle key={cell.key} cx={x} cy={y} r={selectedCell?.key === cell.key ? 11 : 8}
                fill={colourFor(cell.resistivity)} stroke={selectedCell?.key === cell.key ? '#0f172a' : '#ffffff'}
                strokeWidth="2" role="button" tabIndex="0"
                aria-label={cell.resistivity + ' ohm metres at distance ' + cell.x + ' metres and depth ' + cell.depth + ' metres'}
                onClick={() => setSelectedCell(cell)}
                onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && setSelectedCell(cell)} />
            })}
          </svg>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0' }}>
            <span><span style={{ color: '#2563eb' }}>●</span> Lower resistivity</span>
            <span><span style={{ color: '#eab308' }}>●</span> Intermediate resistivity</span>
            <span><span style={{ color: '#dc2626' }}>●</span> Higher resistivity</span>
            <span className="muted">Relative to the selected dataset; not contamination classes.</span>
          </div>
          {selectedCell && <p className="notice" aria-live="polite">
            Selected point: {selectedCell.lineId} · Distance {selectedCell.x} m · Depth {selectedCell.depth} m · Resistivity <strong>{selectedCell.resistivity} Ωm</strong>
          </p>}
          <h3>Imported model data table</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th align="left">Line</th><th align="right">Distance (m)</th><th align="right">Depth (m)</th><th align="right">Resistivity (Ωm)</th></tr></thead>
              <tbody>{displayCells.map(cell => <tr key={cell.key} onClick={() => setSelectedCell(cell)}>
                <td>{cell.lineId}</td><td align="right">{cell.x}</td><td align="right">{cell.depth}</td><td align="right">{cell.resistivity}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
      </>}
    </section>
  </div>;
}

function VESPlot({ record }) {
  const points = record.readings.filter(row => (row.spread ?? row.ab2) > 0 && row.apparentResistivity > 0);
  const maxX = Math.max(1, ...points.map(point => point.spread ?? point.ab2));
  const maxY = Math.max(1, ...points.map(point => point.apparentResistivity));
  return <section>
    <h2>VES sounding curve — {record.stationId || 'Unlabelled sounding'}</h2>
    <svg viewBox="0 0 720 300" style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
      <path d="M55 15V255H700" fill="none" stroke="#64748b" />
      {points.map((point, index) => <g key={index}>
        <circle cx={55 + (point.spread ?? point.ab2) / maxX * 630} cy={255 - point.apparentResistivity / maxY * 220} r="4" fill="#2563eb" />
        <title>{record.method === 'Wenner' ? 'Electrode spacing a ' + point.spacing : 'AB/2 ' + point.ab2} m; apparent resistivity {point.apparentResistivity.toFixed(2)} Ωm</title>
      </g>)}
    </svg>
    <p className="muted">Linear axes for quick review only. Formal VES interpretation requires appropriate log-log plotting and a validated layered-earth interpretation workflow.</p>
  </section>;
}
