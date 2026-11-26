import { useEffect, useMemo, useRef, useState } from 'react';
import { listSamples } from '../storage/samples.js';
import { calculateChargeBalance, calculatePiperDiagram, ION_DEFINITIONS } from '../engine/hydrochemistry.js';
import { downloadText } from '../storage/export.js';
import { buildHydrochemistryCSV } from '../engine/hydrochemistryExport.js';
import DurovSchoellerPanel from '../components/DurovSchoellerPanel.jsx';

const IONS = Object.keys(ION_DEFINITIONS);
const LABELS = { Ca: 'Calcium', Mg: 'Magnesium', Na: 'Sodium', K: 'Potassium', Cl: 'Chloride', SO4: 'Sulphate', HCO3: 'Bicarbonate', CO3: 'Carbonate', NO3: 'Nitrate', F: 'Fluoride' };
// Display chemistry with conventional case, Unicode subscripts and ionic charges.
// Lowercase registry keys remain unchanged for stored-data compatibility.
const ION_SYMBOLS = { Ca: 'Ca²⁺', Mg: 'Mg²⁺', Na: 'Na⁺', K: 'K⁺', Cl: 'Cl⁻', SO4: 'SO₄²⁻', HCO3: 'HCO₃⁻', CO3: 'CO₃²⁻', NO3: 'NO₃⁻', F: 'F⁻' };
const GROUP_LABELS = { Ca: 'Ca²⁺', Mg: 'Mg²⁺', NaK: 'Na⁺ + K⁺', Cl: 'Cl⁻', SO4: 'SO₄²⁻', HCO3CO3: 'HCO₃⁻ + CO₃²⁻' };

