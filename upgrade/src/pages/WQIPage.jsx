import { useEffect, useState } from 'react';
import { listSamples } from '../storage/samples.js';
import { calculateWeightedArithmeticWQI } from '../engine/wqi.js';

const PARAMETERS = [
  ['ph', 'pH', 'pH units'], ['ec', 'Electrical conductivity', 'µS/cm'],
  ['tds', 'Total dissolved solids', 'mg/L'], ['no3', 'Nitrate', 'mg/L'],
  ['fe', 'Iron', 'mg/L'], ['mn', 'Manganese', 'mg/L'], ['pb', 'Lead', 'mg/L']
];
const field = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };

export default function WQIPage() {
  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [limits, setLimits] = useState(Object.fromEntries(PARAMETERS.map(([key]) => [key, { standard: '', ideal: '' }])));
  const [standardSource, setStandardSource] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { listSamples().then(setSamples).catch(e => setError('Could not load samples: ' + e.message)); }, []);
  const sample = samples.find(item => String(item.id) === String(sampleId)) || samples[0] || null;

  function calculate() {
    setError(''); setResult(null);
    try {
      if (!standardSource.trim()) throw new Error('Enter the standard source or reference used for the limits.');
      const measurements = PARAMETERS.map(([key, label, unit]) => ({
        key, label, unit,
        value: sample?.parameters?.[key]?.canonical,
        standard: limits[key].standard,
        ideal: limits[key].ideal
      }));
      setResult(calculateWeightedArithmeticWQI(measurements));
    } catch (e) { setError(e.message); }
  }

  return <div className="page">
    <p className="eyebrow">WATER QUALITY ASSESSMENT</p>
    <h1>Water Quality Index (WQI)</h1>
    <p className="muted">Calculate a weighted arithmetic WQI from a saved sample. Enter the applicable standard limit and ideal value for each parameter, using the same units as the sample. Standards are deliberately user-entered so the assessment can state the selected WHO, Nigerian or project-specific reference rather than silently assuming one.</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <section className="panel">
      <label>Select saved water sample
        <select style={field} value={sample?.id || ''} onChange={e => { setSampleId(e.target.value); setResult(null); }}>
          {samples.map(item => <option key={item.id} value={item.id}>{item.sampleCode || item.stationName || item.id} — {item.collectionDate || 'Undated'}</option>)}
        </select>
      </label>
      {!samples.length && <p className="notice">No saved samples are available. Record or import a water-quality sample first.</p>}
      {sample && <p className="muted">Sample: {sample.sampleCode || sample.stationName || sample.id}. Only measured numeric values are included; missing measurements are excluded, not treated as zero.</p>}
      <label>Standard / guideline reference
        <input style={field} value={standardSource} onChange={e => { setStandardSource(e.target.value); setResult(null); }} placeholder="e.g. WHO drinking-water guideline edition or NIS 554" />
      </label>
      <h2>Parameter limits</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead><tr><th align="left">Parameter</th><th align="right">Measured value</th><th align="right">Standard limit</th><th align="right">Ideal value</th><th align="left">Unit</th></tr></thead>
          <tbody>{PARAMETERS.map(([key, label, unit]) => {
            const raw = sample?.parameters?.[key]?.canonical;
            const measured = raw == null || raw === '' || !Number.isFinite(Number(raw)) ? 'Not recorded' : Number(raw).toString();
            return <tr key={key} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td>{label}</td><td align="right">{measured}</td>
              <td><input style={field} type="number" min="0" step="any" value={limits[key].standard} onChange={e => { setLimits(old => ({ ...old, [key]: { ...old[key], standard: e.target.value } })); setResult(null); }} /></td>
              <td><input style={field} type="number" step="any" value={limits[key].ideal} onChange={e => { setLimits(old => ({ ...old, [key]: { ...old[key], ideal: e.target.value } })); setResult(null); }} /></td>
              <td>{unit}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button type="button" className="primary" disabled={!sample} onClick={calculate}>Calculate WQI</button>
      {result && <div className="notice" style={{ marginTop: 14 }}>
        <h2>Weighted arithmetic WQI: {result.wqi.toFixed(2)}</h2>
        <p>Parameters included: {result.parameterCount}. Incomplete/missing parameters excluded: {result.missingExcluded}.</p>
        <p>Standard reference: {standardSource}. Method: {result.method}. This screen reports the numeric index only; interpret it using the classification scale and regulatory standard selected for your study.</p>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th align="left">Parameter</th><th align="right">Qi</th><th align="right">Wi</th><th align="right">Contribution</th></tr></thead>
          <tbody>{result.details.map(row => <tr key={row.key}><td>{row.label}</td><td align="right">{row.qualityRating.toFixed(3)}</td><td align="right">{row.unitWeight.toFixed(5)}</td><td align="right">{row.contribution.toFixed(3)}</td></tr>)}</tbody>
        </table></div>
      </div>}
    </section>
    <p className="muted">Use a consistent standard source and sampling context. This calculator does not decide potability or health risk, and it does not replace parameter-by-parameter compliance assessment.</p>
  </div>;
}
