const CONFIDENCE_LEVELS = new Set(['low', 'moderate', 'high']);
const AQUIFER_POTENTIAL = new Set(['unknown', 'unlikely', 'possible', 'probable']);

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Creates an empty interpretation scaffold tied to one imported ERT model.
 * The units and boundaries are intentionally left for a geologist to enter.
 */
export function createGeologicalInterpretation(model) {
  if (!model?.id) throw new Error('A saved ERT model is required.');
  const cells = Array.isArray(model.cells) ? model.cells : [];
  if (!cells.length) throw new Error('The ERT model has no imported cells.');
  if (!cells.every(cell => cell && finite(cell.x) && finite(cell.depth))) {
    throw new Error('The ERT model contains invalid distance or depth coordinates.');
  }
  const xs = cells.map(cell => cell.x);
  const depths = cells.map(cell => cell.depth);
  const xRange = [Math.min(...xs), Math.max(...xs)];
  const depthRange = [Math.min(...depths), Math.max(...depths)];
  if (xRange[0] === xRange[1] || depthRange[0] === depthRange[1]) {
    throw new Error('A 2D interpretation requires non-zero distance and depth ranges.');
  }
  return {
    schemaVersion: 1,
    ertModelId: model.id,
    lineId: model.lineId || 'Unlabelled line',
    xRange,
    depthRange,
    units: [],
    stations: [],
    interpretationStatus: 'provisional',
    notes: '',
    createdAt: null,
    updatedAt: null
  };
}

/**
 * Validate a manually interpreted layered section.
 * Units are ordered from shallowest to deepest. Each station supplies one
 * boundary more than the number of units, spanning the model depth range.
 * No lithology is inferred from resistivity values by this validator.
 */
