import { listSamples } from './samples.js';
import { PARAMETER_REGISTRY } from '../engine/parameters.js';

function csv(value) {
  if (value == null) return '""';
  let text = String(value);
  if (typeof value === 'string' && /^\s*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export async function exportSamplesCSV() {
  const samples = await listSamples();
  const parameterIds = Object.keys(PARAMETER_REGISTRY);
  const header = [
    'id', 'sampleCode', 'stationName', 'waterSourceType',
    'latitude', 'longitude',
    'coordinate_format', 'original_latitude', 'original_longitude',
    'latitude_hemisphere', 'longitude_hemisphere',
    'coordinate_datum', 'coordinate_display_crs', 'coordinate_storage_crs',
    'collectionDate', 'collector', 'notes',
    ...parameterIds.flatMap(key => [key + '_value', key + '_unit', key + '_canonical']),
    'wqi_who', 'wqi_who_status', 'wqi_son', 'wqi_son_status',
    'drastic_model', 'drastic_index', 'drastic_class'
  ];

  const rows = samples.map(sample => {
    const original = sample.coordinateOriginal || {};
    return [
      sample.id,
      sample.sampleCode,
      sample.stationName,
      sample.waterSourceType,
      sample.latitude,
      sample.longitude,
      sample.coordinateFormat,
      original.latitude,
      original.longitude,
      original.latitudeHemisphere,
      original.longitudeHemisphere,
      sample.coordinateDatum,
      sample.coordinateCRS,
      sample.coordinateStorageCRS,
      sample.collectionDate,
      sample.collector,
      sample.notes,
      ...parameterIds.flatMap(key => {
        const entry = sample.parameters?.[key];
        return [entry?.value ?? '', entry?.unit ?? '', entry?.canonical ?? ''];
      }),
      sample.wqi?.who?.wqi ?? '',
      sample.wqi?.who?.status ?? '',
      sample.wqi?.son?.wqi ?? '',
      sample.wqi?.son?.status ?? '',
      sample.vulnerability?.model ?? '',
      sample.vulnerability?.index ?? '',
      sample.vulnerability?.class ?? ''
    ];
  });

  return [header, ...rows].map(row => row.map(csv).join(',')).join('\r\n');
}

export async function exportSamplesGeoJSON() {
  const samples = await listSamples();
  return {
    type: 'FeatureCollection',
    features: samples
      .filter(sample => Number.isFinite(sample.latitude)
        && Number.isFinite(sample.longitude)
        && Math.abs(sample.latitude) <= 90
        && Math.abs(sample.longitude) <= 180)
      .map(sample => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [sample.longitude, sample.latitude]
        },
        properties: {
          id: sample.id,
          sampleCode: sample.sampleCode,
          stationName: sample.stationName,
          waterSourceType: sample.waterSourceType,
          collectionDate: sample.collectionDate,
          coordinate_format: sample.coordinateFormat ?? null,
          coordinate_original: sample.coordinateOriginal ?? null,
          coordinate_datum: sample.coordinateDatum ?? null,
          coordinate_display_crs: sample.coordinateCRS ?? null,
          coordinate_storage_crs: sample.coordinateStorageCRS ?? null,
          wqi_who: sample.wqi?.who?.wqi ?? null,
          wqi_son: sample.wqi?.son?.wqi ?? null,
          vulnerability: sample.vulnerability?.class ?? null
        }
      }))
  };
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
