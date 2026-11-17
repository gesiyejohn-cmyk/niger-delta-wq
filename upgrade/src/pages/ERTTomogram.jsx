import React, { useMemo, useRef, useState } from 'react';
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

const controlStyle = {
  border: '1px solid #94a3b8', borderRadius: 6, background: '#f8fafc',
  color: '#0f172a', padding: '7px 11px', fontWeight: 600, minWidth: 40
};

export default function ERTTomogram({ models = [] }) {
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const touchGesture = useRef(null);
  const suppressCellClick = useRef(false);
  const points = useMemo(() => models.flatMap(model =>
    (model.cells || []).map(p => ({...p, lineId: model.lineId || 'Unlabelled line'}))
  ), [models]);
  const grid = useMemo(() => buildERTGrid(points), [points]);
  if (!points.length) return null;
  const min = Math.min(...points.map(p => p.resistivity));
  const max = Math.max(...points.map(p => p.resistivity));
  const nearest = selected ? points.reduce((best, point) => {
    const distance = Math.hypot(Number(point.x) - selected.x, Number(point.depth) - selected.depth);
    return !best || distance < best.distance ? { point, distance } : best;
  }, null) : null;
  const viewWidth = 760 / zoom, viewHeight = 390 / zoom;
  const viewX = (760 - viewWidth) / 2 + pan.x;
  const viewY = (390 - viewHeight) / 2 + pan.y;

  return <section aria-label="Interpolated ERT resistivity section" style={{marginTop:20}}>
    <h2>2D Resistivity Survey Result</h2>
    <p className="muted" style={{marginTop:0}}>Groundwater investigation · Interpolated imported model</p>
    {!grid ? <p role="status" className="notice">
      A continuous section is not shown yet. This dataset is too sparse or does not cover a two-dimensional grid.
      Import a gridded inversion export with multiple distance positions at multiple depths. The original points remain available above.
    </p> : <>
      <p className="muted">Log-resistivity inverse-distance weighting (IDW) of imported model cells. Visualisation only; this app does not perform geophysical inversion. Interpret with the original inversion report and geological control.</p>
      <div aria-label="Tomogram navigation controls" style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',margin:'10px 0'}}>
        <button type="button" style={controlStyle} onClick={() => setZoom(v => Math.min(4, +(v + 0.25).toFixed(2)))} aria-label="Zoom in">＋</button>
        <button type="button" style={controlStyle} onClick={() => setZoom(v => Math.max(1, +(v - 0.25).toFixed(2)))} aria-label="Zoom out">−</button>
        <button type="button" style={controlStyle} onClick={() => {setZoom(1);setPan({x:0,y:0});}} aria-label="Reset zoom and position">Reset</button>
        <button type="button" style={controlStyle} onClick={() => setPan(p => ({...p,x:p.x-35/zoom}))} aria-label="Pan left">←</button>
        <button type="button" style={controlStyle} onClick={() => setPan(p => ({...p,x:p.x+35/zoom}))} aria-label="Pan right">→</button>
        <button type="button" style={controlStyle} onClick={() => setPan(p => ({...p,y:p.y-25/zoom}))} aria-label="Pan up">↑</button>
        <button type="button" style={controlStyle} onClick={() => setPan(p => ({...p,y:p.y+25/zoom}))} aria-label="Pan down">↓</button>
        <span style={{fontSize:12,color:'#475569'}}>{Math.round(zoom*100)}% zoom</span>
      </div>
      <div style={{width:'100%',overflow:'hidden',border:'1px solid #94a3b8',borderRadius:8,background:'#fff'}}>
        <svg viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} role="group"
          aria-label="Interactive interpolated resistivity tomogram. Select a coloured cell to inspect its estimated resistivity. Pinch to zoom and drag to pan."
          onWheel={event => { event.preventDefault(); setZoom(v => Math.max(1, Math.min(4, +(v * (event.deltaY < 0 ? 1.12 : 0.89)).toFixed(2)))); }}
          onTouchStart={event => {
            if (event.touches.length === 1) { const t=event.touches[0]; touchGesture.current={mode:"pan",x:t.clientX,y:t.clientY,pan}; }
            else if (event.touches.length >= 2) { const a=event.touches[0],b=event.touches[1]; touchGesture.current={mode:"pinch",distance:Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY),zoom,pan}; }
          }}
          onTouchMove={event => {
            const g=touchGesture.current; if(!g) return;
            if(g.mode==="pinch" && event.touches.length>=2) {
              event.preventDefault(); const a=event.touches[0],b=event.touches[1];
              const d=Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);
              if(Math.abs(d-g.distance)>3) suppressCellClick.current=true;
              setZoom(Math.max(1,Math.min(4,g.zoom*d/Math.max(1,g.distance))));
            } else if(g.mode==="pan" && event.touches.length===1) {
              const t=event.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
              if(Math.hypot(dx,dy)>8) { event.preventDefault(); suppressCellClick.current=true; setPan({x:g.pan.x-dx/Math.max(1,zoom),y:g.pan.y-dy/Math.max(1,zoom)}); }
            }
          }}
          onTouchEnd={() => { touchGesture.current=null; }}
          style={{display:'block',width:'100%',height:'auto',minHeight:260,touchAction:'none'}}>
          <text x="65" y="16" fontSize="13" fontWeight="600" fill="#0f172a">Depth (m)</text>
          <text x="350" y="375" fontSize="13" fontWeight="600" fill="#0f172a">Profile distance (m)</text>
          <g transform="translate(65 28)">
            {grid.values.map(cell => {
              const cellX = grid.x0 + (cell.c + 0.5) / grid.cols * (grid.x1-grid.x0);
              const cellDepth = grid.z0 + (cell.r + 0.5) / grid.rows * (grid.z1-grid.z0);
              const isSelected = selected?.r === cell.r && selected?.c === cell.c;
              return <rect key={cell.r+'-'+cell.c}
                x={cell.c * 650/grid.cols} y={cell.r * 300/grid.rows}
                width={650/grid.cols + 0.4} height={300/grid.rows + 0.4}
                fill={colour(cell.value,min,max)} stroke={isSelected ? '#111827' : 'none'}
                strokeWidth={isSelected ? 2.5 : 0} role="button" tabIndex={0}
                aria-label={`Interpolated resistivity ${cell.value.toFixed(2)} ohm metres at distance ${cellX.toFixed(2)} metres and depth ${cellDepth.toFixed(2)} metres`}
                onClick={() => { if (!suppressCellClick.current) setSelected({r:cell.r,c:cell.c,x:cellX,depth:cellDepth,value:cell.value}); }}
                onKeyDown={event => {if(event.key === 'Enter' || event.key === ' '){event.preventDefault();setSelected({r:cell.r,c:cell.c,x:cellX,depth:cellDepth,value:cell.value});}}}
                style={{cursor:'pointer',outline:'none'}} />;
            })}
          </g>
          <path d="M65 28V328H715" fill="none" stroke="#0f172a" strokeWidth="1.6"/>
          <text x="65" y="346" fontSize="12" fontWeight="600" fill="#0f172a">{grid.x0} m</text>
          <text x="680" y="346" fontSize="12" fontWeight="600" fill="#0f172a">{grid.x1} m</text>
          <text x="18" y="36" fontSize="12" fontWeight="600" fill="#0f172a">{grid.z0} m</text>
          <text x="18" y="328" fontSize="12" fontWeight="600" fill="#0f172a">{grid.z1} m</text>
        </svg>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',fontSize:13,fontWeight:600,marginTop:8}}>
        <span style={{color:'#1d4ed8'}}>● Lower: {min} Ω·m</span>
        <span style={{color:'#475569'}}>Logarithmic colour scale</span>
        <span style={{color:'#b91c1c'}}>● Higher: {max} Ω·m</span>
      </div>
      {selected && <section aria-live="polite" style={{marginTop:12,padding:12,border:'1px solid #94a3b8',borderRadius:8,background:'#f8fafc'}}>
        <h3 style={{marginTop:0}}>Selected tomogram cell</h3>
        <p><strong>Interpolated resistivity:</strong> {selected.value.toFixed(2)} Ω·m</p>
        <p><strong>Profile distance:</strong> {selected.x.toFixed(2)} m</p>
        <p><strong>Depth:</strong> {selected.depth.toFixed(2)} m</p>
        {nearest && <div style={{borderTop:'1px solid #cbd5e1',paddingTop:8}}>
          <strong>Nearest imported measurement (not the interpolated value)</strong>
          <p>Distance: {Number(nearest.point.x).toFixed(2)} m · Depth: {Number(nearest.point.depth).toFixed(2)} m</p>
          <p>Measured resistivity: {Number(nearest.point.resistivity).toFixed(2)} Ω·m</p>
          <p>Offset from selected cell: {nearest.distance.toFixed(2)} m</p>
        </div>}
        <button type="button" style={controlStyle} onClick={() => setSelected(null)}>Clear selection</button>
      </section>}
    </>}
  </section>;
}
