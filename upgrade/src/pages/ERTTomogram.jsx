import React, { useMemo } from 'react';

// Visual interpolation of imported inversion cells only. This is not an inversion solver.
function interpolate(points, x, depth) {
  let weighted = 0, weights = 0;
  for (const p of points) {
    const d2 = (p.x - x) ** 2 + (p.depth - depth) ** 2;
    if (d2 < 1e-12) return p.resistivity;
    const w = 1 / d2;
    weighted += Math.log10(p.resistivity) * w;
    weights += w;
  }
  return 10 ** (weighted / weights);
}

function colour(value, min, max) {
  const t = Math.max(0, Math.min(1, (Math.log10(value) - Math.log10(min)) /
    (Math.log10(max) - Math.log10(min) || 1)));
  // Continuous blue-cyan-yellow-red scale in perceptual steps.
  const stops = [[37,99,235],[6,182,212],[250,204,21],[220,38,38]];
  const scaled = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const rgb = stops[i].map((v,k) => Math.round(v * (1-f) + stops[i+1][k] * f));
  return `rgb(${rgb.join(',')})`;
}

export default function ERTTomogram({ models = [] }) {
  const points = useMemo(() => models.flatMap(model =>
    (model.cells || []).map(p => ({...p, lineId: model.lineId || 'Unlabelled line'}))
  ), [models]);
  const grid = useMemo(() => {
    if (points.length < 6) return null;
    const xs = [...new Set(points.map(p => p.x))];
    const zs = [...new Set(points.map(p => p.depth))];
    const pairs = new Set(points.map(p => `${p.x}|${p.depth}`));
    // Require a genuinely two-dimensional imported grid; do not turn a diagonal
    // list of isolated points into a misleading section.
    if (xs.length < 3 || zs.length < 2 || pairs.size / (xs.length * zs.length) < 0.35) return null;
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const z0 = Math.min(...zs), z1 = Math.max(...zs);
    const cols = Math.min(60, Math.max(24, xs.length * 3));
    const rows = Math.min(36, Math.max(12, zs.length * 3));
    const values = [];
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const x = x0 + (c + 0.5) / cols * (x1 - x0);
      const depth = z0 + (r + 0.5) / rows * (z1 - z0);
      values.push({ c, r, value: interpolate(points, x, depth) });
    }
    return { cols, rows, values, x0, x1, z0, z1 };
  }, [points]);
  if (!points.length) return null;
  const min = Math.min(...points.map(p => p.resistivity));
  const max = Math.max(...points.map(p => p.resistivity));
  return <section aria-label="Interpolated ERT resistivity section" style={{marginTop:20}}>
    <h2>2D resistivity section (interpolated imported model)</h2>
    {!grid ? <p role="status" className="notice">
      A continuous section is not shown yet. This dataset is too sparse or does not cover a two-dimensional grid.
      Import a gridded inversion export with multiple distance positions at multiple depths. The original points remain available above.
    </p> : <>
      <p className="muted">Log-resistivity inverse-distance interpolation of imported inversion cells. This is visualisation only; no inversion is performed by this app. Interpret with the original inversion report and geological control.</p>
      <svg viewBox="0 0 760 390" role="img" aria-label="Interpolated resistivity tomogram" style={{width:'100%',background:'#fff',border:'1px solid #cbd5e1'}}>
        <text x="65" y="16" fontSize="12" fill="#334155">Depth (m)</text>
        <text x="350" y="375" fontSize="12" fill="#334155">Distance along line (m)</text>
        <g transform="translate(65 28)">
          {grid.values.map(cell => <rect key={cell.r+'-'+cell.c}
            x={cell.c * 650/grid.cols} y={cell.r * 300/grid.rows}
            width={650/grid.cols + 0.4} height={300/grid.rows + 0.4}
            fill={colour(cell.value,min,max)} />)}
        </g>
        <path d="M65 28V328H715" fill="none" stroke="#334155" strokeWidth="1.5"/>
        <text x="65" y="346" fontSize="11" fill="#475569">{grid.x0} m</text>
        <text x="680" y="346" fontSize="11" fill="#475569">{grid.x1} m</text>
        <text x="18" y="36" fontSize="11" fill="#475569">{grid.z0} m</text>
        <text x="18" y="328" fontSize="11" fill="#475569">{grid.z1} m</text>
      </svg>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:6}}>
        <span>Lower: {min} Ωm</span><span>Logarithmic colour scale</span><span>Higher: {max} Ωm</span>
      </div>
    </>}
  </section>;
}
