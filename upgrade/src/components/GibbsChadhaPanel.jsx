import { calculateChadhaCoordinates, calculateGibbsRatios } from '../engine/hydrochemistry.js';

function GibbsPlot({ title, ratio, status, tds, label }) {
  const left = 58, top = 22, width = 520, height = 220;
  const x = tds > 0 ? left + (Math.log10(tds) / 4) * width : null;
  const y = ratio !== null ? top + (1 - ratio) * height : null;
  return <section className="panel">
    <h3>{title}</h3>
    <p className="muted">Measured TDS (mg/L; logarithmic axis) versus {label}. Ratios use meq/L.</p>
    {x !== null && y !== null ? <svg viewBox="0 0 610 290" role="img" aria-label={title + ' Gibbs diagram'}>
      {[0, .25, .5, .75, 1].map(v => <g key={v} stroke="currentColor" opacity=".2">
        <line x1={left} y1={top + (1-v)*height} x2={left+width} y2={top+(1-v)*height}/>
        <text x={left-9} y={top+(1-v)*height+4} textAnchor="end" fill="currentColor" stroke="none" fontSize="11">{v.toFixed(2)}</text>
      </g>)}
      {[1,10,100,1000,10000].map((v,i) => <g key={v} stroke="currentColor" opacity=".2">
        <line x1={left+i*width/4} y1={top} x2={left+i*width/4} y2={top+height}/>
        <text x={left+i*width/4} y={top+height+18} textAnchor="middle" fill="currentColor" stroke="none" fontSize="11">{v}</text>
      </g>)}
      <path d={`M ${left} ${top} V ${top+height} H ${left+width}`} fill="none" stroke="currentColor"/>
      <circle cx={x} cy={y} r="7" fill="#2563eb" stroke="white" strokeWidth="2"/>
      <text x={x+10} y={y-9} fill="currentColor" fontSize="11">{ratio.toFixed(3)}</text>
      <text x={left+width/2} y="282" textAnchor="middle" fill="currentColor" fontSize="11">TDS (mg/L, log scale)</text>
    </svg> : <p className="notice">Not plotted: {status}. A positive measured TDS and both measured ions in this ratio are required.</p>}
  </section>;
}

function ChadhaPlot({ result }) {
  const left=64, top=22, width=500, height=300;
  const x = result.x === null ? null : left + (result.x+100)*width/200;
  const y = result.y === null ? null : top + (100-result.y)*height/200;
  return <section className="panel">
    <h3>Chadha hydrochemical diagram</h3>
    <p className="muted">Signed equivalent-percentage differences: x = [(Ca+Mg) − (Na+K)] / total cations × 100; y = [(HCO₃+CO₃) − (Cl+SO₄)] / total anions × 100.</p>
    {x !== null && y !== null ? <svg viewBox="0 0 610 370" role="img" aria-label="Chadha diagram with four hydrochemical fields">
      <rect x={left} y={top} width={width/2} height={height/2} fill="#dbeafe" opacity=".5"/>
      <rect x={left+width/2} y={top} width={width/2} height={height/2} fill="#dcfce7" opacity=".5"/>
      <rect x={left} y={top+height/2} width={width/2} height={height/2} fill="#fef3c7" opacity=".5"/>
      <rect x={left+width/2} y={top+height/2} width={width/2} height={height/2} fill="#fce7f3" opacity=".5"/>
      <path d={`M ${left} ${top+height/2} H ${left+width} M ${left+width/2} ${top} V ${top+height}`} stroke="currentColor" strokeWidth="1.5"/>
      <rect x={left} y={top} width={width} height={height} fill="none" stroke="currentColor"/>
      <g fill="currentColor" fontSize="11">
        <text x={left+width*.25} y={top+18} textAnchor="middle">Alkaline earth–</text>
        <text x={left+width*.25} y={top+32} textAnchor="middle">bicarbonate type</text>
        <text x={left+width*.75} y={top+18} textAnchor="middle">Alkali–bicarbonate</text>
        <text x={left+width*.75} y={top+32} textAnchor="middle">type</text>
        <text x={left+width*.25} y={top+height-18} textAnchor="middle">Alkaline earth–</text>
        <text x={left+width*.25} y={top+height-4} textAnchor="middle">chloride type</text>
        <text x={left+width*.75} y={top+height-18} textAnchor="middle">Alkali–chloride</text>
        <text x={left+width*.75} y={top+height-4} textAnchor="middle">type</text>
        <text x={left} y={top+height+18} textAnchor="middle">−100</text>
        <text x={left+width/2} y={top+height+18} textAnchor="middle">0</text>
        <text x={left+width} y={top+height+18} textAnchor="middle">+100</text>
        <text x={left+width/2} y="365" textAnchor="middle">Alkaline earths ↔ alkalis (meq % difference)</text>
        <text transform={`translate(15 ${top+height/2}) rotate(-90)`} textAnchor="middle">Bicarbonate ↔ chloride/sulphate (meq % difference)</text>
        <text x={left-10} y={top+5} textAnchor="end">+100</text>
        <text x={left-10} y={top+height/2+4} textAnchor="end">0</text>
        <text x={left-10} y={top+height+4} textAnchor="end">−100</text>
      </g>
      <circle cx={x} cy={y} r="7" fill="#7c3aed" stroke="white" strokeWidth="2"/>
    </svg> : <p className="notice">Not plotted: {result.status}. All four cations (Ca, Mg, Na, K) and four anions (HCO₃, CO₃, Cl, SO₄) must be measured.</p>}
  </section>;
}

export default function GibbsChadhaPanel({ ions, tds }) {
  const gibbs = calculateGibbsRatios(ions, tds);
  const chadha = calculateChadhaCoordinates(ions);
  return <section aria-label="Gibbs and Chadha hydrochemical diagrams">
    <h2>Gibbs and Chadha diagrams</h2>
    <p className="muted">These are hydrochemical classification plots, not stand-alone proof of a geochemical process or water suitability. Interpret with lithology, climate, sampling context and analytical quality.</p>
    <GibbsPlot title="Gibbs cation ratio" ratio={gibbs.cation} status={gibbs.cationStatus} tds={gibbs.tds} label="Na⁺/(Na⁺ + Ca²⁺)"/>
    <GibbsPlot title="Gibbs anion ratio" ratio={gibbs.anion} status={gibbs.anionStatus} tds={gibbs.tds} label="Cl⁻/(Cl⁻ + HCO₃⁻)"/>
    <ChadhaPlot result={chadha}/>
  </section>;
}
