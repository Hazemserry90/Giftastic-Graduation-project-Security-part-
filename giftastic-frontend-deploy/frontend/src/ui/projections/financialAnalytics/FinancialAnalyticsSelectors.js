export const selectFinancialAnalyticsData = (projection) => projection?.projectionType === 'financialAnalytics' ? projection.data : null;
export const selectFinancialAnalyticsTotals = (projection) => selectFinancialAnalyticsData(projection)?.totals || null;
export const selectFinancialAnalyticsView = (projection) => {
  const data = selectFinancialAnalyticsData(projection);
  return data ? {
    ...data.totals,
    counts: data.counts,
    byVendor: data.byVendor,
    byMonth: data.byMonth,
    invalidVendorPortions: data.invalidVendorPortions,
  } : null;
};
export { formatMoney as selectFinancialMetricFormat } from '../../entities/shared/decimal.js';
