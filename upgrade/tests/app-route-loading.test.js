import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const lazyRoutes = [
  ['/map', 'MapPage'],
  ['/geophysics', 'GeophysicsPage'],
  ['/analytics', 'AnalyticsPage'],
  ['/import', 'ImportPage'],
  ['/reports', 'ReportsPage'],
  ['/settings', 'SettingsPage'],
  ['/data-backup', 'DataBackupPage'],
  ['/vulnerability', 'VulnerabilityPage'],
  ['/god', 'GodPage'],
  ['/wqi', 'WQIPage'],
  ['/hydrochemistry', 'HydrochemistryPage'],
  ['/idw', 'IDWPage']
];

test('specialist workspaces are loaded through React.lazy instead of the initial bundle', () => {
  assert.match(app, /import\s*\{\s*lazy\s*,\s*Suspense\s*\}\s*from\s*['"]react['"]/);
  for (const [, name] of lazyRoutes) {
    const lazyImport = new RegExp(
      `const\\s+${name}\\s*=\\s*lazy\\(\\(\\)\\s*=>\\s*import\\(['"]\\.\\/pages\\/${name}\\.jsx['"]\\)\\);`
    );
    const eagerImport = new RegExp(
      `import\\s+${name}\\s+from\\s+['"]\\.\\/pages\\/${name}\\.jsx['"]`
    );
    assert.match(app, lazyImport, `${name} should be a lazy route component`);
    assert.doesNotMatch(app, eagerImport, `${name} must not be eagerly imported`);
  }
});

test('dashboard and sample-entry routes remain eager for immediate first-screen access', () => {
  for (const name of ['Dashboard', 'SampleEditor', 'SampleDetail']) {
    assert.match(app, new RegExp(`import\\s+${name}\\s+from\\s+['"]\\.\\/pages\\/${name}\\.jsx['"]`));
  }
  assert.match(app, /<Route\s+path=["']\/["']\s+element=\{<Dashboard\s*\/>\}\s*\/>/);
  assert.match(app, /<Route\s+path=["']\/new["']\s+element=\{<SampleEditor\s*\/>\}\s*\/>/);
});

test('all specialist routes are inside an accessible Suspense loading boundary', () => {
  assert.match(app, /<Suspense\s+fallback=\{/);
  assert.match(app, /role="status">Loading workspace…<\/p>/);
  assert.match(app, /<Suspense[\s\S]*?<Routes>[\s\S]*?<\/Routes>[\s\S]*?<\/Suspense>/);
  for (const [path, name] of lazyRoutes) {
    const route = new RegExp(
      `<Route\\s+path=["']${path}["']\\s+element=\\{<${name}\\s*\\/>\\}\\s*\\/>`
    );
    assert.match(app, route, `${path} should still render ${name}`);
  }
});