export function validateGeologicalInterpretation(input, expectedModel = null) {
  if (!input || input.schemaVersion !== 1) {
    throw new Error('Unsupported geological interpretation format.');
  }
  if (!nonEmpty(input.ertModelId)) throw new Error('An associated ERT model ID is required.');
  if (expectedModel && input.ertModelId !== expectedModel.id) {
    throw new Error('This interpretation belongs to a different ERT model.');
  }
  if (expectedModel) {
    const cells = Array.isArray(expectedModel.cells) ? expectedModel.cells : [];
    if (!cells.length) throw new Error('The associated ERT model has no imported cells.');
    if (!cells.every(cell => cell && finite(cell.x) && finite(cell.depth))) {
      throw new Error('The associated ERT model contains invalid coordinates.');
    }
    const xs = cells.map(cell => cell.x);
    const depths = cells.map(cell => cell.depth);
    const modelXRange = [Math.min(...xs), Math.max(...xs)];
    const modelDepthRange = [Math.min(...depths), Math.max(...depths)];
    if (modelXRange[0] === modelXRange[1] || modelDepthRange[0] === modelDepthRange[1]) {
      throw new Error('The associated ERT model does not span a two-dimensional section.');
    }
    if (!Array.isArray(input.xRange) || input.xRange[0] !== modelXRange[0]
      || input.xRange[1] !== modelXRange[1] || !Array.isArray(input.depthRange)
      || input.depthRange[0] !== modelDepthRange[0] || input.depthRange[1] !== modelDepthRange[1]) {
      throw new Error('Interpretation ranges must match the associated ERT model extent.');
    }
  }
  if (!Array.isArray(input.xRange) || input.xRange.length !== 2
    || !input.xRange.every(finite) || input.xRange[0] >= input.xRange[1]) {
    throw new Error('The interpretation distance range is invalid.');
  }
  if (!Array.isArray(input.depthRange) || input.depthRange.length !== 2
    || !input.depthRange.every(finite) || input.depthRange[0] < 0
    || input.depthRange[0] >= input.depthRange[1]) {
    throw new Error('The interpretation depth range is invalid.');
  }
  if (!Array.isArray(input.units) || !input.units.length) {
    throw new Error('Add at least one interpreted geological unit.');
  }
  const ids = new Set();
  input.units.forEach((unit, index) => {
    if (!nonEmpty(unit.id) || ids.has(unit.id)) throw new Error('Every geological unit needs a unique ID.');
    ids.add(unit.id);
    if (!nonEmpty(unit.name)) throw new Error(`Geological unit ${index + 1} needs a lithology label.`);
    if (!CONFIDENCE_LEVELS.has(unit.confidence)) {
      throw new Error(`Geological unit ${index + 1} needs a valid confidence level.`);
    }
    if (!AQUIFER_POTENTIAL.has(unit.aquiferPotential)) {
      throw new Error(`Geological unit ${index + 1} has an invalid aquifer-potential category.`);
    }
    if (!nonEmpty(unit.evidence)) {
      throw new Error(`Geological unit ${index + 1} needs evidence notes or an explicit statement that independent geological control is unavailable.`);
    }
  });
  if (!Array.isArray(input.stations) || input.stations.length < 2) {
    throw new Error('At least two interpretation stations are required to define a 2D section.');
  }
  const [xMin, xMax] = input.xRange;
  const [zMin, zMax] = input.depthRange;
  let previousX = -Infinity;
  input.stations.forEach((station, index) => {
    if (!finite(station.x) || station.x < xMin || station.x > xMax || station.x <= previousX) {
      throw new Error('Interpretation stations must have unique, increasing distances within the ERT model range.');
    }
    previousX = station.x;
    if (!Array.isArray(station.boundaries) || station.boundaries.length !== input.units.length + 1) {
      throw new Error(`Station ${index + 1} must contain one more depth boundary than the number of geological units.`);
    }
    if (!station.boundaries.every(finite)) {
      throw new Error(`Station ${index + 1} contains a non-numeric layer boundary.`);
    }
    if (Math.abs(station.boundaries[0] - zMin) > 1e-6
      || Math.abs(station.boundaries.at(-1) - zMax) > 1e-6) {
      throw new Error(`Station ${index + 1} boundaries must span the full ERT depth range.`);
    }
    for (let boundary = 1; boundary < station.boundaries.length; boundary += 1) {
      if (station.boundaries[boundary] <= station.boundaries[boundary - 1]) {
        throw new Error(`Station ${index + 1} has crossed boundaries or a zero/negative layer thickness.`);
      }
    }
  });
  if (input.stations[0]?.x !== xMin || input.stations.at(-1)?.x !== xMax) {
    throw new Error('Interpretation stations must cover both ends of the ERT profile distance range.');
  }
  if (input.interpretationStatus && !['provisional', 'reviewed'].includes(input.interpretationStatus)) {
    throw new Error('Interpretation status must be provisional or reviewed.');
  }
  return {
    ...input,
    units: input.units.map(unit => ({ ...unit, name: unit.name.trim(), evidence: unit.evidence.trim() })),
    stations: input.stations.map(station => ({ ...station, boundaries: [...station.boundaries] })),
    interpretationStatus: input.interpretationStatus || 'provisional'
  };
}

/** Interpolate manually interpreted layer boundaries between adjacent stations. */
export function getGeologicalColumnAtDistance(interpretation, distance) {
  const valid = validateGeologicalInterpretation(interpretation);
  if (!finite(distance) || distance < valid.xRange[0] || distance > valid.xRange[1]) {
    throw new Error('Selected profile distance is outside the interpreted section.');
  }
  const stations = valid.stations;
  const exact = stations.find(station => station.x === distance);
  let boundaries;
  if (exact) boundaries = [...exact.boundaries];
  else {
    let rightIndex = stations.findIndex(station => station.x > distance);
    if (rightIndex <= 0) rightIndex = stations.length - 1;
    const left = stations[rightIndex - 1];
    const right = stations[rightIndex];
    const fraction = (distance - left.x) / (right.x - left.x);
    boundaries = left.boundaries.map((depth, index) =>
      depth + (right.boundaries[index] - depth) * fraction
    );
  }
  return {
    x: distance,
    layers: valid.units.map((unit, index) => ({
      ...unit,
      topDepth: boundaries[index],
      bottomDepth: boundaries[index + 1],
      thickness: boundaries[index + 1] - boundaries[index]
    }))
  };
}
