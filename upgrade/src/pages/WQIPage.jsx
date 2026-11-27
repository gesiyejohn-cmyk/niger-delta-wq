import { useEffect, useState } from 'react';
import { listSamples } from '../storage/samples.js';
import { calculateWeightedArithmeticWQI } from '../engine/wqi.js';
import { saveWQIAssessment, listWQIAssessments, deleteWQIAssessment } from '../storage/wqi.js';

const PARAMETERS = [
  ['ph', 'pH', 'pH units'], ['ec', 'Electrical conductivity', 'µS/cm'],
  ['tds', 'Total dissolved solids', 'mg/L'], ['no3', 'Nitrate', 'mg/L'],
  ['fe', 'Iron', 'mg/L'], ['mn', 'Manganese', 'mg/L'], ['pb', 'Lead', 'mg/L']
];
const field = { width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 7, boxSizing: 'border-box' };

export default function WQIPage() {
  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [limits, setLimits] = useState(Object.fromEntries(PARAMETERS.map(([key]) => [key, { minStandard: '', maxStandard: '', ideal: '', weightStandard: '' }])));
  const [standardSource, setStandardSource] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [historyMessage, setHistoryMessage] = useState('');
  useEffect(() => {
    Promise.all([listSamples(), listWQIAssessments()])
      .then(([savedSamples, savedAssessments]) => {
        setSamples(savedSamples);
        setHistory(savedAssessments);
      })
      .catch(e => setError('Could not load WQI data: ' + e.message));
  }, []);
  const sample = samples.find(item => String(item.id) === String(sampleId)) || samples[0] || null;

  function calculate() {
    setError(''); setResult(null);
    try {
      if (!standardSource.trim()) throw new Error('Enter the standard source or reference used for the limits.');
      const measurements = PARAMETERS.map(([key, label, unit]) => ({
        key, label, unit,
        value: sample?.parameters?.[key]?.canonical,
        minStandard: limits[key].minStandard,
        maxStandard: limits[key].maxStandard,
        ideal: limits[key].ideal,
        weightStandard: limits[key].weightStandard
      }));
      const calculation = calculateWeightedArithmeticWQI(measurements);
      const snapshot = {
        sample: {
          id: sample.id,
          sampleCode: sample.sampleCode || null,
          stationName: sample.stationName || null,
          collectionDate: sample.collectionDate || null
        },
        standardSource: standardSource.trim(),
        method: calculation.method,
        measurements: measurements.map(item => ({
          key: item.key, label: item.label, unit: item.unit,
          measuredValue: item.value ?? null,
          minStandard: item.minStandard, maxStandard: item.maxStandard,
          ideal: item.ideal, weightStandard: item.weightStandard
        })),
        result: calculation
      };
      setHistoryMessage('');
      setResult({ calculation, snapshot });
    } catch (e) { setError(e.message); }
  }

  return <div className="page">
    <p className="eyebrow">WATER QUALITY ASSESSMENT</p>
    <h1>Water Quality Index (WQI)</h1>
    <p className="muted">Calculate a weighted arithmetic WQI from a saved sample. Enter lower and/or upper acceptable limits and an ideal value for each parameter, using the same units as the sample. For two-sided ranges such as pH, enter both limits. The weight reference is the permissible value used for Wi = 1 / Si; it defaults to the upper limit, or the only limit entered. Standards are user-entered so the assessment records the selected WHO, Nigerian or project-specific reference.</p>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead><tr><th align="left">Parameter</th><th align="right">Measured</th><th align="right">Lower limit</th><th align="right">Upper limit</th><th align="right">Ideal</th><th align="right">Weight reference (Si)</th><th align="left">Unit</th></tr></thead>
          <tbody>{PARAMETERS.map(([key, label, unit]) => {
            const raw = sample?.parameters?.[key]?.canonical;
            const isBlank = raw == null || (typeof raw === 'string' && raw.trim() === '');
            const isNumeric = (typeof raw === 'number'
              || (typeof raw === 'string' && raw.trim() !== ''))
              && Number.isFinite(Number(raw));
            const measured = isBlank ? 'Not recorded'
              : !isNumeric ? 'Invalid value' : Number(raw).toString();
            const update = (name, value) => { setLimits(old => ({ ...old, [key]: { ...old[key], [name]: value } })); setResult(null); };
            return <tr key={key} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td>{label}</td><td align="right">{measured}</td>
              <td><input aria-label={label + ' lower acceptable limit'} style={field} type="number" min="0" step="any" value={limits[key].minStandard} onChange={e => update('minStandard', e.target.value)} /></td>
              <td><input aria-label={label + ' upper acceptable limit'} style={field} type="number" min="0" step="any" value={limits[key].maxStandard} onChange={e => update('maxStandard', e.target.value)} /></td>
              <td><input aria-label={label + ' ideal value'} style={field} type="number" step="any" value={limits[key].ideal} onChange={e => update('ideal', e.target.value)} /></td>
              <td><input aria-label={label + ' weight reference'} style={field} type="number" min="0" step="any" placeholder="Auto" value={limits[key].weightStandard} onChange={e => update('weightStandard', e.target.value)} /></td>
              <td>{unit}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button type="button" className="primary" disabled={!sample} onClick={calculate}>Calculate WQI</button>
      {result && <div className="notice" style={{ marginTop: 14 }}>
        <h2>Weighted arithmetic WQI: {result.calculation.wqi.toFixed(2)}</h2>
        <p>Parameters included: {result.calculation.parameterCount}. Missing measurements excluded: {result.calculation.missingMeasurementCount}. Measured parameters not scored because their limits or ideal values are incomplete: {result.calculation.unconfiguredCount}.</p>
        <p>Standard reference: {standardSource}. Method: {result.calculation.method}. This screen reports the numeric index only; interpret it using the classification scale and regulatory standard selected for your study.</p>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th align="left">Parameter</th><th align="right">Qi</th><th align="right">Applicable limit</th><th align="right">Wi</th><th align="right">Contribution</th></tr></thead>
          <tbody>{result.calculation.details.map(row => <tr key={row.key}><td>{row.label}</td><td align="right">{row.qualityRating.toFixed(3)}</td><td align="right">{row.applicableLimit}</td><td align="right">{row.unitWeight.toFixed(5)}</td><td align="right">{row.contribution.toFixed(3)}</td></tr>)}</tbody>
        </table></div>
      </div>}
      {result && <button type="button" className="primary" disabled={saving} onClick={async () => {
        setSaving(true); setError(''); setHistoryMessage('');
        try {
          const saved = await saveWQIAssessment(result.snapshot);
          setHistory(items => [saved, ...items]);
          setHistoryMessage('Assessment saved to this device as a historical snapshot.');
        } catch (e) { setError('Could not save assessment: ' + e.message); }
        finally { setSaving(false); }
      }}>{saving ? 'Saving…' : 'Save assessment to history'}</button>}
      {historyMessage && <p className="notice" role="status">{historyMessage}</p>}
    </section>
    <section className="panel">
      <h2>Saved assessment history</h2>
      <p className="muted">Each saved assessment preserves the source sample identity, measured values, entered limits, ideal values, weight references, standard source, method and calculated result as they were at assessment time. Later edits to a sample or calculation inputs do not rewrite saved history.</p>
      {!history.length && <p className="muted">No WQI assessments have been saved on this device yet.</p>}
      {history.map(item => <article key={item.id} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <strong>{item.sample?.sampleCode || item.sample?.stationName || item.sample?.id || 'Unknown sample'} — WQI {Number(item.result?.wqi).toFixed(2)}</strong>
            <div className="muted">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date not recorded'} · {item.method || item.result?.method || 'Method not recorded'}</div>
            <div className="muted">Reference: {item.standardSource || 'Not recorded'} · {item.result?.parameterCount ?? 0} parameters included</div>
          </div>
          <button type="button" onClick={async () => {
            if (!window.confirm('Delete this saved WQI assessment? This does not delete its source sample.')) return;
            try {
              await deleteWQIAssessment(item.id);
              setHistory(items => items.filter(entry => entry.id !== item.id));
            } catch (e) { setError('Could not delete assessment: ' + e.message); }
          }}>Delete</button>
        </div>
      </article>)}
    </section>
    <p className="muted">Use a consistent standard source and sampling context. This calculator does not decide potability or health risk, and it does not replace parameter-by-parameter compliance assessment.</p>
  </div>;
}
