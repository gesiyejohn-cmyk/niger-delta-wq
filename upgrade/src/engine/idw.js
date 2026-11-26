// Exploratory inverse-distance weighting. Coordinates must be in a projected
// CRS whose linear units are metres. Results are masked to the sample convex hull.
const finite = value => value !== null && value !== undefined
  && typeof value !== 'boolean' && typeof value !== 'object'
  && !(typeof value === 'string' && value.trim() === '')
  && Number.isFinite(Number(value));

function cleanSamples(samples, valueKey) {
  if (!Array.isArray(samples)) throw new Error('Samples must be an array.');
  const clean = samples.filter(s => finite(s?.x) && finite(s?.y) && finite(s?.[valueKey]))
    .map(s => ({ x: Number(s.x), y: Number(s.y), value: Number(s[valueKey]) }));
  if (clean.length < 3) throw new Error('At least three measured samples are required for 2D IDW.');
  const keys = new Set(clean.map(p => p.x + '|' + p.y));
  if (keys.size !== clean.length) throw new Error('Duplicate sample coordinates must be resolved before IDW interpolation.');
  return clean;
}

function cross(o, a, b) { return (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x); }

export function convexHull(points) {
  const sorted = [...points].sort((a,b) => a.x-b.x || a.y-b.y);
  if (sorted.length < 3) return [];
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

export function pointInConvexHull(point, hull, tolerance = 1e-9) {
  if (!Array.isArray(hull) || hull.length < 3) return false;
  let sign = 0;
  for (let i=0; i<hull.length; i++) {
    const c = cross(hull[i], hull[(i+1)%hull.length], point);
    if (Math.abs(c) <= tolerance) continue;
    const next = Math.sign(c);
    if (sign && next !== sign) return false;
    sign = next;
  }
  return true;
}

export function idwInterpolate(samples, target, options = {}) {
  const valueKey = options.valueKey || 'value';
  const points = cleanSamples(samples, valueKey);
  const power = Number(options.power ?? 2);
  const neighbours = Math.floor(Number(options.neighbours ?? 8));
  const maxDistance = Number(options.maxDistance ?? 5000);
  if (!finite(target?.x) || !finite(target?.y)) throw new Error('Target x and y must be finite projected coordinates in metres.');
  if (!Number.isFinite(power) || power <= 0) throw new Error('IDW power must be greater than zero.');
  if (!Number.isInteger(neighbours) || neighbours < 1) throw new Error('Neighbour count must be a positive integer.');
  if (!Number.isFinite(maxDistance) || maxDistance <= 0) throw new Error('Maximum search distance must be greater than zero.');
  const hull = convexHull(points);
  const location = { x: Number(target.x), y: Number(target.y) };
  if (!pointInConvexHull(location, hull)) return { value: null, status: 'Outside sample convex hull', used: 0 };
  const ranked = points.map(p => ({ ...p, distance: Math.hypot(p.x-location.x, p.y-location.y) }))
    .sort((a,b) => a.distance-b.distance);
  if (ranked[0].distance === 0) return { value: ranked[0].value, status: 'Exact sample location', used: 1 };
  const selected = ranked.filter(p => p.distance <= maxDistance).slice(0, neighbours);
  if (!selected.length) return { value: null, status: 'No samples within maximum distance', used: 0 };
  const weighted = selected.reduce((acc,p) => {
    const w = 1 / Math.pow(p.distance, power);
    acc.weighted += p.value*w; acc.weights += w; return acc;
  }, { weighted: 0, weights: 0 });
  return { value: weighted.weighted/weighted.weights, status: 'Interpolated', used: selected.length };
}

export function generateIDWGrid(samples, options = {}) {
  const valueKey = options.valueKey || 'value';
  const points = cleanSamples(samples, valueKey);
  const columns = Math.floor(Number(options.columns ?? 20));
  const rows = Math.floor(Number(options.rows ?? 20));
  if (!Number.isInteger(columns) || columns < 2 || !Number.isInteger(rows) || rows < 2) {
    throw new Error('IDW grid rows and columns must each be integers of at least two.');
  }
  const hull = convexHull(points);
  if (hull.length < 3) throw new Error('Measured sample coordinates must span a two-dimensional area; collinear points cannot define an IDW grid.');
  const minX = Math.min(...points.map(p=>p.x)), maxX = Math.max(...points.map(p=>p.x));
  const minY = Math.min(...points.map(p=>p.y)), maxY = Math.max(...points.map(p=>p.y));
  const cells = [];
  for (let row=0; row<rows; row++) for (let col=0; col<columns; col++) {
    const target = { x: minX + (maxX-minX)*col/(columns-1), y: minY + (maxY-minY)*row/(rows-1) };
    // points are already normalised to {x, y, value}; use that key rather
    // than the caller's original field name (e.g. "tds").
    const result = idwInterpolate(points, target, { ...options, valueKey: 'value' });
    cells.push({ ...target, row, col, ...result });
  }
  return { cells, hull, rows, columns, method: 'Exploratory IDW; convex-hull masked; not a groundwater-potential prediction' };
}
