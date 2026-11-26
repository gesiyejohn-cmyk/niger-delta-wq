import { useMemo } from 'react';
import { calculateDurovDiagram, calculateSchoellerSeries } from '../engine/hydrochemistry.js';

const ionLabel = { Ca: 'Ca²⁺', Mg: 'Mg²⁺', NaK: 'Na⁺ + K⁺', Cl: 'Cl⁻', SO4: 'SO₄²⁻', HCO3CO3: 'HCO₃⁻ + CO₃²⁻' };

function DurovPlot({ ions }) {
  const result = useMemo(() => calculateDurovDiagram(ions), [ions]);
  const point = result.coordinates.square;
  const cation = result.coordinates.cationTriangle;
  const anion = result.coordinates.anionTriangle;
  const triHeight = Math.sqrt(3) / 2;
  const chartPoint = (p, x0, y0, width) => ({
    x: x0 + p.x * width,
    y: y0 + (triHeight - p.y) * width
  });
  const cationDot = cation && chartPoint(cation, 35, 68, 220);
  const anionDot = anion && chartPoint(anion, 645, 68, 220);
  const squareX = 340, squareY = 68, squareSize = 220;
  const squareDot = point && {
    x: squareX + point.x * squareSize,
    y: squareY + (1 - point.y) * squareSize
  };
  return <section className="panel" aria-labelledby="durov-title">
    <h2 id="durov-title">Durov diagram</h2>
    <p className="muted">Major-ion Durov representation: cation and anion ternary fields with their central-square projection. All required major-ion groups must be measured; blank ions are never assumed to be zero.</p>
    {point && cation && anion ? <>
      <div style={{overflowX:'auto'}}>
        <svg viewBox="0 0 900 340" role="img" aria-label="Durov diagram showing cation ternary field, central square projection, and anion ternary field" style={{width:'100%',minWidth:760}}>
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={`M 35 ${68+triHeight*220} L 255 ${68+triHeight*220} L 145 68 Z`}/>
            <path d={`M 645 ${68+triHeight*220} L 865 ${68+triHeight*220} L 755 68 Z`}/>
            <rect x={squareX} y={squareY} width={squareSize} height={squareSize}/>
          </g>
          <g stroke="currentColor" opacity=".25" strokeDasharray="4 4">
            {[1,2].map(n=><g key={n}>
              <line x1={squareX+n*squareSize/3} y1={squareY} x2={squareX+n*squareSize/3} y2={squareY+squareSize}/>
              <line x1={squareX} y1={squareY+n*squareSize/3} x2={squareX+squareSize} y2={squareY+n*squareSize/3}/>
            </g>)}
            <path d={`M 35 ${68+triHeight*220} L 145 ${68+triHeight*220/2} L 255 ${68+triHeight*220} M 90 ${68+triHeight*220/2} L 200 ${68+triHeight*220/2} M 200 ${68+triHeight*220/2} L 145 68`} fill="none"/>
            <path d={`M 645 ${68+triHeight*220} L 755 ${68+triHeight*220/2} L 865 ${68+triHeight*220} M 700 ${68+triHeight*220/2} L 810 ${68+triHeight*220/2} M 810 ${68+triHeight*220/2} L 755 68`} fill="none"/>
          </g>
          <g fill="currentColor" fontSize="12">
            <text x="145" y="28" textAnchor="middle" fontWeight="600">Cation triangle</text>
            <text x="450" y="28" textAnchor="middle" fontWeight="600">Central square</text>
            <text x="755" y="28" textAnchor="middle" fontWeight="600">Anion triangle</text>
            <text x="35" y={68+triHeight*220+20}>Ca²⁺</text>
            <text x="145" y="58" textAnchor="middle">Mg²⁺</text>
            <text x="255" y={68+triHeight*220+20} textAnchor="end">Na⁺ + K⁺</text>
            <text x="645" y={68+triHeight*220+20}>Cl⁻</text>
            <text x="755" y="58" textAnchor="middle">SO₄²⁻</text>
            <text x="865" y={68+triHeight*220+20} textAnchor="end">HCO₃⁻ + CO₃²⁻</text>
            <text x={squareX} y="58">Cl⁻ / Na⁺ + K⁺</text>
            <text x={squareX+squareSize} y="58" textAnchor="end">HCO₃⁻ + CO₃²⁻ / Ca²⁺</text>
            <text x={squareX+squareSize/2} y={squareY+squareSize+20} textAnchor="middle">Anion projection →</text>
            <text transform={`translate(${squareX-14} ${squareY+squareSize/2}) rotate(-90)`} textAnchor="middle">Cation projection →</text>
          </g>
          {cationDot && <circle cx={cationDot.x} cy={cationDot.y} r="7" fill="#2563eb" stroke="white" strokeWidth="2"/>}
          {anionDot && <circle cx={anionDot.x} cy={anionDot.y} r="7" fill="#0d9488" stroke="white" strokeWidth="2"/>}
          {squareDot && <>
            <line x1={squareDot.x} y1={squareDot.y} x2={squareDot.x} y2={squareY+squareSize} stroke="#0d9488" strokeDasharray="3 3" opacity=".7"/>
            <line x1={squareX} y1={squareDot.y} x2={squareDot.x} y2={squareDot.y} stroke="#0d9488" strokeDasharray="3 3" opacity=".7"/>
            <circle cx={squareDot.x} cy={squareDot.y} r="7" fill="#d97706" stroke="white" strokeWidth="2"/>
          </>}
        </svg>
      </div>
      <div className="form-grid">
        <div><h3>Cation groups (meq %)</h3>{Object.entries(result.cations).map(([k,v]) => <p key={k}>{ionLabel[k]}: <strong>{v.toFixed(1)}%</strong></p>)}</div>
        <div><h3>Anion groups (meq %)</h3>{Object.entries(result.anions).map(([k,v]) => <p key={k}>{ionLabel[k]}: <strong>{v.toFixed(1)}%</strong></p>)}</div>
      </div>
      <p className="muted">The central square uses x = HCO₃⁻ + CO₃²⁻ + ½SO₄²⁻ and y = Ca²⁺ + ½Mg²⁺, each as a percentage of its own ion total. The classic major-ion fields are shown; auxiliary pH/TDS panels are not shown because those measurements are not currently passed into this chart.</p>
    </> : <p className="notice">Durov diagram unavailable. Measure Ca, Mg, Na, K, Cl, SO₄, HCO₃ and CO₃. An unmeasured ion is not treated as zero.</p>}
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
        <text x={left+width/2} y="330" fill="currentColor" fontSize="11" textAnchor="middle">Individual dissolved ions</text>
      </svg>
    </div>
    <p className="muted">A line is broken at every unmeasured or zero-valued group so the chart does not imply a continuous measured profile across missing data.</p>
  </section>;
}

export default function DurovSchoellerPanel({ ions }) {
  return <><DurovPlot ions={ions}/><SchoellerPlot ions={ions}/></>;
}
