import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatUserReviewRestrictionDate,
  getRestrictedCapabilities,
} from './userReviewRestrictionSelectors';

export default function UserReviewRestrictionSummary({ restriction, access }) {
  if (!restriction || !access?.canRead) return null;
  if (!hasLoadedEntityField(restriction, 'isActive') || !restriction.isActive) return null;
  const capabilities = getRestrictedCapabilities(restriction);

  return (
    <aside className="mb-8 bg-[#ffdad6] border border-[#93000a]/20 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined text-[#93000a]">warning</span>
        <div className="flex-1">
          <h3 className="font-noto-serif text-lg font-semibold text-[#93000a] mb-2">
            Review Restrictions Active
          </h3>
          <div className="space-y-2 text-sm text-[#93000a] font-manrope">
            {capabilities.map((capability) => <p key={capability}>• {capability}</p>)}
            {hasLoadedEntityField(restriction, 'reason') && restriction.reason && (
              <p className="mt-3"><strong>Reason:</strong> {restriction.reason}</p>
            )}
            {hasLoadedEntityField(restriction, 'expiresAt') && restriction.expiresAt && (
              <p><strong>Expires:</strong> {formatUserReviewRestrictionDate(restriction.expiresAt)}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
