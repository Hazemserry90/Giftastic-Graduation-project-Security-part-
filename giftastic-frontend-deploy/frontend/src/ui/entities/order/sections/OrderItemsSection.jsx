// Canonical Order presentation section.
import { Link } from 'react-router-dom';
import OrderSection from './OrderSection';
import { formatOrderMoney as formatMoney, parseOrderMetadata } from '../orderSelectors';

const fallbackImage = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop';

export default function OrderItemsSection({ items = [] }) {
  return (
    <OrderSection title="Items" icon="inventory_2">
      {items.length === 0 ? (
        <p className="text-sm italic text-on-surface-variant">No items were found for this order.</p>
      ) : (
        <div className="divide-y divide-stone-100">
          {items.map((item, index) => {
            const metadata = parseOrderMetadata(item.metadata);
            const itemPrice = item.price ?? item.priceAtPurchase;
            return (
              <div key={`${item.productId || 'item'}-${index}`} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row">
                <Link
                  to={item.productId ? `/products/${item.productId}` : '#'}
                  aria-disabled={!item.productId}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100 disabled:cursor-default"
                >
                  <img
                    src={item.imageUrl || fallbackImage}
                    alt={item.productName || 'Gift item'}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        to={item.productId ? `/products/${item.productId}` : '#'}
                        aria-disabled={!item.productId}
                        className="break-words text-left font-bold text-primary hover:text-secondary disabled:cursor-default disabled:hover:text-primary"
                      >
                        {item.productName || 'Gift Item'}
                      </Link>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Qty: {item.quantity || 1} &middot; {formatMoney(itemPrice)} each
                      </p>
                      {item.productId && (
                        <Link to={`/products/${item.productId}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary">
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                          Product page
                        </Link>
                      )}
                    </div>
                    <p className="font-bold text-primary">
                      {formatMoney(Number(itemPrice || 0) * Number(item.quantity || 1))}
                    </p>
                  </div>
                  {metadata.length > 0 && (
                    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                        Personalization
                      </p>
                      <dl className="grid gap-2 sm:grid-cols-2">
                        {metadata.map((entry) => (
                          <div key={entry.key}>
                            <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                              {entry.label}
                            </dt>
                            <dd className="break-words text-sm font-semibold text-primary">{entry.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OrderSection>
  );
}
