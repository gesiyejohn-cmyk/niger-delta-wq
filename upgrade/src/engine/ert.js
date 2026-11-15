export function interpolateERTResistivity(points, x, depth) {
  if (!Array.isArray(points) || !points.length) throw new Error('ERT interpolation requires imported model points.');
  let weighted = 0, weights = 0;
  for (const point of points) {
    const d2 = (point.x - x) ** 2 + (point.depth - depth) ** 2;
    if (d2 < 1e-12) return point.resistivity;
    const weight = 1 / d2;
    weighted += Math.log10(point.resistivity) * weight;
    weights += weight;
  }
  const result = 10 ** (weighted / weights);
  if (!Number.isFinite(result) || result <= 0) throw new Error('ERT interpolation produced an invalid resistivity.');
  return result;
}

export function buildERTGrid(points) {
  if (!Array.isArray(points) || points.length < 6) return null;
  const xs = [...new Set(points.map(point => point.x))];
  const depths = [...new Set(points.map(point => point.depth))];
  const pairs = new Set(points.map(point => point.x + '|' + point.depth));
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
      values.push({ c: col, r: row, value: interpolateERTResistivity(points, x, depth) });
    }
  }
  return { cols, rows, values, x0, x1, z0, z1, method: 'log-resistivity inverse-distance weighting', inversionPerformed: false };
}
