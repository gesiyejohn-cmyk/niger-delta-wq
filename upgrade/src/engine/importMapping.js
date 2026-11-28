const META_COLUMNS = {
  sampleCode: ['sample code', 'sample id', 'id'],
  stationName: ['station', 'station name', 'location'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lon', 'lng'],
  coordinateFormat: ['coordinate format', 'coordinate_format', 'coord format'],
  latitudeHemisphere: ['latitude hemisphere', 'latitude_hemisphere', 'lat hemisphere', 'lat hemi'],
  longitudeHemisphere: ['longitude hemisphere', 'longitude_hemisphere', 'lon hemisphere', 'lon hemi'],
  coordinateDatum: ['coordinate datum', 'coordinate_datum', 'datum'],
  coordinateCRS: ['coordinate crs', 'coordinate_crs', 'coordinate reference system', 'crs'],
  collectionDate: ['date', 'collection date'],
  waterSourceType: ['source', 'water source'],
  collector: ['collector'],
  notes: ['notes']
};

export function detectMetadataMapping(headers = []) {
  const sourceHeaders = Array.isArray(headers)
    ? headers.map(header => String(header ?? ''))
    : [];

  return Object.fromEntries(Object.entries(META_COLUMNS).map(([key, synonyms]) => {
    const matchedHeader = sourceHeaders.find(header =>
      synonyms.includes(header.toLowerCase().trim())
    );
    return [key, matchedHeader ?? ''];
  }));
}
