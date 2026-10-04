import { adaptEntityFromNamedSource } from '../entities/namedAdapters.js';
import { createViewer } from '../entities/shared/viewer.js';
import { normalizeDecimal } from '../entities/shared/entityModel.js';

const projection = (name, fields, references = {}) => Object.freeze({ name, fields: Object.freeze(fields), references: Object.freeze(references) });

export const PROJECTION_SCHEMAS = Object.freeze({
  unifiedSearch: projection('unifiedSearch', ['products', 'vendors', 'giftFlows', 'totalResults']),
  productSearch: projection('productSearch', ['products', 'totalElements', 'totalPages', 'page', 'size']),
  recommendations: projection('recommendations', ['products', 'engine', 'strategy', 'count']),
  platformAnalytics: projection('platformAnalytics', ['topProducts', 'topCustomers', 'topVendors']),
  vendorAnalytics: projection('vendorAnalytics', ['vendor', 'overview', 'topProducts', 'revenueHistory', 'orderBreakdown']),
  financialAnalytics: projection('financialAnalytics', ['totals', 'counts', 'byVendor', 'byMonth', 'invalidVendorPortions']),
  authentication: projection('authentication', ['viewer', 'user', 'hasToken']),
});

const decimal = (value, issues, path) => {
  const result = normalizeDecimal(value);
  if (!result.ok) issues.push({ path, reason: result.reason, severity: 'error' });
  return result.value;
};
const model = (projectionType, data, issues = []) => ({ projectionType, schemaVersion: 1, data, meta: { source: projectionType, issues } });
const omitIdentity = (row, identityKeys) => Object.fromEntries(
  Object.entries(row || {}).filter(([key]) => !identityKeys.includes(key)),
);

export function adaptUnifiedSearchProjection(input = {}) {
  return model('unifiedSearch', {
    products: (input.products || []).map((item) => adaptEntityFromNamedSource('adaptProductUnifiedSearchResult', item)),
    vendors: (input.vendors || []).map((item) => adaptEntityFromNamedSource('adaptVendorUnifiedSearchResult', item)),
    giftFlows: (input.giftFlows || []).map((item) => adaptEntityFromNamedSource('adaptGiftFlowUnifiedSearchResult', item)),
    totalResults: Number.isSafeInteger(input.totalResults) ? input.totalResults : 0,
  });
}

export function adaptProductSearchProjection(input = {}) {
  const products = Array.isArray(input) ? input : (input.products || input.content || []);
  return model('productSearch', {
    products: products.map((item) => adaptEntityFromNamedSource('adaptProductSearchResult', item)),
    totalElements: input.totalElements ?? products.length,
    totalPages: input.totalPages ?? 1,
    page: input.page ?? input.number ?? 0,
    size: input.size ?? products.length,
  });
}

export function adaptRecommendationsProjection(input = {}) {
  return model('recommendations', {
    products: (input.products || []).map((item) => adaptEntityFromNamedSource('adaptProductRecommendationReference', item)),
    engine: input.engine ?? null, strategy: input.strategy ?? null,
    count: Number.isSafeInteger(input.count) ? input.count : (input.products || []).length,
  });
}

export function adaptPlatformAnalyticsProjection(input = {}) {
  const issues = [];
  return model('platformAnalytics', {
    topProducts: (input.topProducts || []).map((row) => ({
      entity: adaptEntityFromNamedSource('adaptProductAnalyticsReference', row),
      vendorStoreName: row.vendorStoreName ?? null,
      totalSales: Number.isSafeInteger(row.totalSales) ? row.totalSales : null,
      totalRevenue: decimal(row.totalRevenue, issues, 'topProducts.totalRevenue'),
    })),
    topCustomers: (input.topCustomers || []).map((row) => ({
      entity: adaptEntityFromNamedSource('adaptUserAnalyticsCustomerReference', row),
      totalOrders: Number.isSafeInteger(row.totalOrders) ? row.totalOrders : null,
      totalSpent: decimal(row.totalSpent, issues, 'topCustomers.totalSpent'),
    })),
    topVendors: (input.topVendors || []).map((row) => ({
      entity: adaptEntityFromNamedSource('adaptVendorAnalyticsReference', row),
      totalOrders: Number.isSafeInteger(row.totalOrders) ? row.totalOrders : null,
      totalRevenue: decimal(row.totalRevenue, issues, 'topVendors.totalRevenue'),
      averageOrderValue: decimal(row.averageOrderValue, issues, 'topVendors.averageOrderValue'),
    })),
  }, issues);
}

export function adaptVendorAnalyticsProjection(input = {}) {
  const issues = [];
  return model('vendorAnalytics', {
    vendor: adaptEntityFromNamedSource('adaptVendorAnalyticsReference', input),
    overview: Object.fromEntries(Object.entries(input.overview || {}).map(([key, value]) => [key,
      /Revenue|Value|Rating/.test(key) ? decimal(value, issues, `overview.${key}`) : value])),
    topProducts: (input.topProducts || []).map((row) => ({
      entity: adaptEntityFromNamedSource('adaptProductAnalyticsReference', row),
      ...omitIdentity(row, ['id', 'productId', 'name', 'productName']),
      revenue: decimal(row.revenue, issues, 'topProducts.revenue'),
    })),
    revenueHistory: (input.revenueHistory || []).map((row) => ({ ...row, revenue: decimal(row.revenue, issues, 'revenueHistory.revenue') })),
    orderBreakdown: (input.orderBreakdown || []).map((row) => ({ ...row, totalValue: decimal(row.totalValue, issues, 'orderBreakdown.totalValue') })),
  }, issues);
}

