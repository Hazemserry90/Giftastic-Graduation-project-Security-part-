import ProductSummary from './ProductSummary';
import { formatProductDate, getProductStatusClass } from './productSelectors';

function getRequestStatus(product) {
  if (product?.reviewRequestStatus) return product.reviewRequestStatus;
  if (product?.status === 'PENDING_APPROVAL') return 'PENDING';
  if (product?.status === 'APPROVED' && product?.reviewReviewedAt) return 'APPROVED';
  if (['REJECTED', 'DISABLED'].includes(product?.status) && product?.reviewReviewedAt) return 'REJECTED';
  return null;
}

export default function ProductManagementCard({
  product,
  access,
  actions = [],
  loading = false,
  onDetails,
  vendorName,
  showReviewRequest = false,
}) {
  const requestStatus = getRequestStatus(product);
  const requestDate = product?.reviewRequestedAt || (product?.status === 'PENDING_APPROVAL' ? product?.updatedAt : null);
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <ProductSummary product={product} access={access} compact />
        {showReviewRequest && (
          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            <p className="m-0"><span className="font-semibold text-slate-800">Vendor:</span> {vendorName || product?.supplierId || 'Unknown vendor'}</p>
            <p className="m-0"><span className="font-semibold text-slate-800">Current status:</span> {product?.status || 'Unknown'}</p>
            <p className="m-0"><span className="font-semibold text-slate-800">Request date:</span> {formatProductDate(requestDate) || 'Not recorded'}</p>
            {requestStatus && (
              <p className="m-0">
                <span className="font-semibold text-slate-800">Request status:</span>{' '}
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${getProductStatusClass(product?.status)}`}>
                  {requestStatus}
                </span>
              </p>
            )}
            {product?.reviewRequestMessage && (
              <p className="m-0 sm:col-span-2 lg:col-span-4"><span className="font-semibold text-slate-800">Vendor message:</span> {product.reviewRequestMessage}</p>
            )}
            {product?.reviewRejectionReason && (
              <p className="m-0 sm:col-span-2 lg:col-span-4"><span className="font-semibold text-slate-800">Rejection reason:</span> {product.reviewRejectionReason}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <button type="button" onClick={() => onDetails?.(product)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-600">
          Details
        </button>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onSelect}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${action.intent === 'danger' || ['reject', 'delete', 'deactivate'].includes(action.key) ? 'bg-red-500' : 'bg-emerald-500'}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}
