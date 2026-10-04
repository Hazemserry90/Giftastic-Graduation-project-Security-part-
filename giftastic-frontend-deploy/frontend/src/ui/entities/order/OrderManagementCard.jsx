import { formatOrderDate, formatOrderMoney, getShortOrderId } from './orderSelectors';

export default function OrderManagementCard({ order, access, onDetails }) {
  if (!access?.canRead) return null;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-bold text-slate-800">Order #{getShortOrderId(order)}</div>
          <div className="mt-1 text-xs text-slate-500">{formatOrderDate(order.placedAt) || '-'}</div>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{order.status}</span>
      </div>
      <div className="mt-3 text-sm text-slate-600">{order.items?.length || 0} item(s) · {formatOrderMoney(order.totalAmount) || '-'}</div>
      <button type="button" onClick={() => onDetails?.(order)} className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-indigo-600">
        View Details
      </button>
    </article>
  );
}
