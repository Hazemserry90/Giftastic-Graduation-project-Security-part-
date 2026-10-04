import { getVendorFieldState, VENDOR_FIELD_STATE } from './vendorModel.js';

export function getVendorName(model) {
  return model?.storeName || 'Unknown Vendor';
}

export const isVendorVerified = (vendor) => vendor?.isVerified === true;
export const getVerifiedVendors = (vendors = []) => vendors.filter(isVendorVerified);
export const countVerifiedVendors = (vendors = []) => getVerifiedVendors(vendors).length;

export function matchesVendorSearch(vendor, query, access) {
  const term = String(query || '').trim().toLowerCase();
  if (!term) return true;
  return ['storeName', 'contactEmail', 'userId'].some((field) => {
    const readable = getReadableVendorField(vendor, field, access?.fields?.[field]);
    return readable.state === VENDOR_FIELD_STATE.AVAILABLE
      && String(readable.value).toLowerCase().includes(term);
  });
}

export function normalizeVendorUrl(value, fallbackPrefix) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (fallbackPrefix) return `${fallbackPrefix}${String(value).replace(/^@/, '')}`;
  return `https://${value}`;
}

export function getReadableVendorField(model, path, allowed) {
  const state = getVendorFieldState(model, path, allowed);
  return {
    state,
    value: state === VENDOR_FIELD_STATE.AVAILABLE
      ? path.split('.').reduce((value, key) => value?.[key], model)
      : null,
  };
}
