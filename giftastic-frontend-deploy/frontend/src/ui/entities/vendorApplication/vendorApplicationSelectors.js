import { formatEntityDateTime } from '../shared/date.js';

export const getVendorApplicationDisplayName = (application) => application?.storeName || 'Vendor Application';
export const formatVendorApplicationDate = (value) => formatEntityDateTime(value);

export function matchesVendorApplicationSearch(application, query) {
  const term = String(query || '').trim().toLowerCase();
  if (!term) return true;
  return [
    application?.storeName,
    application?.contactEmail,
    application?.contactPhone,
    application?.address,
  ].some((value) => String(value || '').toLowerCase().includes(term));
}
