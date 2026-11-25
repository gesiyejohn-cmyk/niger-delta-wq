import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('the main application navigation has an explicit accessible landmark name', () => {
  assert.match(source, /<nav aria-label="Primary navigation">/);
});

test('the primary navigation exposes the main application destinations', () => {
  for (const path of ['/', '/new', '/map', '/geophysics', '/analytics', '/import', '/reports', '/settings', '/data-backup', '/vulnerability', '/wqi', '/external-validation', '/hydrochemistry', '/spatial-analysis']) {
    assert.match(source, new RegExp(`to=["']${path.replaceAll('/', '\\/')}["']`));
  }
});

test('the route fallback and lazy-page loading remain announced to assistive technology', () => {
  assert.match(source, /role="status" aria-live="polite"/);
  assert.match(source, /<Route path="\*" element={<Dashboard \/>} \/>/);
});


test('the primary navigation is keyboard-focusable and horizontally scrollable on narrow screens', () => {
  assert.match(source, /<nav aria-label="Primary navigation">/);
  assert.match(source, /<div tabIndex=\{0\} aria-label="Scroll primary navigation links"/);
  assert.match(source, /overflowX: 'auto'/);
  assert.match(source, /flexWrap: 'nowrap'/);
  assert.match(source, /WebkitOverflowScrolling: 'touch'/);
  assert.match(source, /flex: '0 0 auto'/);
});
