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

export function interpolateERTResistivity(points, x, depth) {
  const validPoints = validateInterpolationInputs(points, x, depth);
  const targetX = Number(x);
  const targetDepth = Number(depth);
  const distances = validPoints.map(point => Math.hypot(point.x - targetX, point.depth - targetDepth));
  if (distances.some(distance => !Number.isFinite(distance))) {
    throw new Error('ERT interpolation distance is outside the supported numeric range.');
  }
  const exactIndex = distances.findIndex(distance => distance === 0);
  if (exactIndex >= 0) return validPoints[exactIndex].resistivity;

  // Scale inverse-square weights by the nearest distance. This is algebraically
  // equivalent to 1/d² weighting but avoids overflow for large coordinates and
  // underflow of every weight for widely separated model points.
  const nearest = Math.min(...distances);
  let weightedLog = 0;
  let weights = 0;
  for (let index = 0; index < validPoints.length; index += 1) {
    const ratio = nearest / distances[index];
    const weight = ratio * ratio;
    weightedLog += Math.log10(validPoints[index].resistivity) * weight;
    weights += weight;
  }
  const result = 10 ** (weightedLog / weights);
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error('ERT interpolation produced an invalid resistivity.');
  }
  return result;
}

export function buildERTGrid(points) {
  if (!Array.isArray(points) || points.length < 6) return null;
  // Validate even when a sparse grid will be declined: bad source values must
  // not be silently rendered as an empty or misleading section.
  const validPoints = validateInterpolationInputs(points, 0, 0);
  const xs = [...new Set(validPoints.map(point => point.x))];
  const depths = [...new Set(validPoints.map(point => point.depth))];
  const pairs = new Set(validPoints.map(point => point.x + '|' + point.depth));
  if (xs.length < 3 || depths.length < 2 || pairs.size / (xs.length * depths.length) < 0.35) return null;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const z0 = Math.min(...depths), z1 = Math.max(...depths);
  if (x0 === x1 || z0 === z1) return null;
  const cols = Math.min(60, Math.max(24, xs.length * 3));
  const rows = Math.min(36, Math.max(12, depths.length * 3));
  const values = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = x0 + (col + 0.5) / cols * (x1 - x0);
      const depth = z0 + (row + 0.5) / rows * (z1 - z0);
      values.push({ c: col, r: row, value: interpolateERTResistivity(validPoints, x, depth) });
    }
  }
  return { cols, rows, values, x0, x1, z0, z1, method: 'log-resistivity inverse-distance weighting', inversionPerformed: false };
}
