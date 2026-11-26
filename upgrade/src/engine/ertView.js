const WIDTH = 760;
const HEIGHT = 390;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

function clamp(value, maximum) {
  return Math.max(0, Math.min(maximum, value));
}

function validateView(view) {
  if (!view || ![view.x, view.y, view.zoom].every(Number.isFinite) ||
      view.zoom < MIN_ZOOM || view.zoom > MAX_ZOOM) {
    throw new TypeError('ERT view must contain finite x/y values and a zoom between 1 and 5.');
  }
}

export function zoomERTView(view, factor) {
  validateView(view);
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new TypeError('ERT zoom factor must be a finite positive number.');
  }
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom * factor));
  const width = WIDTH / zoom;
  const height = HEIGHT / zoom;
  return {
    zoom,
    x: clamp(view.x + (WIDTH / view.zoom - width) / 2, WIDTH - width),
    y: clamp(view.y + (HEIGHT / view.zoom - height) / 2, HEIGHT - height)
  };
}

export function panERTView(startView, deltaClientX, deltaClientY, rectWidth, rectHeight) {
  validateView(startView);
  if (![deltaClientX, deltaClientY, rectWidth, rectHeight].every(Number.isFinite) ||
      rectWidth <= 0 || rectHeight <= 0) {
    throw new TypeError('ERT pan requires finite pointer deltas and positive viewport dimensions.');
  }
  const width = WIDTH / startView.zoom;
  const height = HEIGHT / startView.zoom;
  return {
    ...startView,
    x: clamp(startView.x - deltaClientX * width / rectWidth, WIDTH - width),
    y: clamp(startView.y - deltaClientY * height / rectHeight, HEIGHT - height)
  };
}
