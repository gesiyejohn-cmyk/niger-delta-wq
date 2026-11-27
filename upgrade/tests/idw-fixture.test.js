import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const csv = readFileSync(new URL('../test-data/idw/ndu-campus-synthetic-idw.csv', import.meta.url), 'utf8').trim();
const [headerLine, ...lines] = csv.split(/\r?\n/);
const headers = headerLine.split(',');
const records = lines.map(line => Object.fromEntries(
  line.split(',').map((value, index) => [headers[index], value])
));

test('synthetic IDW fixture has nine complete, uniquely located training samples in one UTM zone', () => {
  assert.equal(records.length, 9);
  const locations = new Set();
  const zones = new Set();
  for (const row of records) {
    const latitude = Number(row.latitude_dd);
    const longitude = Number(row.longitude_dd);
    assert.ok(latitude >= -80 && latitude <= 84);
    assert.ok(longitude >= -180 && longitude <= 180);
    locations.add(latitude + '|' + longitude);
    zones.add(Math.floor((longitude + 180) / 6) + 1);
    for (const key of ['tds_mg_l', 'ec_us_cm', 'no3_mg_l', 'fe_mg_l', 'cl_mg_l']) {
      assert.ok(Number.isFinite(Number(row[key])) && Number(row[key]) >= 0, key + ' must be a non-negative measured value');
    }
    assert.equal(row.coordinate_datum, 'WGS84');
    assert.equal(row.coordinate_storage_crs, 'EPSG:4326');
    assert.match(row.sample_code, /^SYN-IDW-/);
  }
  assert.equal(locations.size, 9, 'sample coordinates must be unique');
  assert.deepEqual([...zones], [32], 'all fixture coordinates must use UTM zone 32');
});
