import { Link } from 'react-router-dom';
import { hasLoadedEntityField } from '../shared/entityModel';
import { buildCommissionPaymentRequestActions } from './commissionPaymentRequestActions';
import {
  formatCommissionMoney,
} from '../commission';
import {
  getCommissionPaymentRequestLabel,
  getCommissionPaymentRequestStatusClass,
} from './commissionPaymentRequestSelectors';

const getOrderHref = (request, access) => {
  if (!request?.orderId) return null;
  const encodedOrderId = encodeURIComponent(request.orderId);
  return access?.isOwner ? `/vendor/orders?orderId=${encodedOrderId}` : `/orders/${encodedOrderId}`;
};

export default function CommissionPaymentRequestSummary({
  request,
  access,
  handlers = {},
  actionItems,
  reviewRejectionReason = '',
  onReviewRejectionReasonChange,
  onDetails,
}) {
  if (!request || !access?.canRead) return null;
  const actions = actionItems || buildCommissionPaymentRequestActions({ request, access, handlers });
  const canReject = actions.some((action) => action.key === 'reject');
  const showRejectReason = canReject && typeof onReviewRejectionReasonChange === 'function';
  const orderHref = getOrderHref(request, access);

  return (
    <article className="rounded-lg border p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="min-w-0 flex-1">
          {hasLoadedEntityField(request, 'supplierName') && request.supplierName && (
            <p className="font-semibold">{request.supplierName}</p>
          )}
          {hasLoadedEntityField(request, 'commissionId') && (
            <p className="font-semibold">Commission {getCommissionPaymentRequestLabel(request)}</p>
          )}
          {request.senderLabel && request.receiverLabel && (
            <p className="mt-1 text-sm text-gray-700">
              {request.senderLabel} sends {formatCommissionMoney(request.payableAmount) || 'the payment'} to {request.receiverLabel}
              {request.orderId ? ` for order ${String(request.orderId).slice(0, 8)}` : ''}
            </p>
          )}

          <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
            {hasLoadedEntityField(request, 'orderId') && request.orderId && (
              <div className="rounded border border-gray-200 bg-white px-3 py-2">
                <p className="font-semibold text-gray-800">Order</p>
                <Link to={orderHref} className="font-semibold text-blue-700 hover:underline">
                  #{String(request.orderId).slice(0, 8)}
                </Link>
                {(request.orderStatus || request.paymentMethod) && (
                  <p>{[request.orderStatus, request.paymentMethod].filter(Boolean).join(' / ')}</p>
                )}
              </div>
            )}
            {(request.supplierName || request.supplierId) && (
              <div className="rounded border border-gray-200 bg-white px-3 py-2">
                <p className="font-semibold text-gray-800">Vendor</p>
                {request.supplierId ? (
                  <Link to={`/vendors/${request.supplierId}`} className="font-semibold text-blue-700 hover:underline">
                    {request.supplierName || 'Vendor'}
                  </Link>
                ) : (
                  <p>{request.supplierName || 'Vendor'}</p>
                )}
                {request.supplierId && <p>{String(request.supplierId).slice(0, 8)}</p>}
              </div>
            )}
            {(request.customerName || request.customerEmail || request.customerId) && (
              <div className="rounded border border-gray-200 bg-white px-3 py-2">
                <p className="font-semibold text-gray-800">Customer</p>
                {request.customerId ? (
                  <Link to={`/users/${request.customerId}`} className="font-semibold text-blue-700 hover:underline">
                    {request.customerName || request.customerEmail || 'Customer'}
                  </Link>
                ) : (
                  <p>{request.customerName || 'Guest customer'}</p>
                )}
                {request.customerEmail && <p className="break-all">{request.customerEmail}</p>}
              </div>
            )}
          </div>

          {showRejectReason && (
            <input
              value={reviewRejectionReason}
              onChange={(event) => onReviewRejectionReasonChange?.(request, event.target.value)}
              className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Reason"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
          {hasLoadedEntityField(request, 'status') && request.status && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getCommissionPaymentRequestStatusClass(request.status)}`}>
              {request.status}
            </span>
          )}
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => action.onSelect(request)}
              className={`rounded px-4 py-2 text-white ${action.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {action.label}
            </button>
          ))}
          {typeof onDetails === 'function' && (
            <button type="button" onClick={() => onDetails(request)} className="rounded border px-3 py-1 text-sm">
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
