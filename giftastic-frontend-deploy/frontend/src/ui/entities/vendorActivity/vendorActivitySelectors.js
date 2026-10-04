export const formatVendorActivityType = (type) => type
  ? type.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
  : 'Activity';

export const formatVendorActivityDate = (value) => value
  ? formatEntityDateTime(value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, 'en-US')
  : null;

export const getVendorActivityIcon = (type = '') => {
  if (type.includes('ORDER')) return 'shopping_cart';
  if (type.includes('PRODUCT')) return 'inventory_2';
  if (type.includes('REVIEW')) return 'star';
  if (type === 'DELIVERY_PRICING_UPDATED') return 'trending_up';
  return 'activity_zone';
};

export const getVendorActivityColor = (type = '') => {
  if (type.includes('OUT_OF_STOCK')) return 'bg-[#ffdad6] text-[#93000a]';
  if (type.includes('ORDER')) return 'bg-[#d4f4dd] text-[#1e4620]';
  if (type.includes('PRODUCT')) return 'bg-[#f4d9ff] text-[#341547]';
  if (type.includes('REVIEW')) return 'bg-[#fff4e5] text-[#8b5a00]';
  return 'bg-[#e4e2df] text-[#4b444d]';
};

import { formatEntityDateTime } from '../shared/date.js';
