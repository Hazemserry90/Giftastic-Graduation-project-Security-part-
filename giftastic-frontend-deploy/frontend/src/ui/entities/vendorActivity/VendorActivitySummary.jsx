import { Link } from 'react-router-dom';
import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatVendorActivityDate,
  formatVendorActivityType,
  getVendorActivityColor,
  getVendorActivityIcon,
} from './vendorActivitySelectors';

export default function VendorActivitySummary({ activity, access }) {
  if (!activity || !access?.canRead) return null;
  const related = activity.relatedEntity;
  const href = related?.entityType === 'product' ? `/products/${related.id}`
    : related?.entityType === 'order' ? `/orders/${related.id}`
      : related?.entityType === 'giftFlow' ? `/gift-flow/${related.id}`
        : null;
  return (
    <article className="bg-white rounded-xl shadow-[0_2px_8px_rgba(52,21,71,0.08)] p-6 hover:shadow-[0_4px_16px_rgba(52,21,71,0.12)] transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${getVendorActivityColor(activity.activityType)} flex items-center justify-center flex-shrink-0`}>
          <span className="material-symbols-outlined">{getVendorActivityIcon(activity.activityType)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="font-plus-jakarta font-semibold text-[#1b1c1a] mb-1">
                {formatVendorActivityType(activity.activityType)}
              </h3>
              {hasLoadedEntityField(activity, 'description') && (
                <p className="text-[#4b444d] font-manrope">{activity.description}</p>
              )}
            </div>
            <span className="text-sm text-[#4b444d] font-manrope whitespace-nowrap">
              {formatVendorActivityDate(activity.occurredAt)}
            </span>
          </div>
          {related && (href ? (
            <Link to={href} className="mt-2 inline-block rounded bg-[#f5f3f0] px-3 py-1 text-xs font-bold text-primary">
              View related {related.entityType}
            </Link>
          ) : (
            <p className="mt-2 text-xs text-[#4b444d]">Related {related.entityType}: {related.id}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
