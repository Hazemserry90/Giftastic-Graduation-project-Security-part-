import { Link } from 'react-router-dom';
import ProductSummary from './ProductSummary';
import { formatProductDate, formatProductMoney, getProductStatusClass } from './productSelectors';

const ACTION_ICONS = {
  delete: 'delete',
  requestReview: 'rate_review',
  manageDiscount: 'local_offer',
};

export default function ProductInventoryRow({
  product,
  access,
  actions = [],
  onDetails,
}) {
  return (
    <tr className="group transition-colors hover:bg-primary/5">
      <td className="px-8 py-6"><ProductSummary product={product} access={access} compact /></td>
      <td className="px-8 py-6 text-sm text-secondary">{product.categories?.length || 0} categories</td>
      <td className="px-8 py-6 font-bold text-primary">{formatProductMoney(product.currentPrice ?? product.price) || '-'}</td>
      <td className="px-8 py-6">
        {access.fields.status && <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${getProductStatusClass(product.status)}`}>{product.status}</span>}
      </td>
      <td className="px-8 py-6 text-sm text-secondary">{formatProductDate(product.updatedAt) || '-'}</td>
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onDetails?.(product)} className="rounded-lg p-2 text-secondary hover:bg-secondary/10">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
          <Link to={`/vendor/products/${product.id}/edit`} className="rounded-lg p-2 text-primary hover:bg-primary/10">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </Link>
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onSelect}
              className={`rounded-lg p-2 ${action.tone === 'danger' ? 'text-error hover:bg-error/10' : 'text-primary hover:bg-primary/10'}`}
              aria-label={action.label}
            >
              <span className="material-symbols-outlined text-[20px]">{ACTION_ICONS[action.key] || 'more_horiz'}</span>
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}