export default function HydrochemistryPage() {
  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [error, setError] = useState('');
  const [piperView, setPiperView] = useState({ x: 0, y: 0, zoom: 1 });
  const piperDrag = useRef(null);
  useEffect(() => { listSamples().then(setSamples).catch(e => setError(e.message)); }, []);
  const sample = samples.find(s => String(s.id) === String(sampleId)) || samples[0] || null;
  const chemistry = useMemo(() => {
    if (!sample) return null;
    const ions = Object.fromEntries(IONS.map(ion => [ion, sample.parameters?.[ion.toLowerCase()]?.canonical ?? null]));
    try {
      return { ions, balance: calculateChargeBalance(ions), piper: calculatePiperDiagram(ions) };
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
              <td>{LABELS[ion]} ({ION_SYMBOLS[ion]})</td><td>{ION_DEFINITIONS[ion].type}</td>
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
        <p className="muted">Major-ion percentages are normalized independently on a meq/L basis. The diagram requires all three groups in each triangle to be measured; an explicitly measured zero is valid, but a blank group is not assumed to be zero.</p>
        <div className="form-grid">
          <div><h3>Cation triangle (%)</h3>{pct(chemistry.piper.cations).map(item => <p key={item.key}>{GROUP_LABELS[item.key] || item.key}: <strong>{item.value.toFixed(1)}%</strong></p>)}</div>
          <div><h3>Anion triangle (%)</h3>{pct(chemistry.piper.anions).map(item => <p key={item.key}>{GROUP_LABELS[item.key] || ION_SYMBOLS[item.key] || item.key}: <strong>{item.value.toFixed(1)}%</strong></p>)}</div>
        </div>
        <h3>Piper trilinear diagram</h3>
        {chemistry.piper.coordinates.cations && chemistry.piper.coordinates.anions && chemistry.piper.coordinates.diamond ? (() => {
          const h = Math.sqrt(3) / 2;
          const point = p => `${p.x * 250},${(2.05 - p.y) * 190}`;
          const cat = chemistry.piper.coordinates.cations;
          const ani = chemistry.piper.coordinates.anions;
          const dia = chemistry.piper.coordinates.diamond;
          const viewWidth = 600 / piperView.zoom;
          const viewHeight = 420 / piperView.zoom;
          const clamp = (value, max) => Math.max(0, Math.min(max, value));
          function zoomPiper(factor) {
            setPiperView(current => {
              const zoom = Math.max(1, Math.min(4, current.zoom * factor));
              const width = 600 / zoom;
              const height = 420 / zoom;
              return { zoom, x: clamp(current.x + (600 / current.zoom - width) / 2, 600 - width), y: clamp(current.y + (420 / current.zoom - height) / 2, 420 - height) };
            });
          }
          function startPiperPan(event) {
            if (piperView.zoom <= 1) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            piperDrag.current = { clientX: event.clientX, clientY: event.clientY, x: piperView.x, y: piperView.y };
          }
          function movePiperPan(event) {
            const start = piperDrag.current;
            if (!start) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const dx = (event.clientX - start.clientX) * viewWidth / rect.width;
            const dy = (event.clientY - start.clientY) * viewHeight / rect.height;
            setPiperView(current => ({ ...current, x: clamp(start.x - dx, 600 - viewWidth), y: clamp(start.y - dy, 420 - viewHeight) }));
          }
          function endPiperPan() { piperDrag.current = null; }
          return <div style={{width:'100%',overflowX:'auto'}}>
            <div className="button-row" role="group" aria-label="Piper diagram navigation" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
              <button type="button" onClick={() => zoomPiper(1.25)} disabled={piperView.zoom >= 4} aria-label="Zoom in on Piper diagram">Zoom in +</button>
              <button type="button" onClick={() => zoomPiper(0.8)} disabled={piperView.zoom <= 1} aria-label="Zoom out on Piper diagram">Zoom out −</button>
              <button type="button" onClick={() => { piperDrag.current = null; setPiperView({ x: 0, y: 0, zoom: 1 }); }} disabled={piperView.zoom === 1 && piperView.x === 0 && piperView.y === 0}>Reset view</button>
              <span className="muted" aria-live="polite">{Math.round(piperView.zoom * 100)}% zoom</span>
            </div>
            <svg viewBox={`${piperView.x} ${piperView.y} ${viewWidth} ${viewHeight}`} role="img" aria-label="Piper trilinear diagram showing cation and anion triangles and central diamond. Zoom in, then drag to pan." onPointerDown={startPiperPan} onPointerMove={movePiperPan} onPointerUp={endPiperPan} onPointerCancel={endPiperPan} style={{width:'100%',minWidth:320,maxHeight:440,touchAction:'none',cursor:piperView.zoom > 1 ? 'grab' : 'default',userSelect:'none'}}>
              <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8">
                <path d={`M 0,389.5 L 250,389.5 L 125,${(2.05-h)*190} Z`} />
                <path d={`M 300,389.5 L 550,389.5 L 425,${(2.05-h)*190} Z`} />
                <path d={`M 150,${(2.05-h*1.2)*190} L 275,${(2.05-1.9052558883)*190} L 400,${(2.05-h*1.2)*190} L 275,${(2.05-0.1732050808)*190} Z`} />
              </g>
              <g fill="currentColor" fontSize="12">
                <text x="0" y="410">Ca²⁺</text><text x="250" y="410" textAnchor="end">Na⁺ + K⁺</text><text x="125" y="185" textAnchor="middle">Mg²⁺</text>
                <text x="300" y="410">HCO₃⁻ + CO₃²⁻</text><text x="550" y="410" textAnchor="end">Cl⁻</text><text x="425" y="185" textAnchor="middle">SO₄²⁻</text>
              </g>
              <g fill="#2563eb" stroke="white" strokeWidth="2"><circle cx={cat.x*250} cy={(2.05-cat.y)*190} r="6"/></g>
              <g fill="#0d9488" stroke="white" strokeWidth="2"><circle cx={ani.x*250} cy={(2.05-ani.y)*190} r="6"/></g>
              <g fill="#d97706" stroke="white" strokeWidth="2"><circle cx={dia.x*250} cy={(2.05-dia.y)*190} r="7"/></g>
            </svg>
            <p className="muted">Cation point <span style={{color:'#2563eb'}}>●</span> · Anion point <span style={{color:'#0d9488'}}>●</span> · Diamond projection <span style={{color:'#d97706'}}>●</span></p>
          </div>;
        })() : <p className="notice">Piper diagram unavailable: measure Ca, Mg, Na+K and Cl, SO₄, HCO₃+CO₃ (including measured zeros where appropriate). Missing groups are not treated as zero.</p>}
        <p><strong>Hydrochemical facies:</strong> {chemistry.piper.facies.label}</p>
        <DurovSchoellerPanel ions={chemistry.ions} auxiliary={{
          pH: sample.parameters?.ph?.canonical ?? null,
          tds: sample.parameters?.tds?.canonical ?? null
        }} />
        <button type="button" className="primary" onClick={exportCSV}>Export hydrochemistry CSV</button>
      </>}
    </section>
    <p className="muted">Interpretation note: a charge-balance result is a quality-control check, not proof that the analysis is valid. Confirm units, alkalinity reporting, analytical detection limits and the selected ions before assigning hydrochemical facies.</p>
  </div>;
}
