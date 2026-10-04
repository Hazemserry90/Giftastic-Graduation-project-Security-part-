import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatVendorFeedbackDate,
  formatVendorFeedbackScore,
} from './vendorFeedbackSelectors';

export default function VendorFeedbackSummary({ feedback, access, selected = false, onSelect }) {
  if (!feedback || !access?.canRead) return null;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(feedback)}
      onKeyDown={(event) => event.key === 'Enter' && onSelect?.(feedback)}
      className={`bg-white rounded-xl p-6 cursor-pointer transition-all ${
        selected
          ? 'ring-2 ring-[#341547] shadow-[0_4px_16px_rgba(52,21,71,0.12)]'
          : 'shadow-[0_2px_8px_rgba(52,21,71,0.08)] hover:shadow-[0_4px_16px_rgba(52,21,71,0.12)]'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#f4d9ff] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#341547]">forum</span>
        </div>
        <div className="flex-1">
          <p className="font-plus-jakarta font-semibold text-[#1b1c1a]">Anonymous Feedback</p>
          {hasLoadedEntityField(feedback, 'createdAt') && feedback.createdAt && (
            <p className="text-sm text-[#4b444d] font-manrope">
              {formatVendorFeedbackDate(feedback.createdAt)}
            </p>
          )}
        </div>
      </div>
      {hasLoadedEntityField(feedback, 'feedback') && (
        <p className="text-[#1b1c1a] font-manrope line-clamp-3">{feedback.feedback}</p>
      )}
      {access.canViewModeration && hasLoadedEntityField(feedback, 'contentScore') && (
        <div className="mt-3">
          <span className={`px-2 py-1 rounded text-xs font-plus-jakarta font-semibold ${
            feedback.contentScore >= 0.7
              ? 'bg-[#d4f4dd] text-[#1e4620]'
              : 'bg-[#ffdad6] text-[#93000a]'
          }`}>
            Score: {formatVendorFeedbackScore(feedback.contentScore)}
          </span>
        </div>
      )}
    </article>
  );
}
