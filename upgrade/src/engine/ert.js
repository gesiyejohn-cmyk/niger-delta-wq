function isFiniteInput(value) {
  return value != null && typeof value !== 'boolean'
    && !(typeof value === 'string' && value.trim() === '')
    && typeof value !== 'object' && Number.isFinite(Number(value));
}
function validateInterpolationInputs(points, x, depth) {
  if (!Array.isArray(points) || !points.length) throw new Error('ERT interpolation requires imported model points.');
  if (!isFiniteInput(x) || !isFiniteInput(depth)) throw new Error('ERT interpolation coordinates must be finite numbers.');
  const seen = new Set();
  return points.map((point, index) => {
    const px = Number(point?.x), pz = Number(point?.depth), resistivity = Number(point?.resistivity);
    if (!isFiniteInput(point?.x) || !isFiniteInput(point?.depth) || pz < 0
      || !isFiniteInput(point?.resistivity) || resistivity <= 0) {
      throw new Error(`ERT model point ${index + 1} must have finite distance, non-negative depth and positive resistivity.`);
    }
    const key = px + '|' + pz;
    if (seen.has(key)) throw new Error('ERT model contains duplicate distance/depth cells; resolve duplicate coordinates before interpolation.');
    seen.add(key);
    return { x: px, depth: pz, resistivity };
  });
}
function interpolateValidatedPoints(points, targetX, targetDepth) {
  const distances = points.map(point => Math.hypot(point.x - targetX, point.depth - targetDepth));
  if (distances.some(distance => !Number.isFinite(distance))) throw new Error('ERT interpolation distance is outside the supported numeric range.');
  const exactIndex = distances.findIndex(distance => distance === 0);
  if (exactIndex >= 0) return points[exactIndex].resistivity;
  const nearest = distances.reduce((minimum, distance) => Math.min(minimum, distance), Number.POSITIVE_INFINITY);
  let weightedLog = 0, weights = 0;
  for (let index = 0; index < points.length; index += 1) {
    const ratio = nearest / distances[index], weight = ratio * ratio;
    weightedLog += Math.log10(points[index].resistivity) * weight;
    weights += weight;
  }
  const result = 10 ** (weightedLog / weights);
  if (!Number.isFinite(result) || result <= 0) throw new Error('ERT interpolation produced an invalid resistivity.');
  return result;
}
function convexHull(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.depth - b.depth);
  const cross = (o, a, b) => (a.x - o.x) * (b.depth - o.depth) - (a.depth - o.depth) * (b.x - o.x);
  const lower = [], upper = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}
function isInsideConvexHull(point, hull) {
  let positive = false, negative = false;
  for (let i = 0; i < hull.length; i += 1) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const cross = (b.x - a.x) * (point.depth - a.depth) - (b.depth - a.depth) * (point.x - a.x);
    if (cross > 1e-10) positive = true;
    if (cross < -1e-10) negative = true;
    if (positive && negative) return false;
  }
  return true;
}
export function interpolateERTResistivity(points, x, depth) {
  const validPoints = validateInterpolationInputs(points, x, depth);
  return interpolateValidatedPoints(validPoints, Number(x), Number(depth));
}
export function buildERTGrid(points) {
  if (!Array.isArray(points) || !points.length) return null;
  const validPoints = validateInterpolationInputs(points, 0, 0);
  if (validPoints.length < 6) return null;
  const xs = [...new Set(validPoints.map(point => point.x))], depths = [...new Set(validPoints.map(point => point.depth))];
  const pairs = new Set(validPoints.map(point => point.x + '|' + point.depth));
  if (xs.length < 3 || depths.length < 2 || pairs.size / (xs.length * depths.length) < 0.35) return null;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...depths), z1 = Math.max(...depths);
  if (x0 === x1 || z0 === z1) return null;
  const hull = convexHull(validPoints);
  if (hull.length < 3) return null;
  const cols = Math.min(60, Math.max(24, xs.length * 3)), rows = Math.min(36, Math.max(12, depths.length * 3));
  const values = [];
  for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
    const x = x0 + (col + 0.5) / cols * (x1 - x0), depth = z0 + (row + 0.5) / rows * (z1 - z0);
    // The bounding rectangle is not evidence of data support: mask cells outside the imported-point hull.
    if (!isInsideConvexHull({ x, depth }, hull)) continue;
    values.push({ c: col, r: row, value: interpolateValidatedPoints(validPoints, x, depth) });
  }
  if (!values.length) return null;
  return {
    cols, rows, values, x0, x1, z0, z1,
    hull: hull.map(point => ({ x: point.x, depth: point.depth })),
    method: 'log-resistivity inverse-distance weighting within imported-point convex hull',
    inversionPerformed: false
  };
}
