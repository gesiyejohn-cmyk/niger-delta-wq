export function isBlankImportValue(value) {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

export function parseImportedNumericValue(value) {
  if (isBlankImportValue(value)) return null;
  if (typeof value === 'boolean') {
    throw new Error('Boolean spreadsheet cells are not valid numeric measurements.');
  }
  const numericValue = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numericValue)) {
    throw new Error('Enter a finite numeric measurement.');
  }
  return numericValue;
}
