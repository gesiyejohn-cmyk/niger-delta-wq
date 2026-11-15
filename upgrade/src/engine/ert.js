function validateInterpolationInputs(points, x, depth) {
  if (!Array.isArray(points) || !points.length) {
    throw new Error('ERT interpolation requires imported model points.');
  }
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(depth))) {
    throw new Error('ERT interpolation coordinates must be finite numbers.');
  }
  const seen = new Set();
  return points.map((point, index) => {
    const px = Number(point?.x);
    const pz = Number(point?.depth);
    const resistivity = Number(point?.resistivity);
    if (!Number.isFinite(px) || !Number.isFinite(pz) || pz < 0
      || !Number.isFinite(resistivity) || resistivity <= 0) {
      throw new Error(`ERT model point ${index + 1} must have finite distance, non-negative depth and positive resistivity.`);
    }
    const key = px + '|' + pz;
    if (seen.has(key)) {
      throw new Error('ERT model contains duplicate distance/depth cells; resolve duplicate coordinates before interpolation.');
    }
    seen.add(key);
    return { x: px, depth: pz, resistivity };
  });
}

function interpolateValidatedPoints(points, targetX, targetDepth) {
  const distances = points.map(point => Math.hypot(point.x - targetX, point.depth - targetDepth));
  if (distances.some(distance => !Number.isFinite(distance))) {
    throw new Error('ERT interpolation distance is outside the supported numeric range.');
  }
  const exactIndex = distances.findIndex(distance => distance === 0);
  if (exactIndex >= 0) return points[exactIndex].resistivity;

  // Scale inverse-square weights by the nearest distance. This is algebraically
  // equivalent to 1/d² weighting but avoids overflow and universal weight underflow.
  const nearest = distances.reduce((minimum, distance) => Math.min(minimum, distance), Number.POSITIVE_INFINITY);
  let weightedLog = 0;
  let weights = 0;
  for (let index = 0; index < points.length; index += 1) {
    const ratio = nearest / distances[index];
    const weight = ratio * ratio;
    weightedLog += Math.log10(points[index].resistivity) * weight;
    weights += weight;
  }
  const result = 10 ** (weightedLog / weights);
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error('ERT interpolation produced an invalid resistivity.');
  }
  return result;
}

export function interpolateERTResistivity(points, x, depth) {
  const validPoints = validateInterpolationInputs(points, x, depth);
  return interpolateValidatedPoints(validPoints, Number(x), Number(depth));
}

export function buildERTGrid(points) {
  if (!Array.isArray(points) || !points.length) return null;
  // Validate source data before deciding whether coverage is sufficient.
  const validPoints = validateInterpolationInputs(points, 0, 0);
  if (validPoints.length < 6) return null;
  const xs = [...new Set(validPoints.map(point => point.x))];
  const depths = [...new Set(validPoints.map(point => point.depth))];
  const pairs = new Set(validPoints.map(point => point.x + '|' + point.depth));
  if (xs.length < 3 || depths.length < 2 || pairs.size / (xs.length * depths.length) < 0.35) return null;
  const x0 = xs.reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY);
  const x1 = xs.reduce((maximum, value) => Math.max(maximum, value), Number.NEGATIVE_INFINITY);
  const z0 = depths.reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY);
  const z1 = depths.reduce((maximum, value) => Math.max(maximum, value), Number.NEGATIVE_INFINITY);
  if (x0 === x1 || z0 === z1) return null;
  const cols = Math.min(60, Math.max(24, xs.length * 3));
  const rows = Math.min(36, Math.max(12, depths.length * 3));
  const values = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = x0 + (col + 0.5) / cols * (x1 - x0);
      const depth = z0 + (row + 0.5) / rows * (z1 - z0);
      values.push({ c: col, r: row, value: interpolateValidatedPoints(validPoints, x, depth) });
    }
  }
  return { cols, rows, values, x0, x1, z0, z1, method: 'log-resistivity inverse-distance weighting', inversionPerformed: false };
}
