import { Link } from 'react-router-dom';
import { formatOrderDate, formatOrderMoney, getOrderStatusClass, getOrderVisibleTotal, getShortOrderId } from './orderSelectors';

export default function OrderHistoryCard({ order, access }) {
  if (!order || !access?.canRead) return null;
  const items = access.visibleItems || [];
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-plum">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-5 sm:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Order</p>
          <p className="font-mono font-bold text-primary">#{getShortOrderId(order)}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{formatOrderDate(order.placedAt, { dateStyle: 'medium' }) || 'Date unavailable'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">{formatOrderMoney(getOrderVisibleTotal(order, access)) || 'Total unavailable'}</p>
          <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${getOrderStatusClass(order.status)}`}>{order.status || 'Unknown'}</span>
        </div>
      </header>
      <div className="p-5 sm:p-8">
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <li key={`${item.productId || 'item'}-${index}`} className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3">
              <p className="font-bold text-primary">{item.productName || 'Gift item'}</p>
              <p className="mt-1 text-xs text-on-surface-variant">Qty {item.quantity ?? '-'} · {formatOrderMoney(item.price) || 'Price unavailable'}</p>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-sm italic text-on-surface-variant">Item details are not loaded.</p>}
        <div className="mt-6 flex justify-end">
          <Link to={`/orders/${order.id}`} className="rounded-lg bg-primary/5 px-6 py-3 font-bold text-primary hover:bg-primary hover:text-on-primary">View order details</Link>
        </div>
      </div>
    </article>
  );
}
