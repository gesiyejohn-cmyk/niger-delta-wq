import { useEffect, useMemo, useState } from 'react';
import { calculateGod, exportGodCSV, GOD_FACTORS } from '../engine/god.js';
import { validateCoordinatePair } from '../engine/coordinates.js';
import { saveVulnerability, listVulnerability, deleteVulnerability } from '../storage/vulnerability.js';
import CoordinateFields from './CoordinateFields.jsx';

const METHOD = 'GOD intrinsic aquifer-vulnerability index';
const blank = { g: '', o: '', d: '' };
const blankCoordinates = { latitude: '', longitude: '', format: 'DD', latitudeHemisphere: 'N', longitudeHemisphere: 'E', datum: 'WGS84', crs: 'Geographic (WGS84)' };
const field = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };

export default function GodPage() {
  const [siteId, setSiteId] = useState('');
  const [factors, setFactors] = useState(blank);
  const [coordinates, setCoordinates] = useState(blankCoordinates);
  const [notes, setNotes] = useState('');
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const result = useMemo(() => {
    try { return calculateGod(factors); } catch { return null; }
  }, [factors]);

  async function refresh() {
    try { setRecords((await listVulnerability()).filter(record => record.method === METHOD)); }
    catch (e) { setError('Could not load GOD assessments: ' + e.message); }
  }
  useEffect(() => { refresh(); }, []);

  async function save() {
    setError(''); setMessage('');
    try {
      if (!siteId.trim()) throw new Error('Enter a site or assessment ID.');
      const assessment = calculateGod(factors);
      const location = validateCoordinatePair(coordinates);
      await saveVulnerability({
        siteId: siteId.trim(),
        ...(location || {}),
        ...(location ? { coordinateDatum: coordinates.datum, coordinateCRS: coordinates.crs } : {}),
        factors: assessment.factors,
        index: assessment.index,
        classification: assessment.classification,
        method: METHOD,
        notes
      });
      setMessage('GOD assessment saved independently of DRASTIC.');
      setSiteId(''); setFactors({ ...blank }); setCoordinates({ ...blankCoordinates }); setNotes('');
      await refresh();
    } catch (e) { setError('Assessment not saved: ' + e.message); }
  }

  function exportCSV() {
    try {
      const csv = exportGodCSV(records);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ndwq-god-assessments-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('GOD assessment CSV export started.'); setError('');
    } catch (e) { setError('Could not export GOD assessments: ' + e.message); }
  }

  return <div className="page">
    <p className="eyebrow">GROUNDWATER PROTECTION</p>
    <h1>GOD groundwater vulnerability</h1>
    <p className="muted">Independent GOD calculation: enter the three factor ratings from the documented hydrogeological classification. This workspace does not require DRASTIC data and does not derive GOD ratings from VES, ERT or water chemistry.</p>
    {message && <p className="notice" role="status">{message}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <section className="panel">
      <label>Site / assessment ID
        <input style={field} value={siteId} onChange={e => setSiteId(e.target.value)} />
      </label>
      <CoordinateFields value={coordinates} onChange={setCoordinates} label="Assessment location (optional)" />
      <h2>GOD factor ratings</h2>
      {GOD_FACTORS.map(factor => <div key={factor.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px', gap: 10, alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
        <label>{factor.label} <small className="muted" style={{ display: 'block' }}>{factor.description} Range: {factor.min}–{factor.max}.</small></label>
        <input style={field} type="number" min={factor.min} max={factor.max} step="0.01" placeholder={factor.min + '–' + factor.max} value={factors[factor.key]} onChange={e => setFactors(old => ({ ...old, [factor.key]: e.target.value }))} />
      </div>)}
      {result ? <div className="notice"><strong>GOD index: {result.index.toFixed(3)}</strong><p>{result.classification}</p><p>{result.factors.g} × {result.factors.o} × {result.factors.d}</p></div> : <p className="muted">Enter valid G (0–1), O (0.4–1) and D (0.6–1) factor ratings to calculate the index.</p>}
      <label>Supporting geological / hydrogeological evidence and limitations
        <textarea style={field} rows="4" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Record aquifer confinement evidence, vadose-zone lithology, depth-to-water/strike source and uncertainty." />
      </label>
      <button type="button" className="primary" disabled={!result} onClick={save}>Save GOD assessment</button>
    </section>
    <section className="panel">
      <h2>Saved GOD assessments</h2>
      <button type="button" onClick={exportCSV} disabled={!records.length}>Export GOD assessments to CSV</button>
      {records.length === 0 && <p className="muted">No GOD assessments saved yet.</p>}
      {records.map(record => <div key={record.id} style={{ borderTop: '1px solid #e2e8f0', padding: 10 }}>
        <strong>{record.siteId}</strong> · Index {Number(record.index).toFixed(3)} · {record.classification}
        <small style={{ display: 'block' }}>{record.createdAt?.slice(0, 10)} · G {record.factors?.g}, O {record.factors?.o}, D {record.factors?.d}</small>
        <button type="button" onClick={async () => { await deleteVulnerability(record.id); await refresh(); }}>Delete</button>
      </div>)}
    </section>
    <p className="muted">Method reference: Foster, Hirata, Gomes, D’Elia &amp; Paris (2002), <em>Groundwater Quality Protection</em>, World Bank, Technical Guide B1, Figure 1.2 (pp. 22–23). The published scheme uses G × O × D, with factor scales G 0–1, O 0.4–1 and D 0.6–1. Confirm local hydrogeological interpretation and document the selected factor values. GOD is an intrinsic-vulnerability screening index, not a contamination probability.</p>
  </div>;
}
