import { useMemo } from 'react';
import { calculateDurovDiagram, calculateSchoellerSeries } from '../engine/hydrochemistry.js';

const ionLabel = { Ca: 'Ca²⁺', Mg: 'Mg²⁺', NaK: 'Na⁺ + K⁺', Cl: 'Cl⁻', SO4: 'SO₄²⁻', HCO3CO3: 'HCO₃⁻ + CO₃²⁻' };

function DurovPlot({ ions }) {
  const result = useMemo(() => calculateDurovDiagram(ions), [ions]);
  const point = result.coordinates.square;
  const x0 = 80, y0 = 28, size = 300;
  const x = point ? x0 + point.x * size : null;
  const y = point ? y0 + (1 - point.y) * size : null;
  return <section className="panel" aria-labelledby="durov-title">
    <h2 id="durov-title">Durov diagram</h2>
    <p className="muted">Central-square projection of independently normalized major-ion equivalents. The point is plotted only when all required cation and anion groups are measured.</p>
    {point ? <>
      <div style={{overflowX:'auto'}}>
        <svg viewBox="0 0 470 390" role="img" aria-label="Durov central square projection of the selected sample" style={{width:'100%',maxWidth:520,minWidth:300}}>
          <rect x={x0} y={y0} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5"/>
          {[1,2].map(n => <g key={n} stroke="currentColor" opacity=".28" strokeDasharray="4 4">
            <line x1={x0+n*size/3} y1={y0} x2={x0+n*size/3} y2={y0+size}/>
            <line x1={x0} y1={y0+n*size/3} x2={x0+size} y2={y0+n*size/3}/>
          </g>)}
          <g fill="currentColor" fontSize="11">
            <text x={x0} y="17">Cl⁻</text>
            <text x={x0+size} y="17" textAnchor="end">HCO₃⁻ + CO₃²⁻</text>
            <text x={x0-8} y={y0+size+17} textAnchor="end">Na⁺ + K⁺</text>
            <text x={x0+size+8} y={y0+size+17}>Ca²⁺</text>
            <text x={x0+size/2} y={y0+size+36} textAnchor="middle">Anion projection →</text>
            <text transform={`translate(18 ${y0+size/2}) rotate(-90)`} textAnchor="middle">Cation projection →</text>
            <text x={x0-5} y={y0+size+3} textAnchor="end">0</text>
            <text x={x0+size+5} y={y0+size+3}>100%</text>
            <text x={x0-5} y={y0+8} textAnchor="end">100%</text>
            <text x={x0+size/2} y={y0+size/2} textAnchor="middle" opacity=".5">Durov field</text>
          </g>
          <circle cx={x} cy={y} r="7" fill="#0d9488" stroke="white" strokeWidth="2"/>
          <line x1={x} y1={y} x2={x} y2={y0+size} stroke="#0d9488" strokeDasharray="3 3" opacity=".65"/>
          <line x1={x0} y1={y} x2={x} y2={y} stroke="#0d9488" strokeDasharray="3 3" opacity=".65"/>
        </svg>
      </div>
      <div className="form-grid">
        <div><h3>Cation groups</h3>{Object.entries(result.cations).map(([k,v]) => <p key={k}>{ionLabel[k]}: <strong>{v.toFixed(1)}%</strong></p>)}</div>
        <div><h3>Anion groups</h3>{Object.entries(result.anions).map(([k,v]) => <p key={k}>{ionLabel[k]}: <strong>{v.toFixed(1)}%</strong></p>)}</div>
      </div>
      <p className="muted">Square coordinates: x = HCO₃⁻ + CO₃²⁻ + ½SO₄²⁻; y = Ca²⁺ + ½Mg²⁺ (each as % of its own ion total). This projection is a compositional classification aid, not a unique diagnosis of geochemical processes.</p>
    </> : <p className="notice">Durov projection unavailable. Measure Ca, Mg, Na, K, Cl, SO₄, HCO₃ and CO₃. An unmeasured ion is not treated as zero.</p>}
  </section>;
}

