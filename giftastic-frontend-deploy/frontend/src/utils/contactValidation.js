export const sanitizeDigitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const normalizeFullName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export const sanitizeFullName = (value) => String(value || '')
  .replace(/[^\p{L}\s]/gu, '')
  .replace(/\s{2,}/g, ' ');

const titleCase = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

export const getEgyptianPhoneError = (value, label = 'Egyptian phone number') => {
  const digits = sanitizeDigitsOnly(value);
  if (!digits) return label === 'Egyptian phone number' ? 'Enter an Egyptian phone number.' : `Enter ${label}.`;
  if (digits.length !== 11) return `${titleCase(label)} must be exactly 11 digits.`;
  if (!digits.startsWith('01')) return `${titleCase(label)} must start with 01.`;
  return '';
};

export const getStrictEgyptianPhoneError = (value, label = 'Egyptian phone number') => {
  const text = String(value || '').trim();
  if (text && text !== sanitizeDigitsOnly(text)) return `${titleCase(label)} must contain numbers only.`;
  return getEgyptianPhoneError(value, label);
};

export const getFullNameError = (value, label = 'Full name') => {
  const normalized = normalizeFullName(value);
  if (!normalized) return `${label} is required.`;
  if (!/^\p{L}+(?:\s+\p{L}+)*$/u.test(normalized)) return `${label} must contain letters only.`;
  return '';
};

export const getInstapayRefundDetailsError = (phoneNumber, name) =>
  getStrictEgyptianPhoneError(phoneNumber, 'refund phone number')
  || getFullNameError(name, 'Refund name');

export const normalizeInstapayRefundDetails = (phoneNumber, name) => ({
  phoneNumber: sanitizeDigitsOnly(phoneNumber),
  name: normalizeFullName(name),
});
