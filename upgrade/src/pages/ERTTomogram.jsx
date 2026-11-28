import React, { useMemo, useRef, useState } from 'react';
import { buildERTGrid } from '../engine/ert.js';
import { panERTView, zoomERTView } from '../engine/ertView.js';

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
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const drag = useRef(null);
  const points = useMemo(() => models.flatMap(model =>
    (model.cells || []).map(p => ({...p, lineId: model.lineId || 'Unlabelled line'}))
  ), [models]);
  const grid = useMemo(() => buildERTGrid(points), [points]);
  if (!points.length) return null;
  const min = Math.min(...points.map(p => p.resistivity));
  const max = Math.max(...points.map(p => p.resistivity));
  const viewWidth = 760 / view.zoom;
  const viewHeight = 390 / view.zoom;

  function zoom(factor) {
    setView(current => zoomERTView(current, factor));
  }

  function startPan(event) {
    if (view.zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { clientX: event.clientX, clientY: event.clientY, view };
  }

  function movePan(event) {
    if (!drag.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setView(panERTView(
      drag.current.view,
      event.clientX - drag.current.clientX,
      event.clientY - drag.current.clientY,
      rect.width,
      rect.height
    ));
  }

  function endPan() { drag.current = null; }

  return <section aria-label="Interpolated ERT resistivity section" style={{marginTop:20}}>
    <h2>2D resistivity section (interpolated imported model)</h2>
    {!grid ? <p role="status" className="notice">
      A continuous section is not shown yet. This dataset is too sparse or does not cover a two-dimensional grid.
      Import a gridded inversion export with multiple distance positions at multiple depths. The original points remain available above.
    </p> : <>
      <p className="muted">Log-resistivity inverse-distance interpolation of imported inversion cells. This is visualisation only; no inversion is performed by this app. Interpret with the original inversion report and geological control.</p>
      <div className="button-row" role="group" aria-label="ERT tomogram navigation" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
        <button type="button" onClick={() => zoom(1.25)} disabled={view.zoom >= 5} aria-label="Zoom in on ERT tomogram">Zoom in +</button>
        <button type="button" onClick={() => zoom(0.8)} disabled={view.zoom <= 1} aria-label="Zoom out on ERT tomogram">Zoom out −</button>
        <button type="button" onClick={() => { drag.current = null; setView({x:0,y:0,zoom:1}); }} disabled={view.zoom === 1 && view.x === 0 && view.y === 0}>Reset view</button>
        <span className="muted" aria-live="polite">{Math.round(view.zoom * 100)}% zoom · drag to pan when zoomed</span>
      </div>
      <svg viewBox={`${view.x} ${view.y} ${viewWidth} ${viewHeight}`} role="img" aria-label="Interpolated resistivity tomogram. Use zoom controls and drag to pan." onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} style={{width:'100%',background:'#fff',border:'1px solid #cbd5e1',touchAction:'none',cursor:view.zoom > 1 ? 'grab' : 'default',userSelect:'none'}}>
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
