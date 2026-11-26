import { useEffect, useMemo, useState } from 'react';
import { listSamples } from '../storage/samples.js';
import { calculateChargeBalance, calculatePiperPercentages, ION_DEFINITIONS } from '../engine/hydrochemistry.js';
import { downloadText } from '../storage/export.js';
import { buildHydrochemistryCSV } from '../engine/hydrochemistryExport.js';

const IONS = Object.keys(ION_DEFINITIONS);
const LABELS = { Ca: 'Calcium', Mg: 'Magnesium', Na: 'Sodium', K: 'Potassium', Cl: 'Chloride', SO4: 'Sulphate', HCO3: 'Bicarbonate', CO3: 'Carbonate', NO3: 'Nitrate', F: 'Fluoride' };

export default function HydrochemistryPage() {
  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { listSamples().then(setSamples).catch(e => setError(e.message)); }, []);
  const sample = samples.find(s => String(s.id) === String(sampleId)) || samples[0] || null;
  const chemistry = useMemo(() => {
    if (!sample) return null;
    const ions = Object.fromEntries(IONS.map(ion => [ion, sample.parameters?.[ion.toLowerCase()]?.canonical ?? null]));
    try {
      return { ions, balance: calculateChargeBalance(ions), piper: calculatePiperPercentages(ions) };
    } catch (e) { return { ions, error: e.message }; }
  }, [sample]);
  function exportCSV() {
    if (!sample || !chemistry || chemistry.error) return;
    const csv = buildHydrochemistryCSV(sample, chemistry.ions, chemistry.balance, ION_DEFINITIONS);
    downloadText('hydrochemistry-' + (sample.sampleCode || sample.id) + '.csv',
      csv, 'text/csv;charset=utf-8');
  }
  const pct = group => group ? Object.entries(group).map(([key, value]) => ({ key, value })) : [];
  return <div className="page">
    <p className="eyebrow">AQUEOUS GEOCHEMISTRY</p>
    <h1>Hydrochemistry</h1>
    <p className="muted">Major-ion conversion, charge-balance error (CBE), and Piper ion-group percentages from saved water samples. Concentrations are read from the sample's canonical mg/L values. Blank ions remain unmeasured.</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <section className="panel">
      <label>Select saved sample
        <select value={sample?.id || ''} onChange={e => setSampleId(e.target.value)}>
          {samples.map(s => <option key={s.id} value={s.id}>{s.sampleCode || s.stationName || s.id} — {s.collectionDate || 'Undated'}</option>)}
        </select>
      </label>
      {!samples.length && <p className="notice">No saved samples. Add a sample and enter major-ion results first.</p>}
      {chemistry?.error && <p className="notice error">{chemistry.error}</p>}
      {chemistry && !chemistry.error && <>
        <h2>Major-ion results</h2>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:520}}>
            <thead><tr><th align="left">Ion</th><th align="left">Type</th><th align="right">mg/L</th><th align="right">meq/L</th></tr></thead>
            <tbody>{IONS.map(ion => <tr key={ion} style={{borderTop:'1px solid #e2e8f0'}}>
              <td>{LABELS[ion]} ({ion})</td><td>{ION_DEFINITIONS[ion].type}</td>
              <td align="right">{chemistry.ions[ion] == null ? 'Unmeasured' : Number(chemistry.ions[ion]).toFixed(3)}</td>
              <td align="right">{chemistry.balance.meq[ion] == null ? '—' : chemistry.balance.meq[ion].toFixed(4)}</td>
            </tr>)}</tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid #64748b',fontWeight:700}}>
                <td colSpan="3">Total measured cations (meq/L)</td>
                <td align="right">{chemistry.balance.cationTotal.toFixed(4)}</td>
              </tr>
              <tr style={{fontWeight:700}}>
                <td colSpan="3">Total measured anions (meq/L)</td>
                <td align="right">{chemistry.balance.anionTotal.toFixed(4)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <h2>Charge-balance assessment</h2>
        <div className="stat-grid">
          <div className="stat-card"><small>Cations (meq/L)</small><strong>{chemistry.balance.cationTotal.toFixed(3)}</strong></div>
          <div className="stat-card"><small>Anions (meq/L)</small><strong>{chemistry.balance.anionTotal.toFixed(3)}</strong></div>
          <div className="stat-card"><small>CBE (%)</small><strong>{chemistry.balance.errorPercent == null ? 'N/A' : chemistry.balance.errorPercent.toFixed(2)}</strong></div>
        </div>
        <p className="notice">{chemistry.balance.status}. The ±5% band is a screening convention; assess analytical quality and the suitability of the measured ion suite before interpretation.</p>
        <h2>Piper ion-group percentages</h2>
        <p className="muted">Each triangle group is normalized independently from measured equivalents. These are the plotted ternary coordinates, not a completed Piper diagram or facies classification.</p>
        <div className="form-grid">
          <div><h3>Cation triangle (%)</h3>{pct(chemistry.piper.cations).map(item => <p key={item.key}>{item.key}: <strong>{item.value.toFixed(1)}%</strong></p>)}</div>
          <div><h3>Anion triangle (%)</h3>{pct(chemistry.piper.anions).map(item => <p key={item.key}>{item.key}: <strong>{item.value.toFixed(1)}%</strong></p>)}</div>
        </div>
        <button type="button" className="primary" onClick={exportCSV}>Export hydrochemistry CSV</button>
      </>}
    </section>
    <p className="muted">Interpretation note: a charge-balance result is a quality-control check, not proof that the analysis is valid. Confirm units, alkalinity reporting, analytical detection limits and the selected ions before assigning hydrochemical facies.</p>
  </div>;
}
