import OrderSection from './OrderSection';
import { formatCountdown, formatOrderDate, getOrderStatusLabel, getVendorFinancialReleaseWindow } from '../orderSelectors';
import { formatCommissionRate } from '../../commission/commissionSelectors';

export default function OrderVendorProgressSection({
  order,
  access,
  invalidationDrafts = {},
  onInvalidationDraftChange,
  onInvalidateVendorPortion,
  invalidationLoading = false,
}) {
  const entries = Object.entries(order?.vendorStatuses || {});
  if (!entries.length) return null;

  return (
    <OrderSection title="Vendor progress" icon="local_shipping">
      <div className="grid gap-3">
        {entries.map(([supplierId, status]) => {
          const releaseWindow = getVendorFinancialReleaseWindow(order, supplierId);
          const draft = invalidationDrafts[supplierId] || {};
          const canInvalidate = access?.canInvalidateVendorPortions
            && status === 'DONE'
            && releaseWindow.releaseAt
            && releaseWindow.open
            && typeof onInvalidateVendorPortion === 'function';
          const products = (order.items || []).filter((item) => item.supplierId === supplierId)
            .map((item) => item.productName).filter(Boolean);
          return <div key={supplierId} className="rounded-lg border border-stone-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Vendor {supplierId.slice(0, 8)}</span>
              <span className="text-sm text-primary">{getOrderStatusLabel(status)}</span>
            </div>
            {!!products.length && <p className="mt-1 text-xs text-on-surface-variant">{products.join(', ')}</p>}
            {status === 'DONE' && releaseWindow.releaseAt && (
              <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                {releaseWindow.open
                  ? `Payment requests unlock in ${formatCountdown(releaseWindow.secondsLeft)}`
                  : 'Payment requests are unlocked'}
              </p>
            )}
            {status === 'INVALID' && (
              <div className="mt-2 rounded-md border border-red-100 bg-red-50 p-2 text-xs text-red-800">
                <p className="font-semibold">This vendor portion is invalid and excluded from money movement.</p>
                {order.vendorInvalidationReasons?.[supplierId] && <p className="mt-1">Reason: {order.vendorInvalidationReasons[supplierId]}</p>}
                {order.vendorInvalidationDetails?.[supplierId] && <p className="mt-1">Details: {order.vendorInvalidationDetails[supplierId]}</p>}
                {order.vendorInvalidatedAt?.[supplierId] && <p className="mt-1">Invalidated: {formatOrderDate(order.vendorInvalidatedAt[supplierId])}</p>}
              </div>
            )}
            {order.commissionRates?.[supplierId] !== undefined && <p className="mt-1 text-xs text-on-surface-variant">
              Order commission snapshot: {formatCommissionRate(order.commissionRates[supplierId])}
            </p>}
            {canInvalidate && (
              <div className="mt-3 grid gap-2 border-t border-stone-100 pt-3">
                <input
                  value={draft.reason || ''}
                  onChange={(event) => onInvalidationDraftChange?.(supplierId, { reason: event.target.value })}
                  maxLength={120}
                  className="rounded border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Invalidation reason"
                />
                <textarea
                  value={draft.details || ''}
                  onChange={(event) => onInvalidationDraftChange?.(supplierId, { details: event.target.value })}
                  rows={3}
                  className="rounded border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Customer issue details and support resolution"
                />
                <button
                  type="button"
                  disabled={invalidationLoading || !draft.reason?.trim() || !draft.details?.trim()}
                  onClick={() => onInvalidateVendorPortion(supplierId)}
                  className="justify-self-start rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Invalidate portion
                </button>
              </div>
            )}
          </div>;
        })}
      </div>
    </OrderSection>
  );
}
