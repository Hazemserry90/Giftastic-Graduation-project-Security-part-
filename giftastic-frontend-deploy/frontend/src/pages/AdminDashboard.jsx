import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { adminService } from '../services/adminService';
import { vendorApplicationService } from '../services/vendorApplicationService';
import { productService } from '../services/productService';
import commissionService from '../services/commissionService';
import reviewService from '../services/reviewService';
import { useAuthStore } from '../store/useAuthStore';
import UserModal from '../components/modals/UserModal';
import UserSummaryButton from '../components/modals/UserSummaryButton';
import VendorModal from '../components/modals/VendorModal';
import VendorApplicationModal from '../components/modals/VendorApplicationModal';
import ProductModal from '../components/modals/ProductModal';
import OrderModal from '../components/modals/OrderModal';
import AdminRequestModal from '../components/modals/AdminRequestModal';
import CategoryModal from '../components/modals/CategoryModal';
import CommissionModal from '../components/modals/CommissionModal';
import {
  buildUserAccess,
  buildUserActions,
  getUserStatusClass,
  getUserStatusLabel,
  getReadableUserField,
  getUserReferenceLabel,
  matchesUserSearch,
  USER_PERMISSION_GROUPS,
  USER_PERMISSION_META,
  getUserPermissionLabel,
  UserManagementRow,
  USER_CONTEXT,
} from '../ui/entities/user';
import UserAdminHistorySection from '../ui/entities/user/sections/UserAdminHistorySection';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { mergeEntityModels, patchEntityModel } from '../ui/entities/shared/entityModel';
import {
  buildVendorAccess,
  buildVendorActions,
  countVerifiedVendors,
  getVerifiedVendors,
  matchesVendorSearch,
  VendorManagementCard,
  VendorSemanticViews,
  VENDOR_CONTEXT,
} from '../ui/entities/vendor';
import {
  buildProductAccess,
  buildProductActions,
  getProductStatusClass,
  isProductApproved,
  ProductManagementCard,
  ProductSemanticViews,
  PRODUCT_CONTEXT,
} from '../ui/entities/product';
import {
  buildOrderAccess,
  formatOrderDate,
  formatOrderMoney,
  getOrderStatusOptions,
  isOrderPendingConfirmation,
  getShortOrderId,
  matchesOrderSearch,
  OrderManagementCard,
  ORDER_CONTEXT,
} from '../ui/entities/order';
import InstapayPaymentConversation from '../ui/entities/order/InstapayPaymentConversation';
import { buildAdminRequestAccess, buildAdminRequestActions, matchesAdminRequestSearch, AdminRequestSemanticViews, ADMIN_REQUEST_CONTEXT } from '../ui/entities/adminRequest';
import { formatMoney, multiplyDecimal } from '../ui/entities/shared/decimal';
import { createCommissionRuleDraft, mapCommissionRulePayload } from '../ui/commands/commissionRule';
import { createReviewRestrictionDraft, mapReviewRestrictionPayload } from '../ui/commands/reviewRestriction';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';
import { authorizeEntityHydration, hydrateEntityById } from '../ui/entities/shared/productionHydration';
import {
  buildUserReviewRestrictionAccess,
  buildUserReviewRestrictionActions,
  isRestrictionReasonDirty,
  UserReviewRestrictionEditor,
  USER_REVIEW_RESTRICTION_CONTEXT,
} from '../ui/entities/userReviewRestriction';
import {
  buildCategoryAccess,
  buildCategoryActions,
  CategorySemanticViews,
  CATEGORY_CONTEXT,
} from '../ui/entities/category';
import {
  buildVendorApplicationAccess,
  buildVendorApplicationActions,
  matchesVendorApplicationSearch,
  VendorApplicationSummary,
  VENDOR_APPLICATION_CONTEXT,
} from '../ui/entities/vendorApplication';
import {
  buildCommissionAccess,
  buildCommissionActions,
  CommissionSummary,
  COMMISSION_CONTEXT,
  formatCommissionMoney,
  groupInstapayPayoutsByVendor,
} from '../ui/entities/commission';
import {
  buildCommissionPaymentRequestAccess,
  buildCommissionPaymentRequestActions,
  CommissionPaymentRequestSummary,
  COMMISSION_PAYMENT_REQUEST_CONTEXT,
  PaymentWorkflowCard,
} from '../ui/entities/commissionPaymentRequest';
import PaymentRequestConversation from '../ui/entities/commissionPaymentRequest/PaymentRequestConversation';
import {
  buildCommissionRuleAccess,
  buildCommissionRuleActions,
  CommissionRuleSummary,
} from '../ui/entities/commissionRule';
import {
  buildOrderAssistanceAccess,
  buildOrderAssistanceActions,
  OrderAssistanceSemanticViews,
  ORDER_ASSISTANCE_CONTEXT,
} from '../ui/entities/orderAssistance';
import { viewerHasCapability } from '../ui/entities/shared';
import { adaptPlatformAnalyticsProjection } from '../ui/projections';
import { executeFinancialAction, loadFinancialSection } from '../ui/workflows/financialWorkflow';
import { selectFinancialMetricFormat as formatCurrency } from '../ui/projections/financialAnalytics/FinancialAnalyticsSelectors';

function Modal({ isOpen, onClose, title, children }) {
  const titleId = useId();
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16, maxWidth: 800, width: '100%',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #eadfd7',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 id={titleId} style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#341547' }}>{title}</h3>
          <button type="button" aria-label={`Close ${title}`} onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
            color: '#4b444d', padding: 0, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isOk = toast.type === 'success';
  return (
    <div style={{
      position: 'fixed', top: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 12,
      background: isOk ? '#ecfdf5' : '#fef2f2',
      border: `1px solid ${isOk ? '#6ee7b7' : '#fca5a5'}`,
      color: isOk ? '#065f46' : '#991b1b',
      padding: '14px 24px', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,.15)',
      fontWeight: 600, fontSize: 14,
    }}>
      <span className="material-symbols-outlined">{isOk ? 'check_circle' : 'error'}</span>
      {toast.msg}
      <button type="button" aria-label="Close notification" onClick={onClose} style={{ marginLeft: 8, opacity: .6, cursor: 'pointer', background: 'none', border: 'none', fontSize: 18 }}>
        <span className="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
  );
}

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

const getVendorAnalyticsKey = (vendor, index = 0) => vendor?.entity?.supplierId || vendor?.entity?.id || `${vendor?.entity?.storeName || 'vendor'}-${index}`;

const getVendorAnalyticsName = (vendor) => vendor?.entity?.storeName || vendor?.entity?.supplierName || vendor?.entity?.supplierId || 'Vendor';

const analyticsPanelStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 22,
  background: '#fff',
  boxShadow: '0 14px 40px rgba(15, 23, 42, 0.06)',
};

function MetricCard({ label, value, detail, color, icon }) {
  const [isActive, setIsActive] = useState(false);
  return (
    <div
      role="group"
      tabIndex={0}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      style={{
        border: `1px solid ${color}${isActive ? '66' : '30'}`,
        background: isActive ? `${color}12` : `${color}0d`,
        borderRadius: 14,
        padding: 18,
        minHeight: 130,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isActive ? `0 16px 36px ${color}20` : '0 8px 22px rgba(15, 23, 42, 0.04)',
        transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, color: '#475569', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 }}>{label}</p>
        <span className="material-symbols-outlined" style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <p style={{ margin: 0, color, fontSize: 26, fontWeight: 900 }}>{value}</p>
        {detail && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{detail}</p>}
      </div>
      <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginTop: 14 }}>
        <div style={{ width: isActive ? '100%' : '44%', height: '100%', background: color, borderRadius: 999, transition: 'width .22s ease' }} />
      </div>
    </div>
  );
}

