import React, { useMemo, useState } from 'react';
import { buildERTGrid } from '../engine/ert.js';

function colour(value, min, max) {
  const t = Math.max(0, Math.min(1, (Math.log10(value) - Math.log10(min)) /
    (Math.log10(max) - Math.log10(min) || 1)));
  const stops = [[37,99,235],[6,182,212],[250,204,21],[220,38,38]];
  const scaled = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const rgb = stops[i].map((v,k) => Math.round(v * (1-f) + stops[i+1][k] * f));
  return `rgb(${rgb.join(',')})`;
}

const initialView = { x: 0, y: 0, w: 760, h: 390 };
export default function ERTTomogram({ models = [], onCellSelect = () => {} }) {
  const [view, setView] = useState(initialView);
  const [drag, setDrag] = useState(null);
  const points = useMemo(() => models.flatMap(model =>
    (model.cells || []).map(p => ({...p, lineId: model.lineId || 'Unlabelled line'}))
  ), [models]);
  const grid = useMemo(() => buildERTGrid(points), [points]);
  if (!points.length) return null;
  const min = Math.min(...points.map(p => p.resistivity));
  const max = Math.max(...points.map(p => p.resistivity));
  const zoom = factor => setView(old => {
    const w = Math.max(190, Math.min(760, old.w * factor));
    const h = Math.max(98, Math.min(390, old.h * factor));
    return { ...old, x: Math.max(0, Math.min(760-w, old.x+(old.w-w)/2)),
      y: Math.max(0, Math.min(390-h, old.y+(old.h-h)/2)), w, h };
  });
  function pan(dx,dy) {
    setView(old => ({...old,x:Math.max(0,Math.min(760-old.w,old.x+dx*old.w)),
      y:Math.max(0,Math.min(390-old.h,old.y+dy*old.h))}));
  }
  function selectNearest(event) {
    if (!grid) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = view.x + (event.clientX-rect.left)/rect.width*view.w;
    const svgY = view.y + (event.clientY-rect.top)/rect.height*view.h;
    const fx = Math.max(0,Math.min(1,(svgX-65)/650));
    const fz = Math.max(0,Math.min(1,(svgY-28)/300));
    const targetX = grid.x0 + fx*(grid.x1-grid.x0);
    const targetDepth = grid.z0 + fz*(grid.z1-grid.z0);
    const nearest = points.reduce((best,p) => !best ||
      Math.hypot((p.x-targetX)/(grid.x1-grid.x0),(p.depth-targetDepth)/(grid.z1-grid.z0)) <
      Math.hypot((best.x-targetX)/(grid.x1-grid.x0),(best.depth-targetDepth)/(grid.z1-grid.z0)) ? p : best,null);
    if (nearest) onCellSelect(nearest);
  }
  return <section aria-label="Interpolated ERT resistivity section" style={{marginTop:20}}>
    <h2>2D resistivity section (interpolated imported model)</h2>
    {!grid ? <p role="status" className="notice">
      A continuous section is not shown yet. This dataset is too sparse or does not cover a two-dimensional grid.
      Import a gridded inversion export with multiple distance positions at multiple depths. The original points remain available above.
    </p> : <>
      <p className="muted">Log-resistivity inverse-distance interpolation of imported inversion cells. This is visualisation only; no inversion is performed by this app. Select the section to inspect the nearest imported point. Drag to pan or use the controls; interpolation is not a new measurement.</p>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
        <button type="button" onClick={()=>zoom(0.75)} aria-label="Zoom in">＋ Zoom in</button>
        <button type="button" onClick={()=>zoom(1.33)} aria-label="Zoom out">− Zoom out</button>
        <button type="button" onClick={()=>setView(initialView)}>Reset view</button>
        <button type="button" onClick={()=>pan(-0.2,0)}>← Pan</button>
        <button type="button" onClick={()=>pan(0.2,0)}>Pan →</button>
        <button type="button" onClick={()=>pan(0,-0.2)}>↑ Pan</button>
        <button type="button" onClick={()=>pan(0,0.2)}>Pan ↓</button>
      </div>
      <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} role="img" aria-label="Interpolated resistivity tomogram with zoom and pan" onClick={selectNearest}
        onPointerDown={event=>{if(event.button!==0)return;event.currentTarget.setPointerCapture?.(event.pointerId);setDrag({x:event.clientX,y:event.clientY,view});}}
        onPointerMove={event=>{if(!drag)return;const rect=event.currentTarget.getBoundingClientRect();setView({...drag.view,x:Math.max(0,Math.min(760-drag.view.w,drag.view.x-(event.clientX-drag.x)*drag.view.w/rect.width)),y:Math.max(0,Math.min(390-drag.view.h,drag.view.y-(event.clientY-drag.y)*drag.view.h/rect.height))});}}
        onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}
        style={{width:'100%',background:'#fff',border:'1px solid #cbd5e1',touchAction:'pan-y',cursor:drag?'grabbing':'grab'}}>
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
