// Canonical Order presentation section.
import {
  formatOrderDate,
  formatOrderMoney as formatMoney,
  getOrderStatusClass as getStatusClass,
  getShortOrderId,
} from '../orderSelectors';

export default function OrderHeaderSection({ order }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Order</p>
          <h2 className="mt-1 font-headline-lg text-3xl font-bold text-primary">
            #{getShortOrderId(order)}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Placed {formatOrderDate(order?.placedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${getStatusClass(order?.status)}`}>
            {order?.status || 'UNKNOWN'}
          </span>
          <span className="font-display-sm text-xl font-bold text-primary">
            {formatMoney(order?.totalAmount)}
          </span>
        </div>
      </div>
    </section>
  );
}
