import { formatCartMoney, getCartItemTotal, getCartItemsTotal } from './cartSelectors.js';

const fallbackImage = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=96&h=96&fit=crop';

function CartItemIdentity({ item, compact = false }) {
  return (
    <div className="flex min-w-0 flex-1 gap-4">
      <div className={`${compact ? 'h-20 w-20' : 'h-24 w-24'} flex-shrink-0 overflow-hidden rounded-lg bg-surface-container`}>
        <img src={item.imageUrl || fallbackImage} alt={item.productName || 'Cart item'} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={`${compact ? 'text-base' : 'text-lg'} truncate font-bold text-primary`}>{item.productName || 'Gift item'}</h3>
        {compact ? (
          <p className="mt-1 text-xs text-secondary">Step: {item.parsedMetadata?.flowStepTitle || 'Selected item'}</p>
        ) : (
          <p className="mt-1 text-sm text-secondary">{formatCartMoney(item.price) || 'Price unavailable'} each</p>
        )}
      </div>
    </div>
  );
}

export default function CartGroupView({ group, onUpdateQuantity, onRemoveItem, onRemoveGroup }) {
  if (!group?.items?.length) return null;
  const { groupId, items } = group;
  const isFlow = Boolean(groupId);

  if (isFlow) {
    const metadata = items[0]?.parsedMetadata;
    return (
      <article className="overflow-hidden rounded-xl border border-surface-container bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-surface-container bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <div>
              <h3 className="font-bold text-primary">{metadata?.flowName || 'Custom Gift Flow'}</h3>
              <p className="text-xs text-secondary">Curated experience</p>
            </div>
          </div>
          <button type="button" onClick={() => onRemoveGroup(groupId)} className="flex items-center gap-1 text-sm text-error hover:text-error/80">
            <span className="material-symbols-outlined text-sm">delete</span>
            Remove Entire Flow
          </button>
        </header>
        <div className="divide-y divide-surface-container">
          {items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex gap-6 p-6">
              <CartItemIdentity item={item} compact />
              <div className="self-center text-right">
                <p className="text-sm font-medium">{item.quantity} × {formatCartMoney(item.price) || 'Price unavailable'}</p>
                <p className="mt-1 font-bold text-primary">{formatCartMoney(getCartItemTotal(item)) || 'Total unavailable'}</p>
              </div>
            </div>
          ))}
        </div>
        <footer className="flex items-center justify-between border-t border-surface-container bg-stone-50 px-6 py-4">
          <span className="text-sm font-semibold text-secondary">Flow Total</span>
          <span className="text-lg font-bold text-primary">{formatCartMoney(getCartItemsTotal(items)) || 'Total unavailable'}</span>
        </footer>
      </article>
    );
  }

  return items.map((item) => (
    <article key={item.productId} className="flex gap-6 rounded-xl border border-surface-container bg-white p-6 shadow-sm">
      <CartItemIdentity item={item} />
      <div className="flex items-center gap-4 self-center">
        <div className="flex items-center overflow-hidden rounded-lg border border-outline-variant">
          <button type="button" onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1 hover:bg-surface-container">-</button>
          <span className="min-w-12 border-x border-outline-variant bg-white px-4 py-1 text-center">{item.quantity}</span>
          <button type="button" onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1 hover:bg-surface-container">+</button>
        </div>
        <button type="button" onClick={() => onRemoveItem(item.productId)} className="flex items-center gap-1 text-sm text-error hover:text-error/80">
          <span className="material-symbols-outlined text-sm">delete_outline</span>
          Remove
        </button>
      </div>
      <p className="self-start text-xl font-bold text-primary">{formatCartMoney(getCartItemTotal(item)) || 'Total unavailable'}</p>
    </article>
  ));
}
