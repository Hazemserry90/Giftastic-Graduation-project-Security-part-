import { Link } from 'react-router-dom';
import { formatProductMoney, getProductDisplayName, getProductDisplayPrice, getProductPrimaryImage } from './productSelectors.js';

export default function ProductSearchResult({ product, access, to, onSelect }) {
  if (!product || !access?.canRead) return null;
  return (
    <Link to={to} onClick={onSelect} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-stone-50">
      <img src={getProductPrimaryImage(product) || '/placeholder.png'} alt={getProductDisplayName(product)} className="h-12 w-12 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{getProductDisplayName(product)}</div>
        <span className="text-sm font-semibold text-[#4B2C5E]">{formatProductMoney(getProductDisplayPrice(product)) || 'Price unavailable'}</span>
      </div>
    </Link>
  );
}