function SchoellerPlot({ ions }) {
  const series = useMemo(() => calculateSchoellerSeries(ions), [ions]);
  const positive = series.filter(p => p.status === 'plottable').map(p => p.meqL);
  if (!positive.length) return <section className="panel"><h2>Schoeller–Berkaloff diagram</h2><p className="notice">No positive measured major-ion values are available to plot on a logarithmic axis.</p></section>;
  const minLog = Math.floor(Math.min(...positive.map(Math.log10)));
  const maxLog = Math.ceil(Math.max(...positive.map(Math.log10)));
  const lo = Math.min(minLog, -2), hi = Math.max(maxLog, 1);
  const left=54, top=24, width=560, height=250;
  const px = i => left + i * width / (series.length-1);
  const py = v => top + (hi-Math.log10(v))*height/(hi-lo);
  const segments=[];
  let current=[];
  series.forEach((p,i) => {
    if (p.status === 'plottable') current.push([px(i),py(p.meqL)]);
    else if (current.length) { segments.push(current); current=[]; }
  });
  if(current.length) segments.push(current);
  return <section className="panel" aria-labelledby="schoeller-title">
    <h2 id="schoeller-title">Schoeller–Berkaloff diagram</h2>
    <p className="muted">Major-ion concentrations are plotted in meq/L on a logarithmic vertical axis. Missing results remain gaps; measured zeroes are marked at the baseline and are not shifted to an artificial positive value.</p>
    <div style={{overflowX:'auto'}}>
      <svg viewBox="0 0 650 335" role="img" aria-label="Schoeller Berkaloff logarithmic plot of major-ion concentrations in milliequivalents per litre" style={{width:'100%',minWidth:520}}>
        {[...Array(hi-lo+1)].map((_,i)=>{const v=10**(hi-i);const yy=top+i*height/(hi-lo);return <g key={i} stroke="currentColor" opacity=".2"><line x1={left} y1={yy} x2={left+width} y2={yy}/><text x={left-8} y={yy+4} fill="currentColor" stroke="none" textAnchor="end" fontSize="10">{v}</text></g>;})}
        <line x1={left} y1={top} x2={left} y2={top+height} stroke="currentColor"/>
        <line x1={left} y1={top+height} x2={left+width} y2={top+height} stroke="currentColor"/>
        {segments.map((pts,i)=><polyline key={i} points={pts.map(p=>p.join(',')).join(' ')} fill="none" stroke="#2563eb" strokeWidth="2.5"/>)}
        {series.map((p,i)=><g key={p.key}>
          {p.status==='plottable' && <circle cx={px(i)} cy={py(p.meqL)} r="4.5" fill="#2563eb"/>}
          {p.status==='measured-zero-not-plottable-on-log-axis' && <><circle cx={px(i)} cy={top+height+1} r="4" fill="white" stroke="#d97706" strokeWidth="2"/><text x={px(i)} y={top+height-8} textAnchor="middle" fontSize="9" fill="#d97706">0</text></>}
          <text x={px(i)} y={top+height+23} textAnchor="middle" fontSize="10" fill="currentColor">{p.label}</text>
        </g>)}
        <text x="12" y={top+height/2} transform={`rotate(-90 12 ${top+height/2})`} fill="currentColor" fontSize="11" textAnchor="middle">meq/L (log scale)</text>
        <text x={left+width/2} y="330" fill="currentColor" fontSize="11" textAnchor="middle">Major-ion groups</text>
      </svg>
    </div>
    <p className="muted">A line is broken at every unmeasured or zero-valued group so the chart does not imply a continuous measured profile across missing data.</p>
  </section>;
}

export default function DurovSchoellerPanel({ ions }) {
  return <><DurovPlot ions={ions}/><SchoellerPlot ions={ions}/></>;
}
