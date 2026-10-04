import { normalizeDecimal } from './entityModel.js';

function parts(value) {
  const normalized = normalizeDecimal(value);
  if (!normalized.ok || normalized.value === null) return null;
  const negative = normalized.value.startsWith('-');
  const unsigned = negative ? normalized.value.slice(1) : normalized.value;
  const [whole, fraction = ''] = unsigned.split('.');
  return { negative, coefficient: BigInt(`${whole}${fraction}`), scale: fraction.length };
}

function stringify({ coefficient, scale, negative = false }) {
  let digits = coefficient.toString().padStart(scale + 1, '0');
  const whole = scale ? digits.slice(0, -scale) : digits;
  const fraction = scale ? digits.slice(-scale).replace(/0+$/, '') : '';
  const sign = negative && coefficient !== 0n ? '-' : '';
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`;
}

function signedCoefficient(value, scale) {
  const factor = 10n ** BigInt(scale - value.scale);
  const coefficient = value.coefficient * factor;
  return value.negative ? -coefficient : coefficient;
}

export function addDecimals(left, right) {
  const a = parts(left); const b = parts(right);
  if (!a || !b) return null;
  const scale = Math.max(a.scale, b.scale);
  const sum = signedCoefficient(a, scale) + signedCoefficient(b, scale);
  return stringify({ coefficient: sum < 0n ? -sum : sum, scale, negative: sum < 0n });
}

export function multiplyDecimal(left, right) {
  const a = parts(left); const b = parts(right);
  if (!a || !b) return null;
  return stringify({
    coefficient: a.coefficient * b.coefficient,
    scale: a.scale + b.scale,
    negative: a.negative !== b.negative,
  });
}

export function compareDecimals(left, right) {
  const a = parts(left); const b = parts(right);
  if (!a || !b) return null;
  const scale = Math.max(a.scale, b.scale);
  const difference = signedCoefficient(a, scale) - signedCoefficient(b, scale);
  return difference === 0n ? 0 : difference > 0n ? 1 : -1;
}

function roundParts(value, maximumFractionDigits) {
  if (maximumFractionDigits == null || value.scale <= maximumFractionDigits) return value;
  const dropped = value.scale - maximumFractionDigits;
  const divisor = 10n ** BigInt(dropped);
  const quotient = value.coefficient / divisor;
  const remainder = value.coefficient % divisor;
  return { ...value, coefficient: quotient + (remainder * 2n >= divisor ? 1n : 0n), scale: maximumFractionDigits };
}

export function formatDecimal(value, { minimumFractionDigits = 0, maximumFractionDigits } = {}) {
  let parsed = parts(value);
  if (!parsed) return null;
  parsed = roundParts(parsed, maximumFractionDigits);
  const canonical = stringify(parsed);
  const negative = canonical.startsWith('-');
  const unsigned = negative ? canonical.slice(1) : canonical;
  let [whole, fraction = ''] = unsigned.split('.');
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  fraction = fraction.padEnd(minimumFractionDigits, '0');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export const formatMoney = (value, currency = 'EGP') => {
  const formatted = formatDecimal(value, { maximumFractionDigits: 2 });
  return formatted === null ? null : `${formatted} ${currency}`;
};

export function formatRatePercent(value) {
  const rate = normalizeRateFraction(value);
  if (rate === null) return null;
  const percent = multiplyDecimal(rate, '100');
  const formatted = formatDecimal(percent, { maximumFractionDigits: 4 });
  return formatted === null ? null : `${formatted}%`;
}

export function normalizeRateFraction(value) {
  const normalized = normalizeDecimal(value);
  if (!normalized.ok || normalized.value === null) return null;
  if (compareDecimals(normalized.value, '0') < 0) return null;
  if (compareDecimals(normalized.value, '1') <= 0) return normalized.value;
  if (compareDecimals(normalized.value, '100') <= 0) return multiplyDecimal(normalized.value, '0.01');
  return null;
}
