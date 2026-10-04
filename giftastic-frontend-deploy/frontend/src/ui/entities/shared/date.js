export function toValidEntityDate(value, { dateOnly = false } = {}) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  if (Array.isArray(value) && value.length >= 1) {
    const [year, month = 1, day = 1] = value;
    if (![year, month, day].every(Number.isSafeInteger)) return null;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }
  if (typeof value !== 'string' || value.trim() === '') return null;
  if (dateOnly || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getEntityDateTimestamp(value, options) {
  return toValidEntityDate(value, options)?.getTime() ?? null;
}

export function createIsoTimestamp(now = Date.now()) {
  return new Date(now).toISOString();
}

export function formatEntityDate(value, options, locale) {
  const date = toValidEntityDate(value);
  return date ? date.toLocaleDateString(locale, options) : null;
}

export function formatEntityDateTime(value, options, locale) {
  const date = toValidEntityDate(value);
  return date ? date.toLocaleString(locale, options) : null;
}
