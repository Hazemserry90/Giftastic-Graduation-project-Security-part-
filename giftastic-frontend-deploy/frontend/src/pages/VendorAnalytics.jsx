import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { analyticsService } from '../services/analyticsService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorSidebar from '../components/VendorSidebar';
import ProductModal from '../components/modals/ProductModal';
import {
  buildProductAccess,
  ProductSemanticViews,
  PRODUCT_CONTEXT,
} from '../ui/entities/product';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { adaptVendorAnalyticsProjection } from '../ui/projections';
import { selectVendorAnalyticsData } from '../ui/projections/vendorAnalytics/VendorAnalyticsSelectors';
import { formatDecimal, formatMoney } from '../ui/entities/shared/decimal';
import { selectVendorAnalyticsOrderStatusLabel } from '../ui/projections/vendorAnalytics';
import { authorizeEntityHydration, hydrateEntityById } from '../ui/entities/shared/productionHydration';

const statusPalette = ['#341547', '#0f766e', '#2563eb', '#b45309', '#be123c', '#475569'];

const readMetric = (value) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const ratio = (value, total) => {
  const denominator = readMetric(total);
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, (readMetric(value) / denominator) * 100));
};

const formatPercent = (value, total) => `${ratio(value, total).toFixed(1)}%`;
const money = (value) => formatMoney(value) || '0 EGP';
const decimal = (value, options) => formatDecimal(value, options) || '0';
const compactNumber = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));

function AnalyticsShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        <VendorSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function MetricTile({ label, value, detail, icon, color = '#341547' }) {
  return (
    <article className="group min-h-[136px] rounded border border-outline-variant/50 bg-white p-5 shadow-plum transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
          <p className="mt-3 text-3xl font-black text-primary">{value}</p>
        </div>
        <span
          className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded bg-surface-container-low text-[22px]"
          style={{ color }}
        >
          {icon}
        </span>
      </div>
      {detail && <p className="mt-4 text-sm font-semibold text-on-surface-variant">{detail}</p>}
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-container">
        <div className="h-full w-2/5 rounded-full transition-all group-hover:w-full" style={{ background: color }} />
      </div>
    </article>
  );
}

