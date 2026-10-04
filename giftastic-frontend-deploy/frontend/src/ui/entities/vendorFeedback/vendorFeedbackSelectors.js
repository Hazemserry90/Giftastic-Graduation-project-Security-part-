import { formatDecimal, multiplyDecimal } from '../shared/decimal.js';
import { formatEntityDate } from '../shared/date.js';

export const formatVendorFeedbackDate = (value) =>
  formatEntityDate(value);

export const formatVendorFeedbackScore = (value) =>
  value === null || value === undefined ? null : `${formatDecimal(multiplyDecimal(value, '100'), { maximumFractionDigits: 0 })}%`;
