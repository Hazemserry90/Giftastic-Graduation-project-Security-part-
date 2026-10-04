// Canonical Order presentation section.
import OrderSection from './OrderSection';
import { formatOrderMoney as formatMoney } from '../orderSelectors';

export default function OrderCommissionSection({ order }) {
  if (order?.commissionAmount === undefined && order?.commissionRate === undefined) return null;

  return (
    <OrderSection title="Commission" icon="account_balance">
      <div className="grid gap-3 sm:grid-cols-2">
        {order?.commissionAmount !== undefined && (
          <div className="rounded-lg bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Commission</div>
            <div className="mt-2 text-xl font-bold text-primary">{formatMoney(order.commissionAmount)}</div>
          </div>
        )}
        {order?.commissionRate !== undefined && (
          <div className="rounded-lg bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Rate</div>
            <div className="mt-2 text-xl font-bold text-primary">{order.commissionRate}%</div>
          </div>
        )}
      </div>
    </OrderSection>
  );
}
