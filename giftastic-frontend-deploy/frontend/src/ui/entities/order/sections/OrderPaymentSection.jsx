// Canonical Order presentation section.
import OrderSection from './OrderSection';

const getPaymentMethodLabel = (paymentMethod) => {
  if (paymentMethod === 'COD') return 'COD';
  if (paymentMethod === 'INSTAPAY') return 'Instapay';
  return paymentMethod || 'Not provided';
};

export default function OrderPaymentSection({ order, access }) {
  const showPaymentDetails = access?.fields?.paymentDetails !== false;
  return (
    <OrderSection title="Payment" icon="payments">
      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
        <span className="font-semibold text-primary">{getPaymentMethodLabel(order?.paymentMethod)}</span>
      </div>
      {showPaymentDetails && order?.paymentMethod === 'INSTAPAY' && <div className="mt-3 text-sm text-on-surface-variant">
        <div>Instapay number: {order.instapayPhoneNumber || 'Not configured'}</div>
        <div className="mt-1">Refund phone: {order.instapayRefundPhoneNumber || 'Not provided'}</div>
        <div className="mt-1">Refund name: {order.instapayRefundName || 'Not provided'}</div>
        <div className="mt-1">Transaction IDs: {order.instapayTransactionIds?.length
          ? order.instapayTransactionIds.join(', ') : 'Not submitted yet'}</div>
      </div>}
      {order?.paymentConfirmedAt && <div className="mt-2 text-xs text-emerald-700">Payment confirmed</div>}
    </OrderSection>
  );
}

