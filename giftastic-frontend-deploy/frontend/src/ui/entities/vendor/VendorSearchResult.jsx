import { Link } from 'react-router-dom';
import { getVendorName } from './vendorSelectors.js';

export default function VendorSearchResult({ vendor, access, to, onSelect }) {
  if (!vendor || !access?.canRead) return null;
  return (
    <Link to={to} onClick={onSelect} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-stone-50">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-stone-200">
        {vendor.logoUrl ? <img src={vendor.logoUrl} alt={getVendorName(vendor)} className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-stone-400">store</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{getVendorName(vendor)}</div>
        {vendor.description && <div className="truncate text-xs text-gray-500">{vendor.description}</div>}
      </div>
    </Link>
  );
}
