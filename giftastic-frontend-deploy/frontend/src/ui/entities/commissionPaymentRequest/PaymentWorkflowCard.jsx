import { Link } from 'react-router-dom';
import { buildCommissionActions, formatCommissionMoney, formatCommissionRate } from '../commission';
import { buildCommissionPaymentRequestActions } from './commissionPaymentRequestActions';
import { getCommissionPaymentRequestStatusClass } from './commissionPaymentRequestSelectors';

const shortId = (value) => (value ? `#${String(value).slice(0, 8)}` : 'Not available');

const statusClass = (status) => getCommissionPaymentRequestStatusClass(status);

const getOrderSnapshot = (commission, request) => ({
  id: request?.orderId || commission?.orderId,
  status: request?.orderStatus || commission?.orderStatus,
  paymentMethod: request?.paymentMethod || commission?.paymentMethod,
  customerId: request?.customerId || commission?.customerId,
  customerName: request?.customerName || commission?.customerName,
  customerEmail: request?.customerEmail || commission?.customerEmail,
});

const getVendorSnapshot = (commission, request) => ({
  id: request?.supplierId || commission?.supplierId,
  userId: request?.vendorUserId || commission?.vendorUserId,
  name: request?.supplierName || commission?.supplierName || 'Vendor',
});

const getWorkflowStatus = (commission, request) => request?.status || commission?.status;

const getWorkflowDirection = (commission, request) => request?.direction || commission?.direction;

const getPayableAmount = (commission, request) =>
  request?.payableAmount || commission?.payableAmount || commission?.commissionAmount;

const getOrderHref = (orderId, commissionAccess, requestAccess) => {
  if (!orderId) return null;
  const encodedOrderId = encodeURIComponent(orderId);
  if (commissionAccess?.isOwner || requestAccess?.isOwner) {
    return `/vendor/orders?orderId=${encodedOrderId}`;
  }
  return `/orders/${encodedOrderId}`;
};

function EntityTile({ label, title, href, lines = [] }) {
  const Title = href ? Link : 'p';
  const titleProps = href
    ? { to: href, className: 'mt-1 inline-flex break-words text-sm font-semibold text-blue-700 hover:underline' }
    : { className: 'mt-1 break-words text-sm font-semibold text-gray-900' };
  return (
    <div className="min-w-0 rounded-md border border-gray-200 bg-white px-3 py-2">
      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
      <Title {...titleProps}>{title}</Title>
      {lines.filter(Boolean).map((line) => (
        <p key={line} className="mt-1 break-words text-xs text-gray-600">{line}</p>
      ))}
    </div>
  );
}

export default function PaymentWorkflowCard({
  commission,
  request,
  commissionAccess,
  requestAccess,
  handlers = {},
  reviewRejectionReason = '',
  onReviewRejectionReasonChange,
  onDetails,
  showActions = true,
  compact = false,
}) {
  const canRead = commissionAccess?.canRead || requestAccess?.canRead;
  if (!canRead || (!commission && !request)) return null;

  const order = getOrderSnapshot(commission, request);
  const vendor = getVendorSnapshot(commission, request);
  const status = getWorkflowStatus(commission, request);
  const direction = getWorkflowDirection(commission, request);
  const payableAmount = getPayableAmount(commission, request);
  const orderHref = getOrderHref(order.id, commissionAccess, requestAccess);
  const senderLabel = request?.senderLabel || (direction === 'PLATFORM_TO_VENDOR' ? 'Giftastic' : vendor.name);
  const receiverLabel = request?.receiverLabel || (direction === 'PLATFORM_TO_VENDOR' ? vendor.name : 'Giftastic');

  const commissionActions = commission
    ? buildCommissionActions({
      commission,
      access: commissionAccess || {},
      handlers: {
        submitPayment: handlers.submitPayment,
        urge: handlers.urge,
      },
    })
    : [];
  const reminderAction = commission
    && direction === 'PLATFORM_TO_VENDOR'
    && ['PENDING', 'OVERDUE'].includes(commission.status)
    && typeof handlers.urge === 'function'
    && !commissionActions.some((action) => action.key === 'urge')
    ? [{ key: 'urge', label: commissionAccess?.isOwner ? 'Urge payment' : 'Send payment reminder', onSelect: handlers.urge }]
    : [];
  const requestActions = request
    ? buildCommissionPaymentRequestActions({ request, access: requestAccess || {}, handlers })
    : [];
  const actions = showActions ? [...commissionActions, ...reminderAction, ...requestActions] : [];
  const canReject = actions.some((action) => action.key === 'reject');
  const showRejectReason = canReject && typeof onReviewRejectionReasonChange === 'function';

  return (
    <article className={`rounded-lg border border-gray-200 bg-white ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-gray-950">Payment workflow</h3>
            {status && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
                {status}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-700">
            {senderLabel} sends {formatCommissionMoney(payableAmount) || 'payment'} to {receiverLabel}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <EntityTile
              label="Order"
              title={order.id ? `Order ${shortId(order.id)}` : 'Order not available'}
              href={orderHref}
              lines={[
                [order.status, order.paymentMethod].filter(Boolean).join(' / '),
              ]}
            />
            <EntityTile
              label="Vendor"
              title={vendor.name}
              href={vendor.id ? `/vendors/${vendor.id}` : null}
              lines={[vendor.id ? `Supplier ${shortId(vendor.id)}` : null, vendor.userId ? `User ${shortId(vendor.userId)}` : null]}
            />
            <EntityTile
              label="Customer"
              title={order.customerName || order.customerEmail || 'Guest customer'}
              href={order.customerId ? `/users/${order.customerId}` : null}
              lines={[order.customerEmail, order.customerId ? `User ${shortId(order.customerId)}` : 'Guest checkout']}
            />
          </div>

          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs font-bold uppercase text-gray-500">Amount</p>
            {commission?.orderSubtotal !== undefined && commission?.commissionRate !== undefined && (
              <p className="mt-1 text-sm text-gray-700">
                Subtotal {formatCommissionMoney(commission.orderSubtotal)} x {formatCommissionRate(commission.commissionRate)}
                {commission?.commissionAmount !== undefined ? ` = ${formatCommissionMoney(commission.commissionAmount)}` : ''}
              </p>
            )}
            <p className="mt-1 text-base font-bold text-gray-950">
              Payable {formatCommissionMoney(payableAmount) || 'Not available'}
            </p>
          </div>

          {showRejectReason && (
            <input
              value={reviewRejectionReason}
              onChange={(event) => onReviewRejectionReasonChange?.(request, event.target.value)}
              className="mt-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Reason"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-start justify-end gap-2 lg:max-w-52">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => action.onSelect(action.key === 'submitPayment' || action.key === 'urge' ? commission : request)}
              className={`rounded px-4 py-2 text-sm font-semibold text-white ${
                action.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {action.label}
            </button>
          ))}
          {typeof onDetails === 'function' && (
            <button type="button" onClick={() => onDetails({ commission, request })} className="rounded border px-4 py-2 text-sm">
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