function RevenueFlowChart({ analytics }) {
  const items = [
    { key: 'vendor', label: 'Vendor Earnings', value: analytics.totalVendorEarnings, color: '#047857', icon: 'storefront' },
    { key: 'platform', label: 'Platform Revenue', value: analytics.totalPlatformRevenue, color: '#7c3aed', icon: 'account_balance' },
    { key: 'delivery', label: 'Delivery Cost', value: analytics.totalDeliveryCost, color: '#0284c7', icon: 'local_shipping' },
  ];
  const total = items.reduce((sum, item) => sum + readMetric(item.value), 0);
  const [activeKey, setActiveKey] = useState(items[0].key);
  const active = items.find((item) => item.key === activeKey) || items[0];

  return (
    <section style={{ ...analyticsPanelStyle, minHeight: 332, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 900 }}>Revenue Split</h4>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Platform, vendor, and delivery portions from the same financial totals.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 }}>Tracked Total</p>
          <p style={{ margin: '3px 0 0', color: '#0f172a', fontSize: 20, fontWeight: 900 }}>{formatCurrency(total)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', height: 74, borderRadius: 18, overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
        {items.map((item) => {
          const percent = ratio(item.value, total);
          const isActive = item.key === active.key;
          return (
            <button
              key={item.key}
              type="button"
              title={`${item.label}: ${formatCurrency(item.value)} (${percent.toFixed(1)}%)`}
              onMouseEnter={() => setActiveKey(item.key)}
              onFocus={() => setActiveKey(item.key)}
              onClick={() => setActiveKey(item.key)}
              style={{
                flexBasis: `${Math.max(5, percent)}%`,
                flexGrow: percent,
                border: 'none',
                background: item.color,
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.78,
                transform: isActive ? 'scaleY(1)' : 'scaleY(.84)',
                transformOrigin: 'bottom',
                transition: 'opacity .18s ease, transform .18s ease',
              }}
              aria-label={`${item.label} ${formatCurrency(item.value)}`}
            />
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {items.map((item) => {
          const isActive = item.key === active.key;
          return (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setActiveKey(item.key)}
              onFocus={() => setActiveKey(item.key)}
              onClick={() => setActiveKey(item.key)}
              style={{
                border: `1px solid ${isActive ? item.color : '#e2e8f0'}`,
                background: isActive ? `${item.color}10` : '#f8fafc',
                borderRadius: 12,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>{item.icon}</span>
              <span style={{ color: '#334155', fontSize: 12, fontWeight: 900 }}>{item.label}</span>
              <p style={{ margin: '8px 0 0', color: item.color, fontSize: 18, fontWeight: 900 }}>{formatCurrency(item.value)}</p>
              <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12, fontWeight: 700 }}>{formatPercent(item.value, total)} of split</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PaymentMixDonut({ analytics }) {
  const slices = [
    { label: 'COD', value: analytics.codOrderValue, count: analytics.counts?.codOrderCount || 0, color: '#0ea5e9' },
    { label: 'Instapay', value: analytics.instapayOrderValue, count: analytics.counts?.instapayOrderCount || 0, color: '#10b981' },
    { label: 'Invalid / Failed', value: analytics.invalidOrFailedPayments, count: analytics.counts?.invalidOrFailedOrderCount || 0, color: '#ef4444' },
  ];
  const total = slices.reduce((sum, item) => sum + readMetric(item.value), 0);
  const [activeLabel, setActiveLabel] = useState(slices[0].label);
  const active = slices.find((item) => item.label === activeLabel) || slices[0];
  let cursor = 0;
  const gradient = total ? slices.map((item) => {
    const start = cursor;
    cursor += (readMetric(item.value) / total) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(', ') : '#e2e8f0 0% 100%';

  return (
    <section style={{ ...analyticsPanelStyle, minHeight: 332 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 900 }}>Payment Mix</h4>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>COD, Instapay, and failed payment value.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 }}>Payment Total</p>
          <p style={{ margin: '3px 0 0', color: '#0f172a', fontSize: 20, fontWeight: 900 }}>{formatCurrency(total)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: 26, alignItems: 'center', marginTop: 20 }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <div style={{
            width: 'min(270px, 100%)',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            background: `conic-gradient(${gradient})`,
            display: 'grid',
            placeItems: 'center',
            boxShadow: `0 20px 46px ${active.color}20, inset 0 0 0 1px #e2e8f0`,
            transition: 'box-shadow .18s ease',
          }}>
            <div style={{
              width: '58%',
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              background: 'white',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: 12,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 900 }}>{active.label}</span>
              <span style={{ fontSize: 19, color: active.color, fontWeight: 900 }}>{formatCurrency(active.value)}</span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>{formatPercent(active.value, total)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {slices.map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setActiveLabel(item.label)}
              onFocus={() => setActiveLabel(item.label)}
              onClick={() => setActiveLabel(item.label)}
              style={{
                border: `1px solid ${active.label === item.label ? item.color : '#e2e8f0'}`,
                background: active.label === item.label ? `${item.color}0f` : '#fff',
                borderRadius: 12,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, fontWeight: 900 }}>
                <span style={{ color: '#334155' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: item.color, marginRight: 7 }} />{item.label}</span>
                <span style={{ color: item.color }}>{formatCurrency(item.value)}</span>
              </div>
              <div style={{ marginTop: 5, height: 7, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ width: `${ratio(item.value, total)}%`, height: '100%', background: item.color, borderRadius: 999 }} />
              </div>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 12, fontWeight: 700 }}>{item.count} orders · {formatPercent(item.value, total)}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MonthlyBars({ months = [] }) {
  const recent = months.slice(-8);
  const max = Math.max(1, ...recent.map((month) => readMetric(month.customerPayments)));
  const [activeMonthKey, setActiveMonthKey] = useState(recent[recent.length - 1]?.month || null);
  const activeMonth = recent.find((month) => month.month === activeMonthKey) || recent[recent.length - 1];
  const chartHeight = 220;

  return (
    <section style={{ ...analyticsPanelStyle, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 900 }}>Monthly Flow</h4>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Hover or click a month to inspect its exact split.</p>
        </div>
        {activeMonth && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ padding: '8px 10px', borderRadius: 999, background: '#eff6ff', color: '#0369a1', fontSize: 12, fontWeight: 900 }}>{activeMonth.month}</span>
            <span style={{ padding: '8px 10px', borderRadius: 999, background: '#f8fafc', color: '#0f172a', fontSize: 12, fontWeight: 900 }}>{formatCurrency(activeMonth.customerPayments)}</span>
          </div>
        )}
      </div>
      {recent.length === 0 ? (
        <p style={{ color: '#64748b', marginBottom: 0 }}>No monthly financial data yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${recent.length}, minmax(104px, 1fr))`, gap: 12, alignItems: 'end', minHeight: 300, marginTop: 18, overflowX: 'auto', paddingBottom: 6 }}>
            {recent.map((month) => {
              const isActive = activeMonth?.month === month.month;
              const codHeight = Math.max(8, (readMetric(month.codOrderValue) / max) * chartHeight);
              const instapayHeight = Math.max(8, (readMetric(month.instapayOrderValue) / max) * chartHeight);
              const failedHeight = Math.max(8, (readMetric(month.invalidOrFailedPayments) / max) * chartHeight);
              return (
                <button
                  key={month.month}
                  type="button"
                  onMouseEnter={() => setActiveMonthKey(month.month)}
                  onFocus={() => setActiveMonthKey(month.month)}
                  onClick={() => setActiveMonthKey(month.month)}
                  style={{
                    display: 'grid',
                    gap: 9,
                    alignItems: 'end',
                    border: `1px solid ${isActive ? '#94a3b8' : 'transparent'}`,
                    background: isActive ? '#f8fafc' : 'transparent',
                    borderRadius: 14,
                    padding: '10px 8px',
                    cursor: 'pointer',
                    minWidth: 104,
                  }}
                >
                  <div style={{ height: chartHeight, display: 'flex', alignItems: 'end', gap: 6, justifyContent: 'center' }}>
                    <div title={`COD ${formatCurrency(month.codOrderValue)}`} style={{ width: 19, height: codHeight, borderRadius: '8px 8px 4px 4px', background: '#0ea5e9', boxShadow: isActive ? '0 10px 18px rgba(14, 165, 233, .26)' : 'none' }} />
                    <div title={`Instapay ${formatCurrency(month.instapayOrderValue)}`} style={{ width: 19, height: instapayHeight, borderRadius: '8px 8px 4px 4px', background: '#10b981', boxShadow: isActive ? '0 10px 18px rgba(16, 185, 129, .22)' : 'none' }} />
                    <div title={`Invalid / Failed ${formatCurrency(month.invalidOrFailedPayments)}`} style={{ width: 19, height: failedHeight, borderRadius: '8px 8px 4px 4px', background: '#ef4444', boxShadow: isActive ? '0 10px 18px rgba(239, 68, 68, .2)' : 'none' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: 12, fontWeight: 900 }}>{month.month}</p>
                    <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 11, fontWeight: 700 }}>{formatCurrency(month.customerPayments)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {activeMonth && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p style={{ margin: 0, color: '#0369a1', fontSize: 12, fontWeight: 900 }}>COD</p>
                <p style={{ margin: '5px 0 0', color: '#0f172a', fontSize: 16, fontWeight: 900 }}>{formatCurrency(activeMonth.codOrderValue)}</p>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                <p style={{ margin: 0, color: '#047857', fontSize: 12, fontWeight: 900 }}>Instapay</p>
                <p style={{ margin: '5px 0 0', color: '#0f172a', fontSize: 16, fontWeight: 900 }}>{formatCurrency(activeMonth.instapayOrderValue)}</p>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca' }}>
                <p style={{ margin: 0, color: '#b91c1c', fontSize: 12, fontWeight: 900 }}>Invalid / Failed</p>
                <p style={{ margin: '5px 0 0', color: '#0f172a', fontSize: 16, fontWeight: 900 }}>{formatCurrency(activeMonth.invalidOrFailedPayments)}</p>
              </div>
            </div>
          )}
        </>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#0ea5e9', borderRadius: 999, marginRight: 5 }} />COD</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: 999, marginRight: 5 }} />Instapay</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#ef4444', borderRadius: 999, marginRight: 5 }} />Invalid / Failed</span>
      </div>
    </section>
  );
}

function VendorLeaderboard({ vendors = [] }) {
  const top = [...vendors].sort((left, right) => readMetric(right.totalEarnings) - readMetric(left.totalEarnings)).slice(0, 8);
  const max = Math.max(1, ...top.map((vendor) => readMetric(vendor.totalEarnings)));
  const [activeKey, setActiveKey] = useState(getVendorAnalyticsKey(top[0], 0));
  const activeVendor = top.find((vendor, index) => getVendorAnalyticsKey(vendor, index) === activeKey) || top[0];

  return (
    <section style={{ ...analyticsPanelStyle }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 900 }}>Vendor Earnings Leaders</h4>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Select a vendor to inspect earnings and open settlement exposure.</p>
        </div>
        {activeVendor && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 }}>Selected Vendor</p>
            <p style={{ margin: '3px 0 0', color: '#0f172a', fontSize: 16, fontWeight: 900 }}>{getVendorAnalyticsName(activeVendor)}</p>
          </div>
        )}
      </div>
      {top.length === 0 ? (
        <p style={{ color: '#64748b', marginBottom: 0 }}>No vendor financial data yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 18, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {top.map((vendor, index) => {
              const key = getVendorAnalyticsKey(vendor, index);
              const name = getVendorAnalyticsName(vendor);
              const isActive = activeVendor && getVendorAnalyticsKey(activeVendor, index) === key;
              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setActiveKey(key)}
                  onFocus={() => setActiveKey(key)}
                  onClick={() => setActiveKey(key)}
                  style={{
                    border: `1px solid ${isActive ? '#14b8a6' : '#e2e8f0'}`,
                    background: isActive ? '#f0fdfa' : '#fff',
                    borderRadius: 13,
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 12px 26px rgba(20, 184, 166, .12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: 13, fontWeight: 900 }}>#{index + 1} {name}</p>
                    <p style={{ margin: 0, color: '#047857', fontSize: 13, fontWeight: 900 }}>{formatCurrency(vendor.totalEarnings)}</p>
                  </div>
                  <div style={{ marginTop: 7, height: 10, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${ratio(vendor.totalEarnings, max)}%`, height: '100%', borderRadius: 999, background: '#14b8a6' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 11, fontWeight: 700 }}>{formatPercent(vendor.totalEarnings, max)} of top vendor earnings</p>
                </button>
              );
            })}
          </div>

          {activeVendor && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 15, background: '#f8fafc', padding: 16, minHeight: 240 }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0 }}>Vendor Snapshot</p>
              <h5 style={{ margin: '7px 0 14px', color: '#0f172a', fontSize: 20, fontWeight: 900 }}>{getVendorAnalyticsName(activeVendor)}</h5>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 12, background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: 0, color: '#047857', fontSize: 12, fontWeight: 900 }}>Total Earnings</p>
                  <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 21, fontWeight: 900 }}>{formatCurrency(activeVendor.totalEarnings)}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <p style={{ margin: 0, color: '#b45309', fontSize: 12, fontWeight: 900 }}>COD Owed</p>
                    <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 15, fontWeight: 900 }}>{formatCurrency(activeVendor.commissionsOwed)}</p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <p style={{ margin: 0, color: '#4338ca', fontSize: 12, fontWeight: 900 }}>Instapay Due</p>
                    <p style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 15, fontWeight: 900 }}>{formatCurrency(activeVendor.pendingPayouts)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function FinancialAnalyticsShowcase({ analytics, title = 'Financial Overview', onOpenFinancial }) {
  if (!analytics) return null;
  const settlementTotal = readMetric(analytics.totalCommissionsOwed) + readMetric(analytics.pendingVendorPayouts);
  const revenueTotal = readMetric(analytics.totalPlatformRevenue) + readMetric(analytics.totalVendorEarnings) + readMetric(analytics.totalDeliveryCost);
  const financialOrderCount = (analytics.counts?.codOrderCount || 0)
    + (analytics.counts?.instapayOrderCount || 0)
    + (analytics.counts?.invalidOrFailedOrderCount || 0);

  return (
    <section style={{ display: 'grid', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 26, fontWeight: 900 }}>{title}</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Live financial picture using the same analytics data as Financials.
          </p>
        </div>
        {onOpenFinancial && (
          <button type="button" onClick={onOpenFinancial} style={{ border: '1px solid #cbd5e1', background: 'white', color: '#334155', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}>
            Open financials
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <MetricCard icon="payments" label="Customer Payments" value={formatCurrency(analytics.totalCustomerPayments)} detail={`${financialOrderCount} financial orders`} color="#3730a3" />
        <MetricCard icon="account_balance" label="Platform Revenue" value={formatCurrency(analytics.totalPlatformRevenue)} detail={`${ratio(analytics.totalPlatformRevenue, revenueTotal).toFixed(1)}% of revenue flow`} color="#7c3aed" />
        <MetricCard icon="storefront" label="Vendor Earnings" value={formatCurrency(analytics.totalVendorEarnings)} detail={`${analytics.byVendor?.length || 0} vendors`} color="#047857" />
        <MetricCard icon="sync_problem" label="Open Settlements" value={formatCurrency(settlementTotal)} detail="COD owed + Instapay due" color="#b45309" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        <PaymentMixDonut analytics={analytics} />
        <RevenueFlowChart analytics={analytics} />
      </div>
      <MonthlyBars months={analytics.byMonth || []} />
      <VendorLeaderboard vendors={analytics.byVendor || []} />
    </section>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8f8179', fontSize: 20 }}>search</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px 10px 40px', borderRadius: 12,
          border: '1.5px solid #eadfd7', fontSize: 14, outline: 'none',
          transition: 'all .2s',
        }}
        onFocus={(e) => e.target.style.borderColor = '#341547'}
        onBlur={(e) => e.target.style.borderColor = '#eadfd7'}
      />
    </div>
  );
}

function PermissionTile({ perm, granted, onClick }) {
  const meta = USER_PERMISSION_META[perm] || { label: perm, icon: 'lock', color: '#8f8179' };
  return (
    <button
      onClick={() => granted && onClick && onClick()}
      disabled={!granted}
      title={granted ? `Use ${meta.label}` : `You don't have ${meta.label}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '18px 12px', borderRadius: 16,
        border: `2px solid ${granted ? meta.color + '55' : '#eadfd7'}`,
        background: granted ? `${meta.color}10` : '#fbf9f6',
        opacity: granted ? 1 : 0.45,
        cursor: granted ? 'pointer' : 'not-allowed',
        transition: 'all .18s', minWidth: 120, flex: '1 1 120px',
        position: 'relative',
      }}
      onMouseEnter={e => granted && (e.currentTarget.style.transform = 'translateY(-3px)')}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 28, color: granted ? meta.color : '#8f8179' }}>
        {meta.icon}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: granted ? '#341547' : '#8f8179', lineHeight: 1.3 }}>
        {meta.label}
      </span>
      {granted && (
        <span style={{
          position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
          background: meta.color,
        }} />
      )}

    </button>
  );
}

function UsersPanel({ has, toast, viewer }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detailUser, setDetailUser] = useState(null);
  const [userAdminRequests, setUserAdminRequests] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [reviewRestriction, setReviewRestriction] = useState(null);
  const [restrictionBaselineReason, setRestrictionBaselineReason] = useState('');
  const [restrictionDraft, setRestrictionDraft] = useState(() => createReviewRestrictionDraft({
    canComment: false, canReview: false, reason: '', expiresAt: '',
  }));

  useEffect(() => {
    if (has('VIEW_USERS')) adminService.getAllUsers()
      .then((users) => setUsers((users || []).map((user) =>
        adaptEntityFromNamedSource('adaptUserAdminManagementRecord', user)))).catch(() => {});
  }, []);

  useEffect(() => {
    if (has('VIEW_FINANCIAL_ANALYTICS')) {
      adminService.getPlatformAnalytics()
        .then(data => setTopCustomers(adaptPlatformAnalyticsProjection(data).data.topCustomers))
        .catch(() => setTopCustomers([]));
    }
  }, []);

  useEffect(() => {
    if (detailUser && has('REVIEW_ADMIN_REQUESTS')) {
      import('../services/adminRequestService').then(m => {
        m.adminRequestService.getUserRequests(detailUser.id)
          .then((requests) => setUserAdminRequests((requests || []).map((request) =>
            adaptEntityFromNamedSource('adaptAdminRequestDto', request))))
          .catch(() => setUserAdminRequests([]));
      });
    }
  }, [detailUser]);

  useEffect(() => {
    if (!detailUser) {
      setReviewRestriction(null);
      setRestrictionBaselineReason('');
      return;
    }
    const placeholder = adaptEntityFromNamedSource('adaptUserReviewRestrictionResponse', { userId: detailUser.id });
    setReviewRestriction(placeholder);
    setRestrictionBaselineReason('');
    setRestrictionDraft(createReviewRestrictionDraft({
      canComment: false, canReview: false, reason: '', expiresAt: '',
    }));
    if (!viewerHasCapability(viewer, 'VIEW_REVIEWS')) return;
    reviewService.getRestriction(detailUser.id).then((raw) => {
      const model = adaptEntityFromNamedSource('adaptUserReviewRestrictionResponse', raw);
      setReviewRestriction(model);
      setRestrictionBaselineReason(model.reason || '');
      setRestrictionDraft(createReviewRestrictionDraft({
        canComment: model.canComment,
        canReview: model.canReview,
        reason: model.reason || '',
        expiresAt: model.expiresAt ? String(model.expiresAt).slice(0, 16) : '',
      }));
    }).catch(() => {});
  }, [detailUser, viewer]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter((user) => matchesUserSearch(
      user,
      searchTerm,
      buildUserAccess({ user, viewer, context: USER_CONTEXT.ADMIN_MANAGEMENT }),
    ));
  }, [users, searchTerm, viewer]);

  const act = async (fn, onSuccess) => {
    setLoading(true);
    try {
      const result = await fn();
      onSuccess(result);
      toast('Action completed successfully', 'success');
      return { ok: true, result };
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const updateUserState = (userId, patch) => {
    const mergePatch = (user) => mergeEntityModels(
      user,
      adaptEntityFromNamedSource('adaptUserAdminManagementRecord', { id: userId, ...patch }),
    );
    setUsers(prev => prev.map(user => user.id === userId ? mergePatch(user) : user));
    setDetailUser(prev => prev?.id === userId ? mergePatch(prev) : prev);
  };

  const handleUserModalAction = (action, targetUser) => {
    if (action === 'ban') {
      act(() => adminService.banUser(targetUser.id), () => updateUserState(targetUser.id, { isBanned: true }));
    }
    if (action === 'unban') {
      act(() => adminService.unbanUser(targetUser.id), () => updateUserState(targetUser.id, { isBanned: false }));
    }
    if (action === 'makeAdmin') {
      act(() => adminService.promoteToAdmin(targetUser.id), () => updateUserState(targetUser.id, { isAdmin: true }));
    }
    if (action === 'demoteAdmin') {
      act(() => adminService.demoteAdmin(targetUser.id), () => updateUserState(targetUser.id, { isAdmin: false, permissions: [] }));
    }
  };

  const handleResetAdminCooldown = (request) => {
    act(
      () => import('../services/adminRequestService').then(m => m.adminRequestService.resetCooldown(request.id)),
      () => setUserAdminRequests(prev => prev.map(r =>
        r.id === request.id ? patchEntityModel(r, { canReapplyAt: null }) : r))
    );
  };

  const getUserAccess = (entity, context = USER_CONTEXT.ADMIN_READ) => buildUserAccess({
    user: entity,
    viewer,
    context,
  });
  const detailUserAccess = detailUser ? getUserAccess(detailUser) : null;
  const detailUserActions = detailUser && detailUserAccess
    ? buildUserActions({
      user: detailUser,
      access: detailUserAccess,
      supportedActions: ['ban', 'unban', 'makeAdmin', 'demoteAdmin'],
      onAction: (action) => handleUserModalAction(action, detailUser),
    })
    : [];
  const restrictionAccess = reviewRestriction ? buildUserReviewRestrictionAccess({
    restriction: reviewRestriction,
    viewer,
    context: USER_REVIEW_RESTRICTION_CONTEXT.MODERATION,
  }) : null;
  const restrictionIsDirty = isRestrictionReasonDirty(restrictionDraft.reason, restrictionBaselineReason);
  const saveRestriction = async () => {
    const mapped = mapReviewRestrictionPayload(restrictionDraft);
    if (!mapped.ok || !detailUser) return;
    if (!restrictionIsDirty) {
      toast('No restriction changes to save', 'info');
      return;
    }
    setLoading(true);
    try {
      const raw = await reviewService.createOrUpdateRestriction(detailUser.id, mapped.payload);
      setReviewRestriction(adaptEntityFromNamedSource('adaptUserReviewRestrictionResponse', raw));
      setRestrictionBaselineReason(mapped.payload.reason);
      try {
        await adminService.sendNotification({
          target: 'USER',
          targetId: detailUser.id,
          title: 'Review permissions updated',
          message: mapped.payload.reason,
        });
        toast('Restriction saved and user notified', 'success');
      } catch (notificationError) {
        toast(notificationError.response?.data?.message || 'Restriction saved, but the user notification failed', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save restriction', 'error');
    } finally {
      setLoading(false);
    }
  };
  const removeRestriction = async () => {
    if (!detailUser) return;
    await act(
      () => reviewService.removeRestriction(detailUser.id),
      () => {
        setReviewRestriction(adaptEntityFromNamedSource('adaptUserReviewRestrictionResponse', { userId: detailUser.id }));
        setRestrictionBaselineReason('');
        setRestrictionDraft(createReviewRestrictionDraft({
          canComment: false, canReview: false, reason: '', expiresAt: '',
        }));
      },
    );
  };
  const restrictionActions = reviewRestriction && restrictionAccess
    ? buildUserReviewRestrictionActions({
      restriction: reviewRestriction,
      access: restrictionAccess,
      handlers: { save: saveRestriction, remove: removeRestriction },
    })
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {has('VIEW_FINANCIAL_ANALYTICS') && topCustomers.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eadfd7', padding: 16 }}>
          <div style={{ fontWeight: 700, color: '#341547', marginBottom: 12 }}>Top Paying Users</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {topCustomers.slice(0, 6).map((customer, index) => {
              const entity = customer.entity;
              return (
              <div key={entity.id} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
                <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: '#4b444d', textAlign: 'center' }}>#{index + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <UserSummaryButton
                    compact
                    entity={entity}
                    access={getUserAccess(entity, USER_CONTEXT.ADMIN_FINANCIAL)}
                    onClick={() => setDetailUser(entity)}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                  {formatMoney(customer.totalSpent) || '-'}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
      {has('VIEW_USERS') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontWeight: 700, color: '#341547', margin: 0 }}>
              All Users ({filteredUsers.length})
            </h4>
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search users by email, name, phone, or ID..." />
          </div>

          <div style={{ overflowX: 'auto', background: 'white', borderRadius: 12, border: '1px solid #eadfd7' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fbf9f6', color: '#4b444d', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Contact</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const rowAccess = getUserAccess(u);
                  const rowActions = buildUserActions({
                    user: u,
                    access: rowAccess,
                    supportedActions: ['ban', 'unban'],
                    onAction: (action) => handleUserModalAction(action, u),
                  });
                  return (
                    <UserManagementRow
                      key={u.id}
                      user={u}
                      access={rowAccess}
                      actions={rowActions}
                      loading={loading}
                      onDetails={setDetailUser}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserModal
        isOpen={!!detailUser}
        entity={detailUser}
        access={detailUserAccess}
        actions={detailUserActions}
        onClose={() => setDetailUser(null)}
        renderAdminHistory={() => (
          <>
            <UserAdminHistorySection
              requests={userAdminRequests}
              onResetCooldown={has('MAKE_ADMINS') ? handleResetAdminCooldown : undefined}
            />
            <UserReviewRestrictionEditor
              draft={restrictionDraft}
              access={restrictionAccess}
              actions={restrictionActions}
              onChange={setRestrictionDraft}
              loading={loading}
              saveDisabled={!restrictionIsDirty}
            />
          </>
        )}
        actionLoading={loading}
        showPublicLink={Boolean(detailUser?.id)}
      />
    </div>
  );
}

function AdminRequestsPanel({ has, toast, viewer }) {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { adminRequestService } = await import('../services/adminRequestService');
      const allRequests = await adminRequestService.getAllRequests();
      setRequests((allRequests || []).map((request) =>
        adaptEntityFromNamedSource('adaptAdminRequestDto', request)));
    } catch (err) {
      console.error('Failed to load admin requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    if (filter !== 'all') {
      filtered = filtered.filter(r => String(r.status || '').toLowerCase() === filter);
    }

    if (!searchTerm) return filtered;
    
    const term = searchTerm.toLowerCase();
    return filtered.filter((request) => matchesAdminRequestSearch(
      request,
      term,
      buildAdminRequestAccess({ request, viewer, context: ADMIN_REQUEST_CONTEXT.ADMIN }),
    ));
  }, [requests, searchTerm, filter, viewer]);

  const act = async (fn, onSuccess) => {
    setLoading(true);
    try {
      await fn();
      onSuccess();
      toast('Action completed successfully', 'success');
      await fetchRequests();
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    const { adminRequestService } = await import('../services/adminRequestService');
    await act(
      () => adminRequestService.approveRequest(requestId),
      () => setSelectedRequest(null)
    );
  };

  const handleReject = async (requestId) => {
    const { adminRequestService } = await import('../services/adminRequestService');
    await act(
      () => adminRequestService.rejectRequest(requestId, rejectNotes.trim() || undefined),
      () => {
        setRequests((current) => current.map((request) => request.id === requestId
          ? patchEntityModel(request, { status: 'REJECTED', reviewNotes: rejectNotes.trim() || null })
          : request));
        setSelectedRequest(null);
        setRejectNotes('');
      }
    );
  };

  const handleInvalidate = async (requestId) => {
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', { decision: 'INVALIDATE', notes: rejectNotes }));
    if (!mapped.ok) { toast(Object.values(mapped.errors)[0], 'error'); return; }
    const { adminRequestService } = await import('../services/adminRequestService');
    await act(
      () => adminRequestService.invalidateRequest(requestId, mapped.payload.notes),
      () => {
        setSelectedRequest(null);
        setRejectNotes('');
      }
    );
  };

  const handleModalAction = (action, request) => {
    if (action === 'approve') return handleApprove(request.id);
    if (action === 'reject') return handleReject(request.id);
    if (action === 'invalidate') return handleInvalidate(request.id);
    if (action === 'resetCooldown') {
      return import('../services/adminRequestService').then(({ adminRequestService }) => act(
        () => adminRequestService.resetCooldown(request.id),
        () => setSelectedRequest(null)
      ));
    }
  };

  const selectedRequestAccess = selectedRequest ? buildAdminRequestAccess({
    request: selectedRequest,
    viewer,
    context: ADMIN_REQUEST_CONTEXT.ADMIN,
  }) : null;
  const selectedRequestActions = selectedRequest && selectedRequestAccess ? buildAdminRequestActions({
    request: selectedRequest,
    access: selectedRequestAccess,
    handlers: {
      approve: () => handleModalAction('approve', selectedRequest),
      reject: () => handleModalAction('reject', selectedRequest),
      invalidate: () => handleModalAction('invalidate', selectedRequest),
      resetCooldown: () => handleModalAction('resetCooldown', selectedRequest),
    },
  }) : [];

  const getRequestActions = (request) => {
    const access = buildAdminRequestAccess({ request, viewer, context: ADMIN_REQUEST_CONTEXT.ADMIN });
    return buildAdminRequestActions({
      request,
      access,
      handlers: {
        approve: () => handleModalAction('approve', request),
        reject: () => handleModalAction('reject', request),
        invalidate: () => handleModalAction('invalidate', request),
        resetCooldown: () => handleModalAction('resetCooldown', request),
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 24, border: '1px solid #eadfd7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#341547', margin: 0, marginBottom: 4 }}>
              Admin Role Requests
            </h3>
            <p style={{ fontSize: 14, color: '#4b444d', margin: 0 }}>
              Review and manage user requests to become admins
            </p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            style={{
              padding: '10px 16px', borderRadius: 10, border: '1px solid #eadfd7',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 600, fontSize: 14, color: '#341547',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by email, name, or message..." />
          
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '10px 16px', borderRadius: 10,
                  border: filter === f ? '2px solid #341547' : '1px solid #eadfd7',
                  background: filter === f ? '#eef2ff' : 'white',
                  color: filter === f ? '#341547' : '#4b444d',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b444d' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b444d' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>inbox</span>
            <p style={{ marginTop: 12, fontSize: 14 }}>No admin requests found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filteredRequests.map(req => (
              <AdminRequestSemanticViews.AdminRequestModerationCard
                key={req.id}
                entity={req}
                access={buildAdminRequestAccess({
                  request: req,
                  viewer,
                  context: ADMIN_REQUEST_CONTEXT.ADMIN,
                })}
                actions={getRequestActions(req)}
                onDetails={setSelectedRequest}
                pendingKey={loading ? 'loading' : null}
              />
            ))}
          </div>
        )}
      </div>

      <AdminRequestModal
        isOpen={!!selectedRequest}
        entity={selectedRequest}
        access={selectedRequestAccess}
        actions={selectedRequestActions}
        actionLoading={loading}
        onClose={() => {
          setSelectedRequest(null);
          setRejectNotes('');
        }}
      >
        <label style={{ display: 'grid', gap: 6, marginBottom: 16, fontWeight: 600 }}>Review notes
          <textarea value={rejectNotes} onChange={(event) => setRejectNotes(event.target.value)} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #d8c7bd' }} />
        </label>
      </AdminRequestModal>
    </div>
  );
}

function VendorsPanel({ has, toast, viewer }) {
  const [allVendors, setAllVendors] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [pendingApplicationAction, setPendingApplicationAction] = useState(null);
  const [viewMode, setViewMode] = useState('pending'); // 'all', 'pending', 'verified'
  const [detailVendor, setDetailVendor] = useState(null);
  const [detailApplication, setDetailApplication] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [topVendors, setTopVendors] = useState([]);

  useEffect(() => {
    adminService.getAllVendors()
      .then((vendors) => setAllVendors((vendors || []).map((vendor) =>
        adaptEntityFromNamedSource('adaptVendorDomain', vendor)))).catch(() => {});
    if (has('ACTIVATE_VENDORS') || has('MAKE_VENDORS')) {
      setLoadingApplications(true);
      vendorApplicationService.getPendingApplications()
        .then((applications) => setPendingApplications((applications || []).map((application) =>
          adaptEntityFromNamedSource('adaptVendorApplicationResponse', application))))
        .catch((error) => {
          setPendingApplications([]);
          toast(error.response?.data?.message || 'Failed to load vendor applications', 'error');
        })
        .finally(() => setLoadingApplications(false));
    }
  }, []);

  useEffect(() => {
    if (has('VIEW_FINANCIAL_ANALYTICS')) {
      adminService.getPlatformAnalytics()
        .then(data => setTopVendors(adaptPlatformAnalyticsProjection(data).data.topVendors))
        .catch(() => setTopVendors([]));
    }
  }, []);

  const displayVendors = useMemo(() => {
    let vendors = [];
    if (viewMode === 'all') vendors = allVendors;
    else if (viewMode === 'verified') vendors = getVerifiedVendors(allVendors);
    return vendors;
  }, [viewMode, allVendors]);

  const filteredVendors = useMemo(() => {
    if (!searchTerm) return displayVendors;
    return displayVendors.filter((vendor) => matchesVendorSearch(
      vendor,
      searchTerm,
      buildVendorAccess({ vendor, viewer, context: VENDOR_CONTEXT.ADMIN_MANAGEMENT }),
    ));
  }, [displayVendors, searchTerm, viewer]);

  const filteredApplications = useMemo(() => (
    pendingApplications.filter((application) => matchesVendorApplicationSearch(application, searchTerm))
  ), [pendingApplications, searchTerm]);

  const act = async (fn, cb) => {
    setLoading(true);
    try {
      await fn();
      cb();
      toast('Action completed successfully', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateVendorState = (userId, patch) => {
    setAllVendors(prev => prev.map(vendor => vendor.userId === userId ? patchEntityModel(vendor, patch) : vendor));
    setDetailVendor(prev => prev?.userId === userId ? patchEntityModel(prev, patch) : prev);
  };

  const handleVendorAction = (action, vendor) => {
    if (action === 'activate') {
      act(() => adminService.activateVendor(vendor.userId), () => {
        updateVendorState(vendor.userId, { isVerified: true });
      });
    }
    if (action === 'deactivate') {
      act(() => adminService.deactivateVendor(vendor.userId), () => {
        updateVendorState(vendor.userId, { isVerified: false });
      });
    }
  };

  const getVendorRowActions = (vendor) => {
    const access = buildVendorAccess({ vendor, viewer, context: VENDOR_CONTEXT.ADMIN_MANAGEMENT });
    return buildVendorActions({
      vendor,
      access,
      handlers: {
        activate: () => handleVendorAction('activate', vendor),
        deactivate: () => handleVendorAction('deactivate', vendor),
      },
    });
  };

  const applicationAccess = (application) => buildVendorApplicationAccess({
    application,
    viewer,
    context: VENDOR_APPLICATION_CONTEXT.ADMIN,
  });

  const handleApplicationReview = async (action) => {
    if (!detailApplication) return;
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', {
      decision: action === 'approve' ? 'APPROVE' : 'REJECT',
      reason: rejectionReason,
    }));
    if (!mapped.ok) {
      toast(Object.values(mapped.errors)[0], 'error');
      return;
    }
    try {
      setPendingApplicationAction(action);
      await vendorApplicationService.reviewApplication(
        detailApplication.id,
        mapped.payload.decision === 'APPROVE',
        mapped.payload.reason || null,
      );
      setPendingApplications((applications) => applications.filter(
        (application) => application.id !== detailApplication.id,
      ));
      setDetailApplication(null);
      setRejectionReason('');
      toast(`Application ${action === 'approve' ? 'approved' : 'rejected'}`, 'success');
      adminService.getAllVendors()
        .then((vendors) => setAllVendors((vendors || []).map((vendor) =>
          adaptEntityFromNamedSource('adaptVendorDomain', vendor))))
        .catch(() => {});
    } catch (error) {
      toast(error.response?.data?.message || 'Failed to review application', 'error');
    } finally {
      setPendingApplicationAction(null);
    }
  };

  const applicationActions = detailApplication ? buildVendorApplicationActions({
    application: detailApplication,
    access: applicationAccess(detailApplication),
    handlers: {
      approve: () => handleApplicationReview('approve'),
      reject: () => handleApplicationReview('reject'),
    },
  }) : [];

  return (
    <div>
      {has('VIEW_FINANCIAL_ANALYTICS') && topVendors.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eadfd7', padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#0c6b5b', marginBottom: 12 }}>Top Selling Vendors</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {topVendors.slice(0, 6).map((vendor, index) => (
              <div key={vendor.entity.supplierId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDetailVendor(vendor.entity)}
                  style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4b444d' }}>#{index + 1}</span>
                  <VendorSemanticViews.VendorReference
                    entity={vendor.entity}
                    access={buildVendorAccess({
                      vendor: vendor.entity,
                      viewer,
                      context: VENDOR_CONTEXT.ADMIN_FINANCIAL,
                    })}
                  />
                  <div style={{ fontSize: 12, color: '#4b444d' }}>{vendor.totalOrders} orders</div>
                </button>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                  {formatMoney(vendor.totalRevenue) || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h4 style={{ fontWeight: 700, color: '#0c6b5b', margin: 0 }}>
          {viewMode === 'all' && `All Vendors (${filteredVendors.length})`}
          {viewMode === 'pending' && `Pending Applications (${filteredApplications.length})`}
          {viewMode === 'verified' && `Verified Vendors (${filteredVendors.length})`}
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'all' ? '#0c6b5b' : '#fffaf5',
              color: viewMode === 'all' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            All ({allVendors.length})
          </button>
          <button
            onClick={() => setViewMode('pending')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'pending' ? '#f59e0b' : '#fffaf5',
              color: viewMode === 'pending' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            Pending ({pendingApplications.length})
          </button>
          <button
            onClick={() => setViewMode('verified')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'verified' ? '#10b981' : '#fffaf5',
              color: viewMode === 'verified' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            Verified ({countVerifiedVendors(allVendors)})
          </button>
        </div>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={viewMode === 'pending' ? 'Search applications...' : 'Search vendors...'}
      />

      {viewMode === 'pending' && loadingApplications ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#4b444d' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </div>
      ) : viewMode === 'pending' && filteredApplications.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8f8179', fontStyle: 'italic', marginTop: 16 }}>
          No pending vendor applications
        </div>
      ) : viewMode === 'pending' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, marginTop: 16 }}>
          {filteredApplications.map((application) => (
            <VendorApplicationSummary
              key={application.id}
              application={application}
              access={applicationAccess(application)}
              onSelect={(selected) => {
                setDetailApplication(selected);
                setRejectionReason('');
              }}
            />
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8f8179', fontStyle: 'italic', marginTop: 16 }}>
          {viewMode === 'verified' && 'No verified vendors'}
          {viewMode === 'all' && 'No vendors found'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, marginTop: 16 }}>
          {filteredVendors.map(v => {
            const rowActions = getVendorRowActions(v);
            const activateAction = rowActions.find((action) => action.key === 'activate');
            const deactivateAction = rowActions.find((action) => action.key === 'deactivate');
            const rowAccess = buildVendorAccess({ vendor: v, viewer, context: VENDOR_CONTEXT.ADMIN_MANAGEMENT });
            return (
              <VendorManagementCard
                key={v.userId}
                vendor={v}
                access={rowAccess}
                actions={[activateAction, deactivateAction].filter(Boolean)}
                loading={loading}
                onDetails={setDetailVendor}
              />
            );
          })}
        </div>
      )}

      <VendorModal
        isOpen={!!detailVendor}
        entity={detailVendor}
        onClose={() => setDetailVendor(null)}
        access={detailVendor ? buildVendorAccess({
          vendor: detailVendor,
          viewer,
          context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
        }) : null}
        actions={detailVendor ? buildVendorActions({
          vendor: detailVendor,
          access: buildVendorAccess({
            vendor: detailVendor,
            viewer,
            context: VENDOR_CONTEXT.ADMIN_MANAGEMENT,
          }),
          onAction: (action) => handleVendorAction(action, detailVendor),
        }) : []}
        actionLoading={loading}
        showPublicLink={Boolean(detailVendor?.supplierId)}
      />
      <VendorApplicationModal
        isOpen={!!detailApplication}
        entity={detailApplication}
        access={detailApplication ? applicationAccess(detailApplication) : null}
        actions={applicationActions}
        pendingKey={pendingApplicationAction}
        onClose={() => {
          setDetailApplication(null);
          setRejectionReason('');
        }}
      >
        <label className="mb-4 block text-sm font-semibold text-on-surface">
          Rejection reason
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={3}
            placeholder="Required when rejecting an application"
            className="mt-2 w-full rounded-lg border border-outline-variant p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </label>
      </VendorApplicationModal>
    </div>
  );
}

function ProductsPanel({ has, toast, viewer }) {
  const [allProducts, setAllProducts] = useState([]);
  const [pending, setPending] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [viewMode, setViewMode] = useState('pending'); // 'all', 'pending', 'drafts', 'approved'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [productPendingDelete, setProductPendingDelete] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [vendorLookup, setVendorLookup] = useState({});

  useEffect(() => {
    adminService.getAllProducts()
      .then((r) => setAllProducts((r.content || []).map((product) =>
        adaptEntityFromNamedSource('adaptProductDomain', product)))).catch(() => {});
    if (has('ACTIVATE_PRODUCTS')) {
      adminService.getPendingProducts()
        .then((r) => setPending((r.content || []).map((product) =>
          adaptEntityFromNamedSource('adaptProductDomain', product)))).catch(() => {});
      adminService.getDraftProducts()
        .then((r) => setDrafts((r.content || []).map((product) =>
          adaptEntityFromNamedSource('adaptProductDomain', product)))).catch(() => {});
    }
    adminService.getAllVendors()
      .then((vendors) => {
        const lookup = {};
        (Array.isArray(vendors) ? vendors : []).forEach((vendor) => {
          if (vendor?.supplierId) lookup[vendor.supplierId] = vendor.storeName || vendor.supplierId;
        });
        setVendorLookup(lookup);
      })
      .catch(() => setVendorLookup({}));
  }, []);

  useEffect(() => {
    if (has('VIEW_FINANCIAL_ANALYTICS')) {
      adminService.getPlatformAnalytics()
        .then(async (data) => {
          const candidates = adaptPlatformAnalyticsProjection(data).data.topProducts
            .filter((row) => row.entity?.id);
          const available = await Promise.all(candidates.map(async (row) => {
            try {
              const response = await productService.getProductById(row.entity.id);
              const entity = adaptEntityFromNamedSource('adaptProductDomain', response);
              return isProductApproved(entity) && entity.name ? { ...row, entity } : null;
            } catch {
              return null;
            }
          }));
          setTopProducts(available.filter(Boolean));
        })
        .catch(() => setTopProducts([]));
    }
  }, []);

  const displayProducts = useMemo(() => {
    if (viewMode === 'all') return allProducts;
    if (viewMode === 'pending') return pending;
    if (viewMode === 'drafts') return drafts;
    if (viewMode === 'approved') return allProducts.filter(isProductApproved);
    return [];
  }, [viewMode, allProducts, pending, drafts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return displayProducts;
    const term = searchTerm.toLowerCase();
    return displayProducts.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.id?.toLowerCase().includes(term) ||
      p.price?.toString().includes(term) ||
      p.status?.toLowerCase().includes(term)
    );
  }, [displayProducts, searchTerm]);

  const act = async (fn, cb) => {
    setLoading(true);
    try {
      await fn();
      cb();
      toast('Action completed successfully', 'success');
      return true;
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProductState = (productId, patch) => {
    setPending(prev => prev.map(product => product.id === productId ? patchEntityModel(product, patch) : product));
    setDrafts(prev => prev.map(product => product.id === productId ? patchEntityModel(product, patch) : product));
    setAllProducts(prev => prev.map(product => product.id === productId ? patchEntityModel(product, patch) : product));
    setDetailProduct(prev => prev?.id === productId ? patchEntityModel(prev, patch) : prev);
  };

  const removeProductState = (productId) => {
    setPending(prev => prev.filter(product => product.id !== productId));
    setDrafts(prev => prev.filter(product => product.id !== productId));
    setAllProducts(prev => prev.filter(product => product.id !== productId));
    setTopProducts(prev => prev.filter(product => product.entity?.id !== productId));
    setDetailProduct(prev => prev?.id === productId ? null : prev);
  };

  const handleProductModalAction = (action, product) => {
    if (action === 'approve') {
      act(() => adminService.approveProduct(product.id), () => {
        setPending(prev => prev.filter(x => x.id !== product.id));
        setDrafts(prev => prev.filter(x => x.id !== product.id));
        updateProductState(product.id, {
          status: 'APPROVED',
          reviewRequestStatus: product.status === 'PENDING_APPROVAL' ? 'APPROVED' : product.reviewRequestStatus,
          reviewReviewedAt: new Date().toISOString(),
          reviewRejectionReason: null,
        });
      });
    }
    if (action === 'reject') {
      const reason = window.prompt('Optional rejection reason for the vendor:');
      if (reason === null) return;
      act(() => adminService.rejectProduct(product.id, reason), () => {
        const rejectedStatus = product.reviewRequestedFromStatus === 'DISABLED' ? 'DISABLED' : 'REJECTED';
        setPending(prev => prev.filter(x => x.id !== product.id));
        setDrafts(prev => prev.filter(x => x.id !== product.id));
        updateProductState(product.id, {
          status: rejectedStatus,
          reviewRequestStatus: 'REJECTED',
          reviewReviewedAt: new Date().toISOString(),
          reviewRejectionReason: reason?.trim() || null,
        });
      });
    }
    if (action === 'deactivate') {
      act(() => adminService.deactivateProduct(product.id), () => {
        updateProductState(product.id, { status: 'DISABLED' });
        setTopProducts(prev => prev.filter(row => row.entity?.id !== product.id));
      });
    }
    if (action === 'activate') {
      act(() => adminService.activateProduct(product.id), () => updateProductState(product.id, { status: 'APPROVED' }));
    }
    if (action === 'delete') {
      setProductPendingDelete(product);
    }
  };

  const confirmProductDelete = async () => {
    if (!productPendingDelete) return;
    const deleted = await act(
      () => adminService.deleteProduct(productPendingDelete.id),
      () => removeProductState(productPendingDelete.id),
    );
    if (deleted) setProductPendingDelete(null);
  };

  const getProductRowAction = (product, key) => {
    const access = getProductRowAccess(product);
    return buildProductActions({
      product,
      access,
      handlers: Object.fromEntries(['approve', 'reject', 'activate', 'deactivate', 'delete']
        .map((action) => [action, () => handleProductModalAction(action, product)])),
    }).find((action) => action.key === key);
  };
  const getProductRowAccess = (product) => buildProductAccess({
      product,
      viewer,
      context: PRODUCT_CONTEXT.ADMIN_MODERATION,
    });

  const openProductDetails = async (candidate) => {
    const reference = candidate?.entityType === 'product'
      ? candidate
      : adaptEntityFromNamedSource('adaptProductAnalyticsReference', candidate);
    setDetailProduct(reference);
    if (!reference?.id || reference.meta?.isPartial === false) return;
    try {
      const authorized = authorizeEntityHydration('product', {
        entity: reference,
        id: reference.id,
        viewer,
        context: PRODUCT_CONTEXT.ADMIN_MODERATION,
      });
      const full = await hydrateEntityById('product', reference.id, { authorized });
      if (full) setDetailProduct(full);
    } catch {
      // Preserve the partial reference when hydration is unavailable.
    }
  };

  return (
    <div>
      {has('VIEW_FINANCIAL_ANALYTICS') && topProducts.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eadfd7', padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 12 }}>Top Selling Products</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {topProducts.slice(0, 6).map((product, index) => (
              <div key={product.entity.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <button
                    type="button"
                    onClick={() => openProductDetails(product.entity)}
                    style={{ fontWeight: 600, color: '#341547', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4b444d' }}>#{index + 1}</span>
                    <ProductSemanticViews.ProductReference
                      entity={product.entity}
                      access={buildProductAccess({
                        product: product.entity,
                        viewer,
                        context: PRODUCT_CONTEXT.ADMIN_FINANCIAL,
                      })}
                    />
                  </button>
                  <div style={{ fontSize: 12, color: '#4b444d' }}>{product.vendorStoreName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#4b444d' }}>{product.totalSales} sold</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                    {formatMoney(product.totalRevenue) || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h4 style={{ fontWeight: 700, color: '#10b981', margin: 0 }}>
          {viewMode === 'all' && `All Products (${filteredProducts.length})`}
          {viewMode === 'pending' && `Pending Review (${filteredProducts.length})`}
          {viewMode === 'drafts' && `Draft Products (${filteredProducts.length})`}
          {viewMode === 'approved' && `Approved Products (${filteredProducts.length})`}
        </h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'all' ? '#10b981' : '#fffaf5',
              color: viewMode === 'all' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            All ({allProducts.length})
          </button>
          <button
            onClick={() => setViewMode('pending')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'pending' ? '#f59e0b' : '#fffaf5',
              color: viewMode === 'pending' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setViewMode('drafts')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'drafts' ? '#8f8179' : '#fffaf5',
              color: viewMode === 'drafts' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setViewMode('approved')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: viewMode === 'approved' ? '#10b981' : '#fffaf5',
              color: viewMode === 'approved' ? 'white' : '#4b444d',
              fontWeight: 600, cursor: 'pointer', fontSize: 12,
            }}
          >
            Approved ({allProducts.filter(isProductApproved).length})
          </button>
        </div>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search products by name, ID, price, or status..." />

      {filteredProducts.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8f8179', fontStyle: 'italic', marginTop: 16 }}>
          {viewMode === 'all' && 'No products found'}
          {viewMode === 'pending' && 'No products pending review'}
          {viewMode === 'drafts' && 'No draft products'}
          {viewMode === 'approved' && 'No approved products'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {filteredProducts.map((product) => {
            const access = getProductRowAccess(product);
            const actions = ['approve', 'reject', 'deactivate', 'activate', 'delete']
              .map((key) => getProductRowAction(product, key))
              .filter(Boolean);
            return (
              <ProductManagementCard
                key={product.id}
                product={product}
                access={access}
                actions={actions}
                loading={loading}
                onDetails={openProductDetails}
                vendorName={vendorLookup[product.supplierId]}
                showReviewRequest={viewMode === 'pending' || Boolean(product.reviewRequestedAt)}
              />
            );
          })}
        </div>
      )}

      <ProductModal
        isOpen={!!detailProduct}
        entity={detailProduct}
        access={detailProduct ? buildProductAccess({
          product: detailProduct,
          viewer,
          context: PRODUCT_CONTEXT.ADMIN_MODERATION,
        }) : null}
        actions={detailProduct ? buildProductActions({
          product: detailProduct,
          access: buildProductAccess({
            product: detailProduct,
            viewer,
            context: PRODUCT_CONTEXT.ADMIN_MODERATION,
          }),
          handlers: Object.fromEntries(['approve', 'reject', 'activate', 'deactivate', 'delete']
            .map((action) => [action, () => handleProductModalAction(action, detailProduct)])),
        }) : []}
        onClose={() => setDetailProduct(null)}
        actionLoading={loading}
        showPublicLink={Boolean(detailProduct?.id)}
      />
      <Modal
        isOpen={Boolean(productPendingDelete)}
        onClose={() => { if (!loading) setProductPendingDelete(null); }}
        title="Delete Product"
      >
        <div style={{ display: 'grid', gap: 20 }}>
          <p style={{ margin: 0, color: '#4b444d', lineHeight: 1.6 }}>
            Delete <strong>{productPendingDelete?.name || 'this product'}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setProductPendingDelete(null)}
              disabled={loading}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d8c7bd', background: 'white', color: '#4b444d', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmProductDelete}
              disabled={loading}
              style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CategoriesPanel({ has, toast, viewer }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detailCategory, setDetailCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategories();
      setCategories((Array.isArray(data) ? data : []).map((category) =>
        adaptEntityFromNamedSource('adaptCategoryListRecord', category)));
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast('Failed to load categories', 'error');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mapped = commandDraftToPayload('categoryCreate', createCommandDraft('categoryCreate', { categoryName: formData.name }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      if (editingCategory) await adminService.updateCategory(editingCategory.id, mapped.payload);
      else await adminService.createCategory(mapped.payload);
      toast(editingCategory ? 'Category updated' : 'Category created', 'success');
      setShowModal(false);
      setDetailCategory(null);
      setEditingCategory(null);
      setFormData({ name: '' });
      await fetchCategories();
    } catch (err) {
      toast(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    setLoading(true);
    try {
      await adminService.deleteCategory(id);
      
      toast('Category deleted', 'success');
      setDetailCategory(null);
      await fetchCategories();
    } catch (err) {
      toast(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (category) => {
    setDetailCategory(category);
  };

  const openEditModal = (category) => {
    setDetailCategory(null);
    setEditingCategory(category);
    setFormData({ name: category.name || '' });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleCategoryModalAction = (action, category) => {
    if (action === 'edit') return openEditModal(category);
    if (action === 'delete') return handleDelete(category.id);
  };

  const categoryAccess = (category) => buildCategoryAccess({
    category,
    viewer,
    context: CATEGORY_CONTEXT.ADMIN,
  });
  const categoryActions = (category) => buildCategoryActions({
    category,
    access: categoryAccess(category),
    handlers: {
      edit: () => openEditModal(category),
      delete: () => handleDelete(category.id),
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 24, border: '1px solid #eadfd7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#341547', margin: 0, marginBottom: 4 }}>
              Categories ({categories.length})
            </h3>
            <p style={{ fontSize: 14, color: '#4b444d', margin: 0 }}>
              Manage product categories
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: '#8a4b16', color: 'white', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Create Category
          </button>
        </div>

        {loading && categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b444d' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b444d' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>category</span>
            <p style={{ marginTop: 12, fontSize: 14 }}>No categories found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{
                padding: 20, background: '#fbf9f6', borderRadius: 12, border: '1px solid #eadfd7',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <CategorySemanticViews.CategorySummary entity={cat} access={categoryAccess(cat)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => openDetailsModal(cat)}
                    disabled={loading}
                    style={{
                      flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #8a4b16',
                      background: 'white', color: '#8a4b16', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                    }}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => categoryActions(cat).find((action) => action.key === 'edit')?.onSelect()}
                    disabled={loading || !categoryActions(cat).some((action) => action.key === 'edit')}
                    style={{
                      flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #735186',
                      background: 'white', color: '#4b2c5e', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => categoryActions(cat).find((action) => action.key === 'delete')?.onSelect()}
                    disabled={loading || !categoryActions(cat).some((action) => action.key === 'delete')}
                    style={{
                      flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #ef4444',
                      background: 'white', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          if (loading) return;
          setShowModal(false);
          setEditingCategory(null);
          setFormData({ name: '' });
        }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="category-name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#341547', marginBottom: 8 }}>
              Category Name *
            </label>
            <input
              id="category-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%', padding: 12, borderRadius: 8, border: '1px solid #eadfd7',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingCategory(null);
                setFormData({ name: '' });
              }}
              disabled={loading}
              style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid #eadfd7',
                background: 'white', color: '#4b444d', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: '#8a4b16', color: 'white', cursor: 'pointer', fontWeight: 600,
              }}
            >
              {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
      <CategoryModal
        isOpen={!!detailCategory}
        entity={detailCategory}
        access={detailCategory ? categoryAccess(detailCategory) : null}
        actions={detailCategory ? buildCategoryActions({
          category: detailCategory,
          access: categoryAccess(detailCategory),
          handlers: {
            edit: () => handleCategoryModalAction('edit', detailCategory),
            delete: () => handleCategoryModalAction('delete', detailCategory),
          },
        }) : []}
        actionLoading={loading}
        onClose={() => {
          setDetailCategory(null);
        }}
      />
    </div>
  );
}

function OrdersPanel({ has, toast, viewer }) {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceDetail, setAssistanceDetail] = useState(null);
  const [assistanceMessage, setAssistanceMessage] = useState('');
  const [assistanceResolution, setAssistanceResolution] = useState('');
  const [instapayRejectionReason, setInstapayRejectionReason] = useState('');
  const [vendorInvalidationDrafts, setVendorInvalidationDrafts] = useState({});
  const [vendorInvalidationLoading, setVendorInvalidationLoading] = useState(false);

  const loadOrders = async () => {
    if (!has('VIEW_ORDERS')) return [];
    const response = await adminService.getAllOrders();
    const models = (response.content || []).map((order) =>
      adaptEntityFromNamedSource('adaptOrderAdminListRecord', order));
    setOrders(models);
    return models;
  };

  useEffect(() => {
    loadOrders().catch(() => {});
  }, []);

  useEffect(() => {
    if (has('REVIEW_ORDER_ASSISTANCE')) {
      loadAssistanceRequests();
    }
  }, []);

	const loadAssistanceRequests = async () => {
	    setAssistanceLoading(true);
	    try {
	      const data = await commissionService.getAssistanceRequests();
	      setAssistanceRequests((Array.isArray(data) ? data : [])
          .map((request) => adaptEntityFromNamedSource('adaptOrderAssistanceDto', request))
          .filter((request) => buildOrderAssistanceAccess({
            request,
            viewer,
            context: ORDER_ASSISTANCE_CONTEXT.ADMIN,
          }).canRead));
	    } catch (err) {
	      setAssistanceRequests([]);
	    } finally {
	      setAssistanceLoading(false);
	    }
	  };

	  const handleAssistanceMessage = async () => {
	    const mapped = commandDraftToPayload('assistanceMessage', createCommandDraft('assistanceMessage', { mode: 'REPLY', message: assistanceMessage }));
	    if (!assistanceDetail || !mapped.ok) {
	      toast('Please enter a message', 'error');
	      return;
	    }

	    try {
	      const updated = await commissionService.addAssistanceMessage(assistanceDetail.id, mapped.payload.message);
	      const model = adaptEntityFromNamedSource('adaptOrderAssistanceDto', updated);
	      setAssistanceDetail(model);
	      setAssistanceMessage('');
	      setAssistanceRequests((current) => current.map((request) =>
          request.id === model.id ? model : request));
	    } catch (err) {
	      toast(err.response?.data?.message || 'Failed to send message', 'error');
	    }
	  };

	  const handleAssistanceResolve = async () => {
	    const mapped = commandDraftToPayload('assistanceMessage', createCommandDraft('assistanceMessage', { mode: 'RESOLUTION', message: assistanceResolution, resolved: true }));
	    if (!assistanceDetail || !mapped.ok || !mapped.payload.message) {
	      toast('Provide a resolution before resolving', 'error');
	      return;
	    }

	    try {
	      await commissionService.resolveAssistanceRequest(assistanceDetail.id, mapped.payload.message);
	      setAssistanceResolution('');
	      await loadAssistanceRequests();
	      setAssistanceDetail(null);
	      toast('Assistance request resolved', 'success');
	    } catch (err) {
	      toast(err.response?.data?.message || 'Failed to resolve request', 'error');
	    }
	  };

	  const filteredOrders = useMemo(() => {
	    if (!searchTerm) return orders;
	    const term = searchTerm.toLowerCase();
	    return orders.filter((order) => matchesOrderSearch(
      order,
      term,
      buildOrderAccess({
        order,
        viewer,
        context: ORDER_CONTEXT.ADMIN,
      }),
    ));
  }, [orders, searchTerm, viewer]);

  const act = async (fn, cb) => {
    setLoading(true);
    try {
      await fn();
      cb();
      toast('Action completed successfully', 'success');
    } catch (err) {
      toast(err.response?.data?.message || err.response?.data?.error || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAdminOrderAccess = (order) => buildOrderAccess({
    order,
    viewer,
    context: ORDER_CONTEXT.ADMIN,
  });

  const getAdminOrderStatusOptions = (status) => {
    if (!detailOrder) return [];
    const order = detailOrder.status === status ? detailOrder : patchEntityModel(detailOrder, { status });
    return getOrderStatusOptions(order, getAdminOrderAccess(order));
  };

  const handleAdminOrderStatusChange = async (orderId, status) => {
    const normalizedStatus = String(status).toUpperCase();
    setLoading(true);
    try {
      await commissionService.updateOrderStatus(orderId, normalizedStatus);

      const applyStatus = (order) => order.id === orderId
        ? patchEntityModel(order, { status: normalizedStatus })
        : order;
      setOrders((current) => current.map(applyStatus));
      setDetailOrder((current) => current?.id === orderId ? applyStatus(current) : current);

      toast('Order status updated successfully', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update order status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorInvalidationDraftChange = (supplierId, patch) => {
    setVendorInvalidationDrafts((current) => ({
      ...current,
      [supplierId]: {
        ...(current[supplierId] || {}),
        ...patch,
      },
    }));
  };

  const handleInvalidateVendorPortion = async (supplierId) => {
    if (!detailOrder) return;
    const draft = vendorInvalidationDrafts[supplierId] || {};
    const reason = (draft.reason || '').trim();
    const details = (draft.details || '').trim();
    if (!reason || !details) {
      toast('Reason and details are required to invalidate a vendor portion.', 'error');
      return;
    }

    setVendorInvalidationLoading(true);
    try {
      await commissionService.invalidateVendorPortion(detailOrder.id, supplierId, { reason, details });
      const now = new Date().toISOString();
      const patchInvalidatedPortion = (order) => patchEntityModel(order, {
        vendorStatuses: {
          ...(order.vendorStatuses || {}),
          [supplierId]: 'INVALID',
        },
        vendorInvalidatedAt: {
          ...(order.vendorInvalidatedAt || {}),
          [supplierId]: now,
        },
        vendorInvalidationReasons: {
          ...(order.vendorInvalidationReasons || {}),
          [supplierId]: reason,
        },
        vendorInvalidationDetails: {
          ...(order.vendorInvalidationDetails || {}),
          [supplierId]: details,
        },
      });
      let refreshedOrder = null;
      try {
        const refreshedOrders = await loadOrders();
        refreshedOrder = refreshedOrders.find((order) => order.id === detailOrder.id) || null;
      } catch (ignored) {}

      if (refreshedOrder) {
        setDetailOrder(refreshedOrder);
      } else {
        setOrders((current) => current.map((order) =>
          order.id === detailOrder.id ? patchInvalidatedPortion(order) : order));
        setDetailOrder((current) => current ? patchInvalidatedPortion(current) : current);
      }
      setVendorInvalidationDrafts((current) => {
        const next = { ...current };
        delete next[supplierId];
        return next;
      });
      toast('Vendor portion invalidated.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || err.response?.data?.error || 'Failed to invalidate vendor portion', 'error');
    } finally {
      setVendorInvalidationLoading(false);
    }
  };

  const reviewInstapay = async (approved) => {
    if (!detailOrder) return;
    const reason = approved ? null : instapayRejectionReason.trim();
    if (!approved && !reason) {
      toast('Add a reason before rejecting this payment.', 'error');
      return;
    }
    await act(
      () => approved
        ? adminService.confirmOrderPayment(detailOrder.id)
        : adminService.rejectOrderPayment(detailOrder.id, reason),
      () => {
        const now = new Date().toISOString();
        const patchReviewedOrder = (order) => patchEntityModel(order, {
          status: approved ? 'IN_PROGRESS' : 'PENDING_CONFIRMATION',
          paymentRejectionReason: approved ? null : reason,
          ...(approved ? {} : { instapayTransactionIds: [] }),
          instapayPaymentMessages: [
            ...(order.instapayPaymentMessages || []),
            {
              senderRole: 'PLATFORM',
              message: approved ? 'Approved' : `Rejected: ${reason}`,
              sentAt: now,
            },
          ],
          ...(approved ? {
            vendorStatuses: Object.fromEntries(
              Object.keys(order?.vendorStatuses || {}).map((supplierId) => [supplierId, 'IN_PROGRESS']),
            ),
          } : {}),
        });
        setOrders((current) => current.map((order) => order.id === detailOrder.id
          ? patchReviewedOrder(order) : order));
        setDetailOrder((current) => current ? patchReviewedOrder(current) : current);
        if (!approved) setInstapayRejectionReason('');
      },
    );
  };

  const getAdminAssistanceAccess = (request) => buildOrderAssistanceAccess({
    request,
    viewer,
    context: ORDER_ASSISTANCE_CONTEXT.ADMIN,
  });
  const selectedAssistanceAccess = assistanceDetail
    ? getAdminAssistanceAccess(assistanceDetail)
    : null;
  const selectedAssistanceActions = selectedAssistanceAccess
    ? buildOrderAssistanceActions({
      request: assistanceDetail,
      access: selectedAssistanceAccess,
      handlers: {
        reply: handleAssistanceMessage,
        resolve: handleAssistanceResolve,
      },
    })
    : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ fontWeight: 700, color: '#341547', margin: 0 }}>
          Recent Orders ({filteredOrders.length})
        </h4>
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search orders by ID, customer, or status..." />
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8f8179', fontStyle: 'italic' }}>
          No orders found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredOrders.map((order) => (
            <OrderManagementCard
              key={order.id}
              order={order}
              access={getAdminOrderAccess(order)}
              onDetails={setDetailOrder}
            />
          ))}
        </div>
      )}

      {has('REVIEW_ORDER_ASSISTANCE') && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>Order Assistance</h4>
            {assistanceLoading && <span style={{ fontSize: 12, color: '#8f8179' }}>Loading...</span>}
          </div>
          {assistanceRequests.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8f8179', fontStyle: 'italic', border: '1px dashed #eadfd7', borderRadius: 12 }}>
              No assistance requests yet
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {assistanceRequests.map(request => (
                <OrderAssistanceSemanticViews.OrderAssistanceAdminCard
                  key={request.id}
                  entity={request}
                  access={getAdminAssistanceAccess(request)}
                  onSelect={setAssistanceDetail}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!assistanceDetail} onClose={() => setAssistanceDetail(null)} title="Order Assistance">
        {assistanceDetail && (
          <div style={{ display: 'grid', gap: 16 }}>
            <OrderAssistanceSemanticViews.OrderAssistanceThread
              entity={assistanceDetail}
              access={selectedAssistanceAccess}
            />

            {selectedAssistanceActions.some((action) => action.key === 'reply') && <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#341547', marginBottom: 6 }}>
                Add Message
              </label>
              <textarea
                value={assistanceMessage}
                onChange={(e) => setAssistanceMessage(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }}
                placeholder="Respond to the vendor..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => selectedAssistanceActions
                    .find((action) => action.key === 'reply')?.onSelect()}
                  style={{ padding: '8px 16px', background: '#0c6b5b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                  Send Message
                </button>
              </div>
            </div>}

            {selectedAssistanceActions.some((action) => action.key === 'resolve') && <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#341547', marginBottom: 6 }}>
                Resolution
              </label>
              <textarea
                value={assistanceResolution}
                onChange={(e) => setAssistanceResolution(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }}
                placeholder="Describe the resolution and mark as resolved"
              />
            </div>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {selectedAssistanceActions.some((action) => action.key === 'resolve') && <button
                onClick={() => selectedAssistanceActions
                  .find((action) => action.key === 'resolve')?.onSelect()}
                style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Resolve
              </button>}
            </div>
          </div>
        )}
      </Modal>

      <OrderModal
        isOpen={!!detailOrder}
        entity={detailOrder}
        access={detailOrder ? buildOrderAccess({
          order: detailOrder,
          viewer,
          context: ORDER_CONTEXT.ADMIN,
        }) : null}
        customerEntity={detailOrder ? adaptEntityFromNamedSource('adaptUserOrderCustomerSnapshot', {
          id: detailOrder.customerId,
          fullName: detailOrder.customerName,
          email: detailOrder.customerEmail,
        }) : null}
        customerAccess={detailOrder ? buildUserAccess({
          user: adaptEntityFromNamedSource('adaptUserOrderCustomerSnapshot', {
            id: detailOrder.customerId,
            fullName: detailOrder.customerName,
            email: detailOrder.customerEmail,
          }),
          viewer,
          context: USER_CONTEXT.ADMIN_READ,
        }) : null}
        onClose={() => {
          setDetailOrder(null);
          setInstapayRejectionReason('');
          setVendorInvalidationDrafts({});
        }}
        getStatusOptions={getAdminOrderStatusOptions}
        onStatusChange={handleAdminOrderStatusChange}
        statusLoading={loading}
        vendorInvalidationDrafts={vendorInvalidationDrafts}
        onVendorInvalidationDraftChange={handleVendorInvalidationDraftChange}
        onInvalidateVendorPortion={handleInvalidateVendorPortion}
        vendorInvalidationLoading={vendorInvalidationLoading}
        paymentWorkflow={isOrderPendingConfirmation(detailOrder)
          && detailOrder?.paymentMethod === 'INSTAPAY'
          && has('CONFIRM_ORDER_PAYMENTS') ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-bold text-amber-900">Instapay review</h3>
              <p className="mt-1 text-sm text-amber-800">Verify the transaction IDs outside the system, then confirm or reject this order.</p>
              <div className="mt-4">
                <InstapayPaymentConversation order={detailOrder} />
              </div>
              <input
                value={instapayRejectionReason}
                onChange={(event) => setInstapayRejectionReason(event.target.value)}
                className="mt-3 w-full rounded border border-amber-200 px-3 py-2 text-sm"
                placeholder="Reason"
              />
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={loading || !detailOrder.instapayTransactionIds?.length} onClick={() => reviewInstapay(true)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-40">Send to vendors</button>
                <button type="button" disabled={loading} onClick={() => reviewInstapay(false)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-40">Reject order</button>
              </div>
            </section>
          ) : null}
      />
    </div>
  );
}

function AdminsPanel({ has, toast, viewer, onCurrentAdminProfileChange }) {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detailAdminUser, setDetailAdminUser] = useState(null);
  const [selectedPerm, setSelectedPerm] = useState('');
  const [loading, setLoading] = useState(false);

  const allPerms = Object.keys(USER_PERMISSION_META);

  const adaptAdminRecords = (records) => (records || []).map((record) =>
    adaptEntityFromNamedSource('adaptUserAdminManagementRecord', {
      id: record.userId || record.id,
      isAdmin: true,
      permissions: record.permissions || [],
    }));

  const refreshAdmins = async () => {
    const records = await adminService.getAllAdmins();
    const models = adaptAdminRecords(records);
    setAdmins(models);
    return models;
  };

  useEffect(() => {
    let active = true;
    Promise.allSettled([adminService.getAllAdmins(), adminService.getAllUsers()])
      .then(([adminResult, userResult]) => {
        if (!active) return;
        if (adminResult.status === 'fulfilled') setAdmins(adaptAdminRecords(adminResult.value));
        else toast(adminResult.reason?.response?.data?.message || adminResult.reason?.response?.data?.error || 'Failed to load admins', 'error');
        if (userResult.status === 'fulfilled') {
          setUsers((userResult.value || []).map((record) =>
            adaptEntityFromNamedSource('adaptUserAdminManagementRecord', record)));
        }
      });
    return () => { active = false; };
  }, []);

  const selectedAdmin = admins.find((admin) => admin.id === selectedUserId);
  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedUserEntity = selectedUser && selectedAdmin
    ? mergeEntityModels(selectedUser, selectedAdmin)
    : selectedAdmin || selectedUser;
  const selectedUserAccess = selectedUserEntity ? buildUserAccess({
    user: selectedUserEntity,
    viewer,
    context: USER_CONTEXT.ADMIN_MANAGEMENT,
  }) : null;
  const detailAdminAccess = detailAdminUser ? buildUserAccess({
    user: detailAdminUser,
    viewer,
    context: USER_CONTEXT.ADMIN_MANAGEMENT,
  }) : null;
  const selectedPermissions = selectedUserEntity && selectedUserAccess
    ? (getReadableUserField(selectedUserEntity, 'facets.admin.permissions', selectedUserAccess.fields.adminPermissions).value || [])
    : [];
  const changePermission = async (operation) => {
    if (!selectedUserId || !selectedPerm || loading) return;
    const targetUserId = selectedUserId;
    const permission = selectedPerm;
    setLoading(true);
    try {
      if (operation === 'grant') await adminService.grantPermission(targetUserId, permission);
      else await adminService.revokePermission(targetUserId, permission);
      await refreshAdmins();
      if (targetUserId === viewer.userId) {
        const currentProfile = await adminService.getMyAdminProfile();
        onCurrentAdminProfileChange?.(currentProfile);
      }
      toast(`${getUserPermissionLabel(permission)} ${operation === 'grant' ? 'granted' : 'revoked'}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || err.response?.data?.error || `Failed to ${operation} permission`, 'error');
    } finally {
      setLoading(false);
    }
  };
  const permissionActions = selectedUserEntity && selectedUserAccess && selectedPerm
    ? buildUserActions({
      user: selectedUserEntity,
      access: selectedUserAccess,
      supportedActions: ['grantPermission', 'revokePermission'],
      handlers: {
        grantPermission: () => changePermission('grant'),
        revokePermission: () => changePermission('revoke'),
      },
    })
    : [];
  const grantPermissionAction = permissionActions.find((action) => action.key === 'grantPermission');
  const revokePermissionAction = permissionActions.find((action) => action.key === 'revokePermission');
  const permissionSelectionComplete = Boolean(selectedUserId && selectedPerm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h4 style={{ fontWeight: 700, color: '#735186', margin: 0 }}>Manage Admin Permissions</h4>

      <div style={{ padding: 16, background: '#fbf9f6', borderRadius: 12, border: '1px solid #eadfd7' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#4b444d', marginBottom: 8 }}>
          Select Admin
        </label>
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #eadfd7', fontSize: 13 }}
        >
          <option value="">-- Select Admin --</option>
          {admins.map(a => {
            const user = users.find(u => u.id === a.id);
            const entity = user ? mergeEntityModels(user, a) : a;
            const access = buildUserAccess({
              user: entity,
              viewer,
              context: USER_CONTEXT.ADMIN_MANAGEMENT,
            });
            return (
              <option key={a.id} value={a.id}>
                {getUserReferenceLabel(entity, access)}
              </option>
            );
          })}
        </select>

        {selectedAdmin && (
          <div style={{ marginTop: 12, padding: 12, background: 'white', borderRadius: 8, border: '1px solid #eadfd7' }}>
            <div style={{ fontWeight: 600, color: '#341547', marginBottom: 8 }}>
              Current Permissions for {getUserReferenceLabel(selectedUserEntity, selectedUserAccess)}:
            </div>
            {selectedUser && (
              <div style={{ marginBottom: 10 }}>
                <UserSummaryButton
                  entity={selectedUserEntity}
                  access={selectedUserAccess}
                  onClick={() => setDetailAdminUser(selectedUserEntity)}
                />
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedPermissions.length > 0 ? (
                selectedPermissions.map(p => (
                  <span key={p} style={{
                    background: '#f2edf8', color: '#341547', padding: '4px 10px',
                    borderRadius: 6, fontSize: 11, fontWeight: 600,
                  }}>
                    {p}
                  </span>
                ))
              ) : (
                <span style={{ fontStyle: 'italic', color: '#8f8179', fontSize: 12 }}>
                  No custom permissions assigned
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 16, background: '#fbf9f6', borderRadius: 12, border: '1px solid #eadfd7' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#4b444d', marginBottom: 8 }}>
          Select Permission
        </label>
        <select
          value={selectedPerm}
          onChange={e => setSelectedPerm(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #eadfd7', fontSize: 13 }}
        >
          <option value="">-- Select Permission --</option>
          {allPerms.map(p => (
            <option key={p} value={p}>
              {getUserPermissionLabel(p)}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={grantPermissionAction?.onSelect}
            disabled={!permissionSelectionComplete}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: 8, border: 'none',
              background: permissionSelectionComplete ? '#10b981' : '#d8c7bd',
              color: 'white', fontWeight: 600,
              cursor: permissionSelectionComplete ? 'pointer' : 'not-allowed', fontSize: 13,
            }}
          >
            Grant Permission
          </button>
          <button
            type="button"
            onClick={revokePermissionAction?.onSelect}
            disabled={!permissionSelectionComplete}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: 8, border: 'none',
              background: permissionSelectionComplete ? '#ef4444' : '#d8c7bd',
              color: 'white', fontWeight: 600,
              cursor: permissionSelectionComplete ? 'pointer' : 'not-allowed', fontSize: 13,
            }}
          >
            Revoke Permission
          </button>
        </div>
      </div>
      <UserModal
        isOpen={!!detailAdminUser}
        entity={detailAdminUser}
        access={detailAdminAccess}
        onClose={() => setDetailAdminUser(null)}
        showPublicLink={Boolean(detailAdminUser?.id)}
      />
    </div>
  );
}

function FinancialPanel({ has, toast, viewer }) {
  const getDefaultSubTab = () => {
    if (has('VIEW_FINANCIAL_DATA')) return 'unpaid';
    if (has('REVIEW_COMMISSION_PAYMENTS')) return 'requests';
    if (has('MANAGE_COMMISSIONS')) return 'rules';
    if (has('VIEW_FINANCIAL_ANALYTICS')) return 'analytics';
    return 'unpaid';
  };
  const canOpenSubTab = (subTab) => ({
    unpaid: has('VIEW_FINANCIAL_DATA'),
    instapay: has('VIEW_FINANCIAL_DATA'),
    requests: has('REVIEW_COMMISSION_PAYMENTS'),
    rules: has('MANAGE_COMMISSIONS'),
    analytics: has('VIEW_FINANCIAL_ANALYTICS'),
  }[subTab] === true);
  const [activeSubTab, setActiveSubTab] = useState(() => getDefaultSubTab());
  const [loading, setLoading] = useState(false);
  const [unpaidCommissions, setUnpaidCommissions] = useState([]);
  const [instapayPayouts, setInstapayPayouts] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [commissionRules, setCommissionRules] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedKind, setSelectedKind] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [ruleType, setRuleType] = useState('GLOBAL');
  const [supplierId, setSupplierId] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ruleError, setRuleError] = useState('');
  const [ruleSaving, setRuleSaving] = useState(false);
  const [paymentThreadMessages, setPaymentThreadMessages] = useState({});
  const [paymentThreadSaving, setPaymentThreadSaving] = useState(false);
  const [instapayPaymentRequests, setInstapayPaymentRequests] = useState([]);
  const [selectedPayoutWorkflow, setSelectedPayoutWorkflow] = useState(null);
  const [payoutMessage, setPayoutMessage] = useState('');
  const hasActiveCommissionRule = commissionRules.length > 0;

  useEffect(() => {
    if (!canOpenSubTab(activeSubTab)) {
      setActiveSubTab(getDefaultSubTab());
    }
  }, [activeSubTab]);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeSubTab === 'unpaid' && has('VIEW_FINANCIAL_DATA')) {
        setUnpaidCommissions(await loadFinancialSection('unpaid'));
      } else if (activeSubTab === 'instapay' && has('VIEW_FINANCIAL_DATA')) {
        setInstapayPayouts(await loadFinancialSection('instapay'));
        if (has('MANAGE_VENDOR_PAYOUTS')) {
          setInstapayPaymentRequests(await loadFinancialSection('instapayRequests'));
        } else {
          setInstapayPaymentRequests([]);
        }
      } else if (activeSubTab === 'requests' && has('REVIEW_COMMISSION_PAYMENTS')) {
        setPaymentRequests(await loadFinancialSection('requests'));
      } else if (activeSubTab === 'rules' && has('MANAGE_COMMISSIONS')) {
        setCommissionRules(await loadFinancialSection('rules'));
      } else if (activeSubTab === 'analytics' && has('VIEW_FINANCIAL_ANALYTICS')) {
        setAnalytics(await loadFinancialSection('analytics'));
      }
    } catch (error) {
      toast(`Failed to load financial data: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionAction = async (action, entity) => {
    if (action === 'urge') await executeFinancialAction('urge', entity.id);
    if (action === 'approve') await executeFinancialAction('approve', entity.id);
    if (action === 'reject') {
      const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', { decision: 'REJECT', reason: rejectionReason }));
      if (!mapped.ok) { toast(Object.values(mapped.errors)[0], 'error'); return; }
      await executeFinancialAction('reject', entity.id, mapped.payload);
    }
    if (action === 'deactivate') await executeFinancialAction('deactivate', entity.id);
    toast('Commission action completed', 'success');
    setSelectedItem(null);
    setSelectedKind(null);
    setRejectionReason('');
    loadData();
  };

  const handleSubmitVendorPayout = async () => {
    const commission = selectedPayoutWorkflow?.commission;
    const request = selectedPayoutRequest;
    const message = payoutMessage.trim();
    if (!commission) return;
    if (!message) {
      toast('Enter transaction IDs, links, or payout details before sending.', 'error');
      return;
    }
    try {
      const updated = request?.status === 'PENDING'
        ? await commissionService.addAdminPaymentRequestMessage(request.id, message)
        : await executeFinancialAction('submitVendorPayout', commission.id, { message, proofImageUrl: null });
      const adapted = adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', updated);
      setInstapayPaymentRequests((current) => [
        adapted,
        ...current.filter((item) => item.id !== adapted.id),
      ]);
      setSelectedPayoutWorkflow({ commission, request: adapted });
      setPayoutMessage('');
      toast(request?.status === 'PENDING' ? 'Message sent to vendor' : 'Payout details sent to vendor', 'success');
      await loadData();
    } catch (error) {
      toast(error.response?.data?.message || error.response?.data?.error || 'Failed to submit vendor payout', 'error');
    }
  };

  const handleAddPaymentThreadMessage = async (request) => {
    const message = (paymentThreadMessages[request.id] || '').trim();
    if (!message) {
      toast('Write a message before sending', 'error');
      return;
    }
    try {
      setPaymentThreadSaving(true);
      const updated = await commissionService.addAdminPaymentRequestMessage(request.id, message);
      const adapted = adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', updated);
      setPaymentRequests((current) => current.map((item) => item.id === adapted.id ? adapted : item));
      setSelectedItem((current) => current?.id === adapted.id ? adapted : current);
      setPaymentThreadMessages((current) => ({ ...current, [request.id]: '' }));
      toast('Message sent', 'success');
    } catch (error) {
      toast(error.response?.data?.message || error.response?.data?.error || 'Could not send message', 'error');
    } finally {
      setPaymentThreadSaving(false);
    }
  };

  const resetRuleForm = () => {
    setRuleType('GLOBAL');
    setSupplierId('');
    setRate('');
    setStartDate('');
    setEndDate('');
    setRuleError('');
  };

  const handleCreateRule = async (event) => {
    event.preventDefault();
    const percentage = Number(rate);
    let error = '';
    if (hasActiveCommissionRule) {
      error = 'Only one custom commission rule can be active. Deactivate the current rule first.';
    } else if (!rate || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      error = 'Commission rate must be between 0 and 100.';
    } else if (!startDate) {
      error = 'Start date is required.';
    } else if (ruleType === 'SUPPLIER_SPECIFIC' && !supplierId.trim()) {
      error = 'Vendor ID is required for a vendor-specific rule.';
    } else if (endDate && endDate <= startDate) {
      error = 'End date must be after the start date.';
    }
    if (error) {
      setRuleError(error);
      toast(error, 'error');
      return;
    }

    const mapped = mapCommissionRulePayload(createCommissionRuleDraft({
      type: ruleType,
      supplierId: ruleType === 'SUPPLIER_SPECIFIC' ? supplierId.trim() : null,
      rate: multiplyDecimal(rate, '0.01'),
      startDate,
      endDate: endDate || null,
    }));
    if (!mapped.ok) {
      const message = Object.values(mapped.errors)[0];
      setRuleError(message);
      toast(message, 'error');
      return;
    }

    setRuleSaving(true);
    setRuleError('');
    try {
      const createdRule = await executeFinancialAction('createRule', null, mapped.payload);
      setCommissionRules((current) => [
        adaptEntityFromNamedSource('adaptCommissionRuleDto', createdRule),
        ...current,
      ]);
      toast('Rule created successfully', 'success');
      setShowRuleModal(false);
      resetRuleForm();
      await loadData();
    } catch (createError) {
      const message = createError.response?.data?.message || createError.message || 'Failed to create commission rule';
      setRuleError(message);
      toast(message, 'error');
    } finally {
      setRuleSaving(false);
    }
  };
  const selectedFinancialAccess = selectedItem && selectedKind === 'commission'
    ? buildCommissionAccess({ commission: selectedItem, viewer, context: COMMISSION_CONTEXT.ADMIN })
    : selectedItem && selectedKind === 'paymentRequest'
      ? buildCommissionPaymentRequestAccess({ request: selectedItem, viewer, context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN })
      : selectedItem && selectedKind === 'rule'
        ? buildCommissionRuleAccess({ rule: selectedItem, viewer })
        : null;
  const selectedFinancialActions = !selectedItem || !selectedFinancialAccess ? []
    : selectedKind === 'commission'
      ? buildCommissionActions({
        commission: selectedItem,
        access: selectedFinancialAccess,
        handlers: selectedItem.direction === 'VENDOR_TO_PLATFORM'
          ? { urge: () => handleCommissionAction('urge', selectedItem) }
          : {},
      })
      : selectedKind === 'paymentRequest'
        ? buildCommissionPaymentRequestActions({ request: selectedItem, access: selectedFinancialAccess, handlers: {
          approve: () => handleCommissionAction('approve', selectedItem),
          reject: () => handleCommissionAction('reject', selectedItem),
        } })
        : buildCommissionRuleActions({ rule: selectedItem, access: selectedFinancialAccess, handlers: { deactivate: () => handleCommissionAction('deactivate', selectedItem) } });
  const instapayPayoutGroups = useMemo(
    () => groupInstapayPayoutsByVendor(instapayPayouts),
    [instapayPayouts],
  );
  const getInstapayRequestForCommission = (commissionId) =>
    instapayPaymentRequests
      .filter((request) => request.commissionId === commissionId)
      .sort((left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime())[0];
  const openVendorPayoutModal = (commission) => {
    setSelectedPayoutWorkflow({
      commission,
      request: getInstapayRequestForCommission(commission.id),
    });
    setPayoutMessage('');
  };
  const showFinancialDetails = ({ commission, request }) => {
    setSelectedItem(request || commission);
    setSelectedKind(request ? 'paymentRequest' : 'commission');
  };
  const renderInstapayPayoutWorkflow = ({ commission, request }, options = {}) => (
    <PaymentWorkflowCard
      commission={commission}
      request={request}
      commissionAccess={commission ? buildCommissionAccess({
        commission,
        viewer,
        context: COMMISSION_CONTEXT.ADMIN,
      }) : null}
      requestAccess={request ? buildCommissionPaymentRequestAccess({
        request,
        viewer,
        context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
      }) : null}
      handlers={{
        submitPayment: openVendorPayoutModal,
        message: () => openVendorPayoutModal(commission),
      }}
      onDetails={options.showDetails === false ? undefined : showFinancialDetails}
      showActions={options.showActions !== false}
      compact={options.compact}
    />
  );
  const selectedPayoutRequest = selectedPayoutWorkflow?.commission
    ? getInstapayRequestForCommission(selectedPayoutWorkflow.commission.id) || selectedPayoutWorkflow.request
    : null;
  const selectedPayoutModalWorkflow = selectedPayoutWorkflow
    ? { commission: selectedPayoutWorkflow.commission, request: selectedPayoutRequest }
    : null;

  return (
    <div>
      <div style={{ marginBottom: 20, borderBottom: '2px solid #eadfd7' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {has('VIEW_FINANCIAL_DATA') && (
            <button onClick={() => setActiveSubTab('unpaid')} style={{ padding: '12px 20px', background: activeSubTab === 'unpaid' ? '#341547' : 'transparent', color: activeSubTab === 'unpaid' ? 'white' : '#4b444d', border: 'none', borderBottom: activeSubTab === 'unpaid' ? '3px solid #341547' : 'none', fontWeight: 600, cursor: 'pointer' }}>
              Unpaid Commissions
            </button>
          )}
          {has('REVIEW_COMMISSION_PAYMENTS') && (
            <button onClick={() => setActiveSubTab('requests')} style={{ padding: '12px 20px', background: activeSubTab === 'requests' ? '#341547' : 'transparent', color: activeSubTab === 'requests' ? 'white' : '#4b444d', border: 'none', borderBottom: activeSubTab === 'requests' ? '3px solid #341547' : 'none', fontWeight: 600, cursor: 'pointer' }}>
              Payment Requests
            </button>
          )}
          {has('MANAGE_COMMISSIONS') && (
            <button onClick={() => setActiveSubTab('rules')} style={{ padding: '12px 20px', background: activeSubTab === 'rules' ? '#341547' : 'transparent', color: activeSubTab === 'rules' ? 'white' : '#4b444d', border: 'none', borderBottom: activeSubTab === 'rules' ? '3px solid #341547' : 'none', fontWeight: 600, cursor: 'pointer' }}>
              Commission Rules
            </button>
          )}
          {has('VIEW_FINANCIAL_ANALYTICS') && (
            <button onClick={() => setActiveSubTab('analytics')} style={{ padding: '12px 20px', background: activeSubTab === 'analytics' ? '#341547' : 'transparent', color: activeSubTab === 'analytics' ? 'white' : '#4b444d', border: 'none', borderBottom: activeSubTab === 'analytics' ? '3px solid #341547' : 'none', fontWeight: 600, cursor: 'pointer' }}>
              Analytics
            </button>
          )}
          {has('VIEW_FINANCIAL_DATA') && (
            <button type="button" onClick={() => setActiveSubTab('instapay')} style={{ padding: '12px 20px', background: activeSubTab === 'instapay' ? '#341547' : 'transparent', color: activeSubTab === 'instapay' ? 'white' : '#4b444d', border: 'none', borderBottom: activeSubTab === 'instapay' ? '3px solid #341547' : 'none', fontWeight: 600, cursor: 'pointer' }}>
              Instapay
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#4b444d' }}>Loading...</div>
      ) : (
        <div>
          {activeSubTab === 'unpaid' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Unpaid Commissions</h3>
              {unpaidCommissions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#fbf9f6', borderRadius: 12, border: '2px dashed #d8c7bd' }}>
                  <p style={{ color: '#4b444d', marginBottom: 8, fontSize: 16, fontWeight: 600 }}>No unpaid commissions yet</p>
                  <p style={{ color: '#8f8179', fontSize: 14 }}>
                    Commissions appear after a vendor completes its portion and the customer problem window has passed.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {unpaidCommissions.map((commission) => (
                    <div key={commission.id}>
                    <CommissionSummary
                      commission={commission}
                      access={buildCommissionAccess({
                        commission,
                        viewer,
                        context: COMMISSION_CONTEXT.ADMIN,
                      })}
                      handlers={{
                        urge: commission.direction === 'VENDOR_TO_PLATFORM' ? async () => {
                          await executeFinancialAction('urge', commission.id);
                          toast('Payment reminder sent', 'success');
                        } : undefined,
                      }}
                      onDetails={() => {
                        setSelectedItem(commission);
                        setSelectedKind('commission');
                      }}
                    />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'requests' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Pending Payment Requests</h3>
              {paymentRequests.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#fbf9f6', borderRadius: 12, border: '2px dashed #d8c7bd' }}>
                  <p style={{ color: '#4b444d', marginBottom: 8, fontSize: 16, fontWeight: 600 }}>No pending payment requests</p>
                  <p style={{ color: '#8f8179', fontSize: 14 }}>Vendors submit payment proofs for their commissions here.</p>
                  <p style={{ color: '#8f8179', fontSize: 14, marginTop: 4 }}>Requests will appear when vendors submit payment proofs from their dashboard.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {paymentRequests.map((request) => (
                    <CommissionPaymentRequestSummary
                      key={request.id}
                      request={request}
                      access={buildCommissionPaymentRequestAccess({
                        request,
                        viewer,
                        context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
                      })}
                      handlers={{
                        approve: async () => {
                          await executeFinancialAction('approve', request.id);
                          toast('Payment approved', 'success');
                          loadData();
                        },
                      }}
                      threadMessage={paymentThreadMessages[request.id] || ''}
                      onThreadMessageChange={(entity, value) => setPaymentThreadMessages((current) => ({ ...current, [entity.id]: value }))}
                      onThreadMessageSubmit={handleAddPaymentThreadMessage}
                      threadSubmitting={paymentThreadSaving}
                      onDetails={() => {
                        setSelectedItem(request);
                        setSelectedKind('paymentRequest');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'rules' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Commission Rules</h3>
                <button
                  onClick={() => setShowRuleModal(true)}
                  disabled={hasActiveCommissionRule}
                  style={{ padding: '10px 20px', background: '#341547', color: 'white', border: 'none', borderRadius: 8, cursor: hasActiveCommissionRule ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: hasActiveCommissionRule ? 0.55 : 1 }}
                >
                  Create Rule
                </button>
              </div>
              <p style={{ color: '#4b444d', fontSize: 14, marginBottom: 16 }}>
                Only one custom commission rule can be active. If none is active, the default 10% commission applies.
              </p>
              {commissionRules.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#fbf9f6', borderRadius: 12, border: '2px dashed #d8c7bd' }}>
                  <p style={{ color: '#4b444d', marginBottom: 8, fontSize: 16, fontWeight: 600 }}>No commission rules yet</p>
                  <p style={{ color: '#8f8179', fontSize: 14 }}>Create rules to set custom commission rates for vendors.</p>
                  <p style={{ color: '#8f8179', fontSize: 14, marginTop: 4 }}>Default rate is 10% if no rules are active.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {commissionRules.map((rule) => (
                    <CommissionRuleSummary
                      key={rule.id}
                      rule={rule}
                      access={buildCommissionRuleAccess({
                        rule,
                        viewer,
                      })}
                      handlers={{
                        deactivate: async (entity) => {
                          await executeFinancialAction('deactivate', entity.id);
                          toast('Rule deactivated', 'success');
                          loadData();
                        },
                      }}
                      onDetails={(entity) => {
                        setSelectedItem(entity);
                        setSelectedKind('rule');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'analytics' && analytics && (
            <div>
              <FinancialAnalyticsShowcase analytics={analytics} title="Financial Analytics" />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 28, marginBottom: 16 }}>Financial Analytics Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 20, background: '#dbeafe', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#1e40af', marginBottom: 4 }}>Items Subtotal</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>{formatCurrency(analytics.totalItemSubtotal)}</p>
                </div>
                <div style={{ padding: 20, background: '#fef3c7', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>Delivery Total</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#92400e' }}>{formatCurrency(analytics.totalDeliveryCost)}</p>
                </div>
                <div style={{ padding: 20, background: '#f2edf8', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#341547', marginBottom: 4 }}>Customer Payments</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#341547' }}>{formatCurrency(analytics.totalCustomerPayments)}</p>
                </div>
                <div style={{ padding: 20, background: '#e9d5ff', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#581c87', marginBottom: 4 }}>Platform Revenue</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#581c87' }}>{formatCurrency(analytics.totalPlatformRevenue)}</p>
                </div>
                <div style={{ padding: 20, background: '#d1fae5', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#065f46', marginBottom: 4 }}>Vendor Earnings</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>{formatCurrency(analytics.totalVendorEarnings)}</p>
                </div>
                <div style={{ padding: 20, background: '#fde68a', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>Commissions Owed</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#92400e' }}>{formatCurrency(analytics.totalCommissionsOwed)}</p>
                  <p style={{ fontSize: 11, color: '#92400e' }}>Paid: {formatCurrency(analytics.totalCommissionsPaid)}</p>
                </div>
                <div style={{ padding: 20, background: '#ecfeff', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#155e75', marginBottom: 4 }}>COD Orders</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#155e75' }}>{formatCurrency(analytics.codOrderValue)}</p>
                  <p style={{ fontSize: 11, color: '#155e75' }}>{analytics.counts?.codOrderCount || 0} orders</p>
                </div>
                <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>Instapay Orders</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>{formatCurrency(analytics.instapayOrderValue)}</p>
                  <p style={{ fontSize: 11, color: '#166534' }}>{analytics.counts?.instapayOrderCount || 0} orders</p>
                </div>
                <div style={{ padding: 20, background: '#fee2e2', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>Invalid / Failed</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#991b1b' }}>{formatCurrency(analytics.invalidOrFailedPayments)}</p>
                  <p style={{ fontSize: 11, color: '#991b1b' }}>{analytics.counts?.invalidOrFailedOrderCount || 0} orders</p>
                </div>
                <div style={{ padding: 20, background: '#f5f3ff', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#5b21b6', marginBottom: 4 }}>Vendor Payouts</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#5b21b6' }}>{formatCurrency(analytics.pendingVendorPayouts)}</p>
                  <p style={{ fontSize: 11, color: '#5b21b6' }}>Submitted: {formatCurrency(analytics.submittedVendorPayouts)} � Paid: {formatCurrency(analytics.completedVendorPayouts)}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 24 }}>
                <section>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Vendor settlement summary</h4>
                  {analytics.byVendor.length === 0 ? (
                    <p style={{ color: '#4b444d' }}>No vendor financial data yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ minWidth: 760, width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                        <thead>
                          <tr style={{ background: '#fbf9f6' }}>
                            <th style={{ padding: 10, textAlign: 'left' }}>Vendor</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Vendor Revenue</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>COD Owed</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>COD Paid</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Instapay Payout Due</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Instapay Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.byVendor.map((vendor) => (
                            <tr key={vendor.entity.supplierId} style={{ borderTop: '1px solid #eadfd7' }}>
                              <td style={{ padding: 10 }}><VendorSemanticViews.VendorReference entity={vendor.entity} access={buildVendorAccess({ vendor: vendor.entity, viewer, context: VENDOR_CONTEXT.ADMIN_FINANCIAL })} /></td>
                              <td style={{ padding: 10 }}>{formatCurrency(vendor.totalEarnings)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(vendor.commissionsOwed)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(vendor.commissionsPaid)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(vendor.pendingPayouts)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(vendor.completedPayouts)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                <section>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Monthly breakdown</h4>
                  {analytics.byMonth.length === 0 ? (
                    <p style={{ color: '#4b444d' }}>No monthly financial data yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ minWidth: 860, width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                        <thead>
                          <tr style={{ background: '#fbf9f6' }}>
                            <th style={{ padding: 10, textAlign: 'left' }}>Month</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Customer Payments</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>COD</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Instapay</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>COD Collected</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Payouts Paid</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Invalid / Failed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.byMonth.map((month) => (
                            <tr key={month.month} style={{ borderTop: '1px solid #eadfd7' }}>
                              <td style={{ padding: 10 }}>{month.month}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(month.customerPayments)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(month.codOrderValue)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(month.instapayOrderValue)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(month.commissionsCollected)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(month.vendorPayoutsCompleted)}</td>
                              <td style={{ padding: 10 }}>{formatCurrency(month.invalidOrFailedPayments)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeSubTab === 'instapay' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Instapay Vendor Payouts</h3>
              {instapayPayoutGroups.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#fbf9f6', borderRadius: 12, border: '2px dashed #d8c7bd' }}>
                  <p style={{ color: '#4b444d', marginBottom: 8, fontSize: 16, fontWeight: 600 }}>No eligible Instapay payouts yet</p>
                  <p style={{ color: '#8f8179', fontSize: 14 }}>
                    Payouts appear after payment confirmation, vendor completion, and the 14-day customer problem window.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {instapayPayoutGroups.map((group) => (
                    <section key={group.supplierId || group.supplierName} style={{ border: '1px solid #d8c7bd', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
                      <div style={{ padding: 16, background: '#f5f3ff', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 700, color: '#4c1d95' }}>{group.supplierName}</h4>
                          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 12 }}>Vendor ID: {group.supplierId || 'Unavailable'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          <div><p style={{ margin: 0, fontSize: 11, color: '#4b444d' }}>Gross</p><strong>{formatCommissionMoney(group.grossTotal) || '�'}</strong></div>
                          <div><p style={{ margin: 0, fontSize: 11, color: '#4b444d' }}>Commission</p><strong>{formatCommissionMoney(group.commissionTotal) || '�'}</strong></div>
                          <div><p style={{ margin: 0, fontSize: 11, color: '#4b444d' }}>Net payout</p><strong style={{ color: '#047857' }}>{formatCommissionMoney(group.netTotal) || '�'}</strong></div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 10, padding: 12 }}>
                        {group.payouts.map((payout) => {
                          const request = getInstapayRequestForCommission(payout.id);
                          return (
                            <div key={payout.id}>
                              {renderInstapayPayoutWorkflow({ commission: payout, request })}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <CommissionModal
        isOpen={!!selectedItem}
        entity={selectedItem}
        kind={selectedKind}
        access={selectedFinancialAccess}
        actions={selectedFinancialActions}
        actionLoading={loading}
        onClose={() => {
          setSelectedItem(null);
          setSelectedKind(null);
          setRejectionReason('');
        }}
      >
        {selectedKind === 'paymentRequest' && selectedFinancialAccess?.canReview && (
          <label style={{ display: 'grid', gap: 6, marginBottom: 16, fontWeight: 600 }}>Rejection reason
            <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #d8c7bd' }} />
          </label>
        )}
      </CommissionModal>

      <Modal
        isOpen={!!selectedPayoutWorkflow}
        title="Send Vendor Payout Details"
        onClose={() => {
          setSelectedPayoutWorkflow(null);
          setPayoutMessage('');
        }}
      >
        {selectedPayoutModalWorkflow && (
          <div style={{ display: 'grid', gap: 16 }}>
            {renderInstapayPayoutWorkflow(selectedPayoutModalWorkflow, {
              showActions: false,
              showDetails: false,
              compact: true,
            })}
            {selectedPayoutRequest && <PaymentRequestConversation request={selectedPayoutRequest} />}
            <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
              Message, transaction IDs, or payout links
              <textarea
                value={payoutMessage}
                onChange={(event) => setPayoutMessage(event.target.value)}
                rows={5}
                placeholder="Send transaction IDs, payment links, and any details the vendor needs to verify the payout."
                style={{ padding: 10, borderRadius: 8, border: '1px solid #d8c7bd' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleSubmitVendorPayout}
                style={{ flex: 1, padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                {selectedPayoutRequest?.status === 'PENDING' ? 'Send message' : 'Send payout details'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPayoutWorkflow(null);
                  setPayoutMessage('');
                }}
                style={{ flex: 1, padding: '10px 16px', background: '#eadfd7', color: '#4b444d', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {showRuleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateRule} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 500, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create Commission Rule</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label htmlFor="commission-rule-type" style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Rule Type</label>
                <select id="commission-rule-type" value={ruleType} onChange={(e) => { setRuleType(e.target.value); setRuleError(''); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }}>
                  <option value="GLOBAL">Global (All Vendors)</option>
                  <option value="SUPPLIER_SPECIFIC">Vendor Specific</option>
                </select>
              </div>
              {ruleType === 'SUPPLIER_SPECIFIC' && (
                <div>
                  <label htmlFor="commission-rule-vendor" style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Vendor ID</label>
                  <input id="commission-rule-vendor" type="text" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setRuleError(''); }} placeholder="Enter vendor UUID" required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }} />
                </div>
              )}
              <div>
                <label htmlFor="commission-rule-rate" style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Commission Rate (%)</label>
                <input id="commission-rule-rate" type="number" min="0" max="100" step="0.01" value={rate} onChange={(e) => { setRate(e.target.value); setRuleError(''); }} placeholder="e.g., 10 for 10%" required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }} />
              </div>
              <div>
                <label htmlFor="commission-rule-start" style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Start Date</label>
                <input id="commission-rule-start" type="datetime-local" value={startDate} onChange={(e) => { setStartDate(e.target.value); setRuleError(''); }} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }} />
              </div>
              <div>
                <label htmlFor="commission-rule-end" style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>End Date</label>
                <input id="commission-rule-end" type="datetime-local" value={endDate} min={startDate || undefined} onChange={(e) => { setEndDate(e.target.value); setRuleError(''); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #eadfd7' }} />
              </div>
              {ruleError && <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>{ruleError}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" disabled={ruleSaving} style={{ flex: 1, padding: '10px 16px', background: '#341547', color: 'white', border: 'none', borderRadius: 8, cursor: ruleSaving ? 'wait' : 'pointer', fontWeight: 600, opacity: ruleSaving ? 0.65 : 1 }}>
                {ruleSaving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" disabled={ruleSaving} onClick={() => { setShowRuleModal(false); resetRuleForm(); }} style={{ flex: 1, padding: '10px 16px', background: '#eadfd7', color: '#4b444d', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

function NotificationsPanel({ has, toast, viewer }) {
  const [target, setTarget] = useState('ALL_USERS');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    adminService.getAllUsers().then((records) => setUsers((records || []).map((record) =>
      adaptEntityFromNamedSource('adaptUserAdminManagementRecord', record)))).catch(() => {});
  }, []);

  const sendNotification = async () => {
    if (!title || !message) {
      toast('Please fill in title and message', 'error');
      return;
    }

    if ((target === 'SPECIFIC_USER' || target === 'SPECIFIC_ADMIN') && !selectedUserId) {
      toast('Please select a user', 'error');
      return;
    }

    setLoading(true);
    try {
      const mapped = commandDraftToPayload('notificationComposition', createCommandDraft('notificationComposition', {
        target,
        targetId: (target === 'SPECIFIC_USER' || target === 'SPECIFIC_ADMIN') ? selectedUserId : null,
        title,
        message,
      }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      await adminService.sendNotification(mapped.payload);
      toast('Notification sent successfully!', 'success');
      setTitle('');
      setMessage('');
      setSelectedUserId('');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ padding: 24, background: 'white', borderRadius: 16, border: '1px solid #eadfd7' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#341547' }}>
          Send System Notification
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#4b444d', marginBottom: 8 }}>
              Target Audience
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #eadfd7', fontSize: 14 }}
            >
              <option value="ALL_USERS">All Users</option>
              <option value="ALL_ADMINS">All Admins</option>
              <option value="SPECIFIC_USER">Specific User</option>
            </select>
          </div>

          {(target === 'SPECIFIC_USER' || target === 'SPECIFIC_ADMIN') && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#4b444d', marginBottom: 8 }}>
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #eadfd7', fontSize: 14 }}
              >
                <option value="">-- Select User --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {getUserReferenceLabel(u, buildUserAccess({
                      user: u,
                      viewer,
                      context: USER_CONTEXT.ADMIN_MANAGEMENT,
                    }))}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#4b444d', marginBottom: 8 }}>
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #eadfd7', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#4b444d', marginBottom: 8 }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message..."
              rows={5}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #eadfd7',
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>

          <button
            onClick={sendNotification}
            disabled={loading || !title || !message}
            style={{
              padding: '12px 24px', borderRadius: 8, border: 'none',
              background: (loading || !title || !message) ? '#d8c7bd' : '#0c6b5b',
              color: 'white', fontWeight: 600, cursor: (loading || !title || !message) ? 'not-allowed' : 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const hydrateAdminFacet = useAuthStore((state) => state.hydrateAdminFacet);
  const [profile, setProfile] = useState(null);
  const [showMyPermissions, setShowMyPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overviewAnalytics, setOverviewAnalytics] = useState(null);
  const [overviewAnalyticsLoading, setOverviewAnalyticsLoading] = useState(false);

  const applyCurrentAdminProfile = (adminProfile) => {
    setProfile((current) => current ? patchEntityModel(current, {
      'facets.admin.permissions': adminProfile.permissions || [],
      'facets.admin.isSuperAdmin': Boolean(adminProfile.isSuperAdmin),
    }) : current);
    hydrateAdminFacet(adminProfile);
  };

  useEffect(() => {
    adminService.getMyAdminProfile()
      .then((adminProfile) => {
        const adminEntity = adaptEntityFromNamedSource('adaptUserAdminManagementRecord', {
          ...adminProfile,
          id: adminProfile.userId || user?.id,
          isAdmin: true,
        });
        setProfile(user ? mergeEntityModels(user, adminEntity) : adminEntity);
        hydrateAdminFacet(adminProfile);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const canViewFinancialAnalytics = Boolean(profile && viewerHasCapability(viewer, 'VIEW_FINANCIAL_ANALYTICS'));

  useEffect(() => {
    let active = true;
    if (!canViewFinancialAnalytics) {
      setOverviewAnalytics(null);
      setOverviewAnalyticsLoading(false);
      return () => { active = false; };
    }

    setOverviewAnalyticsLoading(true);
    loadFinancialSection('analytics')
      .then((data) => {
        if (active) setOverviewAnalytics(data);
      })
      .catch(() => {
        if (active) setOverviewAnalytics(null);
      })
      .finally(() => {
        if (active) setOverviewAnalyticsLoading(false);
      });
    return () => { active = false; };
  }, [canViewFinancialAnalytics]);

  const has = (permission) => Boolean(profile && viewerHasCapability(viewer, permission));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ color: '#4b444d', fontWeight: 600 }}>Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 20 }}>Access Denied</div>
          <div style={{ color: '#4b444d', marginTop: 8 }}>You don't have admin permissions</div>
        </div>
      </div>
    );
  }

  const profileAccess = buildUserAccess({
    user: profile,
    viewer,
    context: USER_CONTEXT.ADMIN_MANAGEMENT,
  });
  const grantedPerms = getReadableUserField(
    profile,
    'facets.admin.permissions',
    profileAccess.fields.adminPermissions,
  ).value || [];
  const profileIsSuperAdmin = getReadableUserField(
    profile,
    'facets.admin.isSuperAdmin',
    profileAccess.fields.superAdminBadge,
  ).value === true;
  const groupedPerms = USER_PERMISSION_GROUPS.map(group => ({
    name: group,
    perms: Object.keys(USER_PERMISSION_META).filter(p => USER_PERMISSION_META[p].group === group),
  }));

  const quickActionStyle = (color) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: 24, borderRadius: 16, border: `2px solid ${color}33`,
    background: `${color}08`, cursor: 'pointer', transition: 'all .2s',
    textAlign: 'center',
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'users', label: 'Users', icon: 'group', show: has('VIEW_USERS') },
    { id: 'adminRequests', label: 'Admin Requests', icon: 'admin_panel_settings', show: has('REVIEW_ADMIN_REQUESTS') },
    { id: 'vendors', label: 'Vendors', icon: 'storefront', show: has('ACTIVATE_VENDORS') },
    { id: 'products', label: 'Products', icon: 'inventory_2', show: has('ACTIVATE_PRODUCTS') },
    { id: 'categories', label: 'Categories', icon: 'category', show: has('MANAGE_CATEGORIES') },
    { id: 'orders', label: 'Orders', icon: 'receipt_long', show: has('VIEW_ORDERS') },
    { id: 'financial', label: 'Financial', icon: 'payments', show: has('VIEW_FINANCIAL_DATA') || has('MANAGE_COMMISSIONS') || has('REVIEW_COMMISSION_PAYMENTS') || has('VIEW_FINANCIAL_ANALYTICS') },
    { id: 'admins', label: 'Admins', icon: 'shield', show: has('MANAGE_ADMIN_PERMISSIONS') },
    { id: 'notifications', label: 'Notifications', icon: 'campaign', show: has('SEND_NOTIFICATIONS') },
    { id: 'reports', label: 'Reports', icon: 'flag', show: has('MANAGE_REPORTS') },
  ].filter(t => t.show !== false);

  return (
    <div style={{ minHeight: '100vh', background: '#fbf9f6' }}>
      <Navbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #341547 0%, #8a4b16 100%)',
          borderRadius: 20, padding: '32px 40px', marginBottom: 32, color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, marginBottom: 8 }}>
                Admin Dashboard
              </h1>
              <p style={{ fontSize: 16, opacity: 0.9, margin: 0 }}>
                Welcome back, {getUserReferenceLabel(profile, profileAccess)}
              </p>
              {profileIsSuperAdmin && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                  background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>workspace_premium</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>SUPER ADMIN</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setActiveTab('notifications')}
                style={{
                  padding: '12px 20px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600,
                  cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span className="material-symbols-outlined">campaign</span>
                Send Notifications
              </button>
              <button
                onClick={() => setShowMyPermissions(true)}
                style={{
                  padding: '12px 20px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600,
                  cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span className="material-symbols-outlined">badge</span>
                My Permissions
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => tab.id === 'reports' ? navigate('/admin/reports') : setActiveTab(tab.id)}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#341547' : '#4b444d',
                fontWeight: 600, cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all .2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {activeTab === 'overview' && (
            <div>
              {canViewFinancialAnalytics && (
                <div style={{ marginBottom: 32 }}>
                  {overviewAnalyticsLoading ? (
                    <div style={{ padding: 32, borderRadius: 16, border: '1px solid #eadfd7', background: '#fbf9f6', color: '#4b444d', fontWeight: 700, textAlign: 'center' }}>
                      Loading financial analytics...
                    </div>
                  ) : overviewAnalytics ? (
                    <FinancialAnalyticsShowcase
                      analytics={overviewAnalytics}
                      title="Giftastic Analytics"
                      onOpenFinancial={() => setActiveTab('financial')}
                    />
                  ) : (
                    <div style={{ padding: 24, borderRadius: 16, border: '1px solid #eadfd7', background: '#fbf9f6', color: '#4b444d', fontWeight: 600 }}>
                      Financial analytics are not available yet.
                    </div>
                  )}
                </div>
              )}

              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#341547' }}>
                Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {has('VIEW_USERS') && (
                  <button onClick={() => setActiveTab('users')} style={quickActionStyle('#341547')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>group</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Manage Users</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>View, ban, promote</span>
                  </button>
                )}
                {has('REVIEW_ADMIN_REQUESTS') && (
                  <button onClick={() => setActiveTab('adminRequests')} style={quickActionStyle('#735186')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>admin_panel_settings</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Admin Requests</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Review applications</span>
                  </button>
                )}
                {has('ACTIVATE_VENDORS') && (
                  <button onClick={() => setActiveTab('vendors')} style={quickActionStyle('#0c6b5b')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>storefront</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Manage Vendors</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Approve applications</span>
                  </button>
                )}
                {has('ACTIVATE_PRODUCTS') && (
                  <button onClick={() => setActiveTab('products')} style={quickActionStyle('#10b981')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inventory_2</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Manage Products</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Approve, activate, or delete</span>
                  </button>
                )}
                {has('MANAGE_CATEGORIES') && (
                  <button onClick={() => setActiveTab('categories')} style={quickActionStyle('#8a4b16')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>category</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Manage Categories</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Create or delete</span>
                  </button>
                )}
                {has('VIEW_ORDERS') && (
                  <button onClick={() => setActiveTab('orders')} style={quickActionStyle('#735186')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>receipt_long</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>View Orders</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Monitor all orders</span>
                  </button>
                )}
                {has('MANAGE_ADMIN_PERMISSIONS') && (
                  <button onClick={() => setActiveTab('admins')} style={quickActionStyle('#735186')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>shield</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Manage Admins</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Grant permissions</span>
                  </button>
                )}
                {has('SEND_NOTIFICATIONS') && (
                  <button onClick={() => setActiveTab('notifications')} style={quickActionStyle('#0c6b5b')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>campaign</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Send Notifications</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Broadcast messages</span>
                  </button>
                )}
                {has('MANAGE_REPORTS') && (
                  <button onClick={() => navigate('/admin/reports')} style={quickActionStyle('#ef4444')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>flag</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Manage Reports</span>
                    <span style={{ fontSize: 12, color: '#4b444d' }}>Review user reports</span>
                  </button>
                )}
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#341547' }}>
                All My Permissions
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {grantedPerms.map(p => (
                  <span key={p} style={{
                    padding: '6px 12px', background: '#f2edf8', color: '#341547',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                  }}>
                    {getUserPermissionLabel(p)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && <UsersPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'adminRequests' && <AdminRequestsPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'vendors' && <VendorsPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'products' && <ProductsPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'categories' && <CategoriesPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'orders' && <OrdersPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'financial' && <FinancialPanel has={has} toast={showToast} viewer={viewer} />}
          {activeTab === 'admins' && (
            <AdminsPanel
              has={has}
              toast={showToast}
              viewer={viewer}
              onCurrentAdminProfileChange={applyCurrentAdminProfile}
            />
          )}
          {activeTab === 'notifications' && <NotificationsPanel has={has} toast={showToast} viewer={viewer} />}
        </div>
      </div>

      <Footer />
      <UserModal
        isOpen={showMyPermissions}
        entity={profile}
        access={profileAccess}
        onClose={() => setShowMyPermissions(false)}
      />
    </div>
  );
}