export function adaptFinancialAnalyticsProjection(input = {}) {
  const issues = [];
  const totalKeys = [
    'totalItemSubtotal', 'totalDeliveryCost', 'totalCustomerPayments',
    'totalVendorEarnings', 'totalCommissionsOwed', 'totalCommissionsPaid',
    'totalPlatformRevenue', 'codOrderValue', 'instapayOrderValue',
    'pendingVendorPayments', 'submittedVendorPayments', 'completedVendorPayments',
    'pendingVendorPayouts', 'submittedVendorPayouts', 'completedVendorPayouts',
    'invalidOrFailedPayments',
  ];
  return model('financialAnalytics', {
    totals: Object.fromEntries(totalKeys.map((key) => [key, decimal(input[key], issues, key)])),
    counts: {
      codOrderCount: Number.isSafeInteger(input.codOrderCount) ? input.codOrderCount : 0,
      instapayOrderCount: Number.isSafeInteger(input.instapayOrderCount) ? input.instapayOrderCount : 0,
      invalidOrFailedOrderCount: Number.isSafeInteger(input.invalidOrFailedOrderCount) ? input.invalidOrFailedOrderCount : 0,
    },
    byVendor: (input.byVendor || []).map((row) => ({
      entity: adaptEntityFromNamedSource('adaptVendorAnalyticsReference', row),
      totalEarnings: decimal(row.totalEarnings, issues, 'byVendor.totalEarnings'),
      commissionsPaid: decimal(row.commissionsPaid, issues, 'byVendor.commissionsPaid'),
      commissionsOwed: decimal(row.commissionsOwed, issues, 'byVendor.commissionsOwed'),
      pendingPayouts: decimal(row.pendingPayouts, issues, 'byVendor.pendingPayouts'),
      completedPayouts: decimal(row.completedPayouts, issues, 'byVendor.completedPayouts'),
    })),
    byMonth: (input.byMonth || []).map((row) => ({ ...row,
      itemSubtotal: decimal(row.itemSubtotal, issues, 'byMonth.itemSubtotal'),
      deliveryTotal: decimal(row.deliveryTotal, issues, 'byMonth.deliveryTotal'),
      customerPayments: decimal(row.customerPayments, issues, 'byMonth.customerPayments'),
      commissionsCollected: decimal(row.commissionsCollected, issues, 'byMonth.commissionsCollected'),
      vendorPayoutsCompleted: decimal(row.vendorPayoutsCompleted, issues, 'byMonth.vendorPayoutsCompleted'),
      codOrderValue: decimal(row.codOrderValue, issues, 'byMonth.codOrderValue'),
      instapayOrderValue: decimal(row.instapayOrderValue, issues, 'byMonth.instapayOrderValue'),
      invalidOrFailedPayments: decimal(row.invalidOrFailedPayments, issues, 'byMonth.invalidOrFailedPayments'),
    })),
    invalidVendorPortions: (input.invalidVendorPortions || []).map((row) => ({
      entity: adaptEntityFromNamedSource('adaptVendorAnalyticsReference', row),
      invalidatedPortions: Number.isSafeInteger(row.invalidatedPortions) ? row.invalidatedPortions : 0,
      invalidatedSubtotal: decimal(row.invalidatedSubtotal, issues, 'invalidVendorPortions.invalidatedSubtotal'),
      latestReason: row.latestReason ?? null,
      latestDetails: row.latestDetails ?? null,
      latestInvalidatedAt: row.latestInvalidatedAt ?? null,
    })),
  }, issues);
}

export function adaptAuthenticationProjection(input = {}) {
  const userPayload = input.user || {};
  return model('authentication', {
    viewer: createViewer(userPayload),
    user: adaptEntityFromNamedSource('adaptUserAuthSession', userPayload),
    hasToken: typeof input.token === 'string' && input.token.length > 0,
  });
}

export const PROJECTION_ADAPTERS = Object.freeze({
  unifiedSearch: adaptUnifiedSearchProjection,
  productSearch: adaptProductSearchProjection,
  recommendations: adaptRecommendationsProjection,
  platformAnalytics: adaptPlatformAnalyticsProjection,
  vendorAnalytics: adaptVendorAnalyticsProjection,
  financialAnalytics: adaptFinancialAnalyticsProjection,
  authentication: adaptAuthenticationProjection,
});

export function adaptProjection(name, input = {}) {
  const adapter = PROJECTION_ADAPTERS[name];
  if (!adapter) throw new TypeError(`Unknown projection: ${name}`);
  return adapter(input);
}
