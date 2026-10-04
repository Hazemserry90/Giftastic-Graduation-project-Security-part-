// Canonical Order presentation section.
import OrderSection from './OrderSection';
import { formatOrderMoney as formatMoney } from '../orderSelectors';

export default function OrderSummarySection({ order, totalAmount = order?.totalAmount }) {
  return (
    <OrderSection title="Order Summary" icon="receipt_long">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-stone-50 p-4">
        <span className="font-bold text-primary">Total</span>
        <span className="font-display-sm text-2xl font-bold text-primary">
          {formatMoney(totalAmount) || '-'}
        </span>
      </div>
    </OrderSection>
  );
}
