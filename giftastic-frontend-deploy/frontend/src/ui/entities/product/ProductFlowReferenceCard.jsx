import {
  formatProductMoney,
  getProductDisplayName,
  getProductDisplayPrice,
  getProductPrimaryImage,
  getProductStatusClass,
} from './productSelectors.js';

export default function ProductFlowReferenceCard({ product, access, selected = false, required = false, disabled = false, children, onSelect }) {
  if (!product || !access?.canRead) return null;
  return (
    <article className={`rounded-xl border p-4 transition-all ${disabled ? 'border-stone-200 bg-stone-50 opacity-60' : selected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-outline-variant bg-white hover:border-primary/40'}`}>
      <button type="button" onClick={onSelect} disabled={disabled} className="flex w-full items-start gap-3 text-left disabled:cursor-not-allowed">
        <img src={getProductPrimaryImage(product) || 'https://via.placeholder.com/80'} alt={getProductDisplayName(product)} className="h-16 w-20 shrink-0 rounded-lg border border-stone-200 bg-stone-50 object-contain p-1" />
        <div className="min-w-0 flex-grow">
          <p className="truncate text-sm font-semibold text-primary">{getProductDisplayName(product)}</p>
          <p className="mt-0.5 text-xs text-secondary">{formatProductMoney(getProductDisplayPrice(product)) || 'Price unavailable'}</p>
          <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getProductStatusClass(product.status)}`}>{product.status || 'Unknown'}</span>
          {required && <span className="ml-2 text-[10px] font-bold uppercase text-primary">Required</span>}
        </div>
      </button>
      {children && <div className="mt-4">{children}</div>}
    </article>
  );
}