function ProductHealthPanel({ overview }) {
  const total = overview.totalProducts || 0;
  const approved = overview.approvedProducts || 0;
  const pending = overview.pendingProducts || 0;
  const other = Math.max(0, total - approved - pending);
  const segments = [
    { label: 'Approved', value: approved, color: '#0f766e' },
    { label: 'Pending', value: pending, color: '#b45309' },
    { label: 'Other', value: other, color: '#64748b' },
  ].filter((item) => item.value > 0 || total === 0);

  let cursor = 0;
  const gradient = total
    ? segments.map((item) => {
      const start = cursor;
      cursor += ratio(item.value, total);
      return `${item.color} ${start}% ${cursor}%`;
    }).join(', ')
    : '#e4e2df 0% 100%';

  return (
    <section className="rounded border border-outline-variant/50 bg-white p-6 shadow-plum">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-primary">Catalog Health</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{total} products in this vendor catalog</p>
        </div>
        <Link to="/vendor/products" className="rounded border border-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5">
          Products
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
        <div className="mx-auto grid aspect-square w-full max-w-[220px] place-items-center rounded-full shadow-lg" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="grid aspect-square w-[62%] place-items-center rounded-full bg-white text-center shadow-sm">
            <div>
              <p className="text-xs font-bold text-on-surface-variant">Approved</p>
              <p className="text-3xl font-black text-primary">{formatPercent(approved, total)}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {segments.map((item) => (
            <div key={item.label} className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-on-surface">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </p>
                <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full" style={{ width: `${ratio(item.value, total)}%`, background: item.color }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-on-surface-variant">{formatPercent(item.value, total)} of catalog</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RevenueHistoryPanel({ periods = [] }) {
  const [activePeriod, setActivePeriod] = useState(periods[periods.length - 1]?.period || null);
  const active = periods.find((period) => period.period === activePeriod) || periods[periods.length - 1];
  const maxRevenue = Math.max(1, ...periods.map((period) => readMetric(period.revenue)));
  const previous = active ? periods[periods.findIndex((period) => period.period === active.period) - 1] : null;
  const delta = previous ? readMetric(active.revenue) - readMetric(previous.revenue) : null;

  return (
    <section className="rounded border border-outline-variant/50 bg-white p-6 shadow-plum">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-primary">Revenue History</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{periods.length || 0} periods with vendor order value</p>
        </div>
        {active && (
          <div className="rounded border border-primary/10 bg-primary/5 px-4 py-3 text-right">
            <p className="text-xs font-bold text-on-surface-variant">{active.period}</p>
            <p className="text-xl font-black text-primary">{money(active.revenue)}</p>
          </div>
        )}
      </div>

      {periods.length === 0 ? (
        <p className="mt-8 rounded bg-surface-container-low p-6 text-center text-on-surface-variant">No revenue history yet.</p>
      ) : (
        <>
          <div className="mt-8 grid min-h-[300px] grid-flow-col auto-cols-[minmax(96px,1fr)] items-end gap-3 overflow-x-auto pb-2">
            {periods.map((period) => {
              const isActive = active?.period === period.period;
              return (
                <button
                  key={period.period}
                  type="button"
                  onMouseEnter={() => setActivePeriod(period.period)}
                  onFocus={() => setActivePeriod(period.period)}
                  onClick={() => setActivePeriod(period.period)}
                  className={`grid min-w-[96px] gap-3 rounded border p-3 text-center transition ${
                    isActive ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:border-outline-variant hover:bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex h-56 items-end justify-center">
                    <div
                      className="w-12 rounded-t bg-primary transition-all"
                      style={{
                        height: `${Math.max(8, ratio(period.revenue, maxRevenue) * 2.2)}px`,
                        background: isActive ? '#341547' : '#8b6a9d',
                      }}
                      title={`${period.period}: ${money(period.revenue)}`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-black text-primary">{period.period}</p>
                    <p className="mt-1 text-xs font-semibold text-on-surface-variant">{period.orderCount} orders</p>
                  </div>
                </button>
              );
            })}
          </div>

          {active && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
                <p className="text-xs font-bold text-on-surface-variant">Revenue</p>
                <p className="mt-2 text-xl font-black text-primary">{money(active.revenue)}</p>
              </div>
              <div className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
                <p className="text-xs font-bold text-on-surface-variant">Orders</p>
                <p className="mt-2 text-xl font-black text-primary">{active.orderCount}</p>
              </div>
              <div className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
                <p className="text-xs font-bold text-on-surface-variant">Previous Period</p>
                <p className={`mt-2 text-xl font-black ${delta === null ? 'text-primary' : delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {delta === null ? '-' : `${delta >= 0 ? '+' : ''}${money(delta)}`}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function OrderStatusPanel({ statuses = [], totalOrders = 0 }) {
  const [activeStatus, setActiveStatus] = useState(statuses[0]?.status || null);
  const active = statuses.find((status) => status.status === activeStatus) || statuses[0];
  const totalValue = statuses.reduce((sum, status) => sum + readMetric(status.totalValue), 0);
  let cursor = 0;
  const gradient = statuses.length
    ? statuses.map((status, index) => {
      const start = cursor;
      cursor += ratio(status.count, totalOrders);
      return `${statusPalette[index % statusPalette.length]} ${start}% ${cursor}%`;
    }).join(', ')
    : '#e4e2df 0% 100%';

  return (
    <section className="rounded border border-outline-variant/50 bg-white p-6 shadow-plum">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-primary">Order Status</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{totalOrders} vendor orders represented</p>
        </div>
        <div className="rounded border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-right">
          <p className="text-xs font-bold text-on-surface-variant">Status Value</p>
          <p className="text-lg font-black text-primary">{money(totalValue)}</p>
        </div>
      </div>

      {statuses.length === 0 ? (
        <p className="mt-8 rounded bg-surface-container-low p-6 text-center text-on-surface-variant">No order status data yet.</p>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto grid aspect-square w-full max-w-[240px] place-items-center rounded-full shadow-lg" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="grid aspect-square w-[62%] place-items-center rounded-full bg-white text-center shadow-sm">
              <div>
                <p className="text-xs font-bold text-on-surface-variant">{active ? selectVendorAnalyticsOrderStatusLabel(active.status) : 'Orders'}</p>
                <p className="text-3xl font-black text-primary">{active?.count || 0}</p>
                <p className="text-xs font-bold text-on-surface-variant">{formatPercent(active?.count || 0, totalOrders)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {statuses.map((status, index) => {
              const color = statusPalette[index % statusPalette.length];
              const isActive = active?.status === status.status;
              return (
                <button
                  key={status.status}
                  type="button"
                  onMouseEnter={() => setActiveStatus(status.status)}
                  onFocus={() => setActiveStatus(status.status)}
                  onClick={() => setActiveStatus(status.status)}
                  className={`rounded border p-4 text-left transition ${
                    isActive ? 'bg-primary/5' : 'bg-white hover:bg-surface-container-lowest'
                  }`}
                  style={{ borderColor: isActive ? color : '#cec3ce' }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-on-surface">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      {selectVendorAnalyticsOrderStatusLabel(status.status)}
                    </p>
                    <p className="text-sm font-black" style={{ color }}>{status.count} orders</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full" style={{ width: `${ratio(status.count, totalOrders)}%`, background: color }} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-on-surface-variant">{money(status.totalValue)} total value</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function ProductPerformancePanel({ products = [], totalRevenue = 0, viewer, onOpenProduct }) {
  const topProducts = products.slice(0, 8);
  const [activeProductId, setActiveProductId] = useState(topProducts[0]?.entity?.id || null);
  const activeProduct = topProducts.find((product) => product.entity?.id === activeProductId) || topProducts[0];
  const maxRevenue = Math.max(1, ...topProducts.map((product) => readMetric(product.revenue)));

  return (
    <section className="rounded border border-outline-variant/50 bg-white p-6 shadow-plum">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-primary">Product Performance</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{products.length} products ranked by revenue</p>
        </div>
        <Link to="/vendor/products/new" className="rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-container">
          New product
        </Link>
      </div>

      {topProducts.length === 0 ? (
        <p className="mt-8 rounded bg-surface-container-low p-6 text-center text-on-surface-variant">No product analytics yet.</p>
      ) : (
        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3">
            {topProducts.map((product, index) => {
              const productId = product.entity?.id;
              const isActive = activeProduct?.entity?.id === productId;
              return (
                <button
                  key={productId || index}
                  type="button"
                  onMouseEnter={() => setActiveProductId(productId)}
                  onFocus={() => setActiveProductId(productId)}
                  onClick={() => setActiveProductId(productId)}
                  className={`rounded border p-4 text-left transition ${
                    isActive ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-outline-variant/40 bg-white hover:bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface-variant">#{index + 1}</p>
                      <div className="mt-1 font-bold text-primary">
                        <ProductSemanticViews.ProductReference
                          entity={product.entity}
                          access={buildProductAccess({
                            product: product.entity,
                            viewer,
                            context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
                          })}
                        />
                      </div>
                    </div>
                    <p className="text-lg font-black text-primary">{money(product.revenue)}</p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${ratio(product.revenue, maxRevenue)}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-on-surface-variant">
                    <span>{product.orderCount} orders</span>
                    <span>{product.quantitySold} sold</span>
                    <span>{formatPercent(product.revenue, totalRevenue)} of revenue</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeProduct && (
            <aside className="rounded border border-outline-variant/50 bg-surface-container-lowest p-5">
              <p className="text-xs font-bold uppercase text-on-surface-variant">Selected Product</p>
              <h3 className="mt-2 text-xl font-black text-primary">
                <ProductSemanticViews.ProductReference
                  entity={activeProduct.entity}
                  access={buildProductAccess({
                    product: activeProduct.entity,
                    viewer,
                    context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
                  })}
                />
              </h3>

              <div className="mt-5 grid gap-3">
                <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-800">Revenue</p>
                  <p className="mt-1 text-2xl font-black text-emerald-900">{money(activeProduct.revenue)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded border border-outline-variant/40 bg-white p-4">
                    <p className="text-xs font-bold text-on-surface-variant">Orders</p>
                    <p className="mt-1 text-xl font-black text-primary">{activeProduct.orderCount}</p>
                  </div>
                  <div className="rounded border border-outline-variant/40 bg-white p-4">
                    <p className="text-xs font-bold text-on-surface-variant">Sold</p>
                    <p className="mt-1 text-xl font-black text-primary">{activeProduct.quantitySold}</p>
                  </div>
                </div>
                <div className="rounded border border-outline-variant/40 bg-white p-4">
                  <p className="text-xs font-bold text-on-surface-variant">Rating</p>
                  <p className="mt-1 text-xl font-black text-primary">
                    {decimal(activeProduct.averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} stars
                  </p>
                  <p className="mt-1 text-xs font-semibold text-on-surface-variant">{activeProduct.reviewCount} reviews</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenProduct(activeProduct)}
                className="mt-5 w-full rounded bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-container"
              >
                Open product
              </button>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}

export default function VendorAnalytics() {
  const viewer = useAuthStore((state) => state.viewer);
  const [analytics, setAnalytics] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchAnalytics = async (range = dateRange) => {
    if (!viewer.supplierId) {
      setAnalytics(null);
      setLoadError('Vendor profile is not active yet.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError('');
      const data = await analyticsService.getVendorAnalytics(
        viewer.supplierId,
        range.start || null,
        range.end || null
      );
      setAnalytics(selectVendorAnalyticsData(adaptVendorAnalyticsProjection(data)));
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
      setLoadError('We could not load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [viewer.supplierId]);

  const summary = useMemo(() => {
    const overview = analytics?.overview || {};
    const revenueHistory = analytics?.revenueHistory || [];
    const orderBreakdown = analytics?.orderBreakdown || [];
    const topProducts = analytics?.topProducts || [];
    const bestPeriod = revenueHistory.reduce((best, period) => (
      !best || readMetric(period.revenue) > readMetric(best.revenue) ? period : best
    ), null);
    const bestProduct = topProducts[0] || null;
    const revenueByStatuses = orderBreakdown.reduce((sum, status) => sum + readMetric(status.totalValue), 0);

    return {
      overview,
      revenueHistory,
      orderBreakdown,
      topProducts,
      bestPeriod,
      bestProduct,
      revenueByStatuses,
      storeName: analytics?.vendor?.storeName || analytics?.vendor?.supplierName || analytics?.vendor?.supplierId || 'Vendor analytics',
    };
  }, [analytics]);

  const handleDateFilter = (event) => {
    event.preventDefault();
    fetchAnalytics();
  };

  const clearDateFilter = () => {
    const clearedRange = { start: '', end: '' };
    setDateRange(clearedRange);
    fetchAnalytics(clearedRange);
  };

  const openProduct = async (product) => {
    const reference = product.entity || adaptEntityFromNamedSource('adaptProductAnalyticsReference', product);
    setSelectedProduct(reference);
    try {
      const authorized = authorizeEntityHydration('product', {
        entity: reference,
        id: reference.id,
        viewer,
        context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
      });
      const full = await hydrateEntityById('product', reference.id, { authorized });
      if (full) setSelectedProduct(full);
    } catch {
      // Keep the truthful partial reference and let the modal show only loaded fields.
    }
  };

  if (loading) {
    return (
      <AnalyticsShell>
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </AnalyticsShell>
    );
  }

  return (
    <AnalyticsShell>
      <header className="mb-8 grid gap-6 rounded border border-outline-variant/50 bg-white p-6 shadow-plum lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-bold text-secondary">Vendor Dashboard</p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Analytics</h1>
          <p className="mt-2 text-on-surface-variant">{summary.storeName}</p>
          {summary.bestPeriod && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-bold text-on-surface-variant">Best Period</p>
                <p className="mt-1 text-lg font-black text-primary">{summary.bestPeriod.period}</p>
                <p className="text-xs font-semibold text-on-surface-variant">{money(summary.bestPeriod.revenue)}</p>
              </div>
              <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-800">Top Product</p>
                <p className="mt-1 truncate text-lg font-black text-emerald-950">
                  {summary.bestProduct?.entity?.name || 'No product data'}
                </p>
                <p className="text-xs font-semibold text-emerald-800">{summary.bestProduct ? money(summary.bestProduct.revenue) : '-'}</p>
              </div>
              <div className="rounded border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-800">Status Value</p>
                <p className="mt-1 text-lg font-black text-blue-950">{money(summary.revenueByStatuses)}</p>
                <p className="text-xs font-semibold text-blue-800">{summary.orderBreakdown.length} statuses</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleDateFilter} className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-on-surface-variant">
              Start Date
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1 w-full rounded border border-outline-variant px-3 py-2 text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-sm font-bold text-on-surface-variant">
              End Date
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1 w-full rounded border border-outline-variant px-3 py-2 text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="rounded bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-container">
              Apply
            </button>
            {(dateRange.start || dateRange.end) && (
              <button type="button" onClick={clearDateFilter} className="rounded border border-outline-variant px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5">
                Clear
              </button>
            )}
          </div>
        </form>
      </header>

      {loadError && (
        <div className="mb-6 rounded border border-error/20 bg-error-container/40 p-4 text-error">
          <p>{loadError}</p>
          <button type="button" onClick={() => fetchAnalytics()} className="mt-3 font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {analytics && (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon="payments"
              label="Total Revenue"
              value={money(summary.overview.totalRevenue)}
              detail={`Average order ${money(summary.overview.averageOrderValue)}`}
              color="#341547"
            />
            <MetricTile
              icon="shopping_bag"
              label="Orders"
              value={compactNumber(summary.overview.totalOrders)}
              detail={`${summary.orderBreakdown.length} active statuses`}
              color="#2563eb"
            />
            <MetricTile
              icon="inventory_2"
              label="Products"
              value={compactNumber(summary.overview.totalProducts)}
              detail={`${summary.overview.approvedProducts || 0} approved, ${summary.overview.pendingProducts || 0} pending`}
              color="#0f766e"
            />
            <MetricTile
              icon="star"
              label="Reviews"
              value={`${decimal(summary.overview.averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} stars`}
              detail={`${summary.overview.totalReviews || 0} approved reviews`}
              color="#b45309"
            />
          </section>

          <div className="grid gap-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
              <RevenueHistoryPanel periods={summary.revenueHistory} />
              <ProductHealthPanel overview={summary.overview} />
            </div>

            <OrderStatusPanel statuses={summary.orderBreakdown} totalOrders={summary.overview.totalOrders || 0} />

            <ProductPerformancePanel
              products={summary.topProducts}
              totalRevenue={summary.overview.totalRevenue}
              viewer={viewer}
              onOpenProduct={openProduct}
            />
          </div>
        </>
      )}

      <ProductModal
        isOpen={!!selectedProduct}
        entity={selectedProduct}
        access={selectedProduct ? buildProductAccess({
          product: selectedProduct,
          viewer,
          context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
        }) : null}
        onClose={() => setSelectedProduct(null)}
        showPublicLink={Boolean(selectedProduct?.id)}
      />
    </AnalyticsShell>
  );
}
