import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatVendorApplicationDate,
  getVendorApplicationDisplayName,
} from './vendorApplicationSelectors';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function VendorApplicationSummary({
  application,
  access,
  onSelect,
  actionLabel = 'View details',
}) {
  if (!application || !access?.canRead) return null;
  const pending = application.status === 'PENDING';

  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <h3 className="mb-1 max-w-full break-words text-xl font-semibold text-[#4B2C5E] [overflow-wrap:anywhere]">
            {getVendorApplicationDisplayName(application)}
          </h3>
          {hasLoadedEntityField(application, 'submittedAt') && application.submittedAt && (
            <p className="text-sm text-stone-500">
              Submitted: {formatVendorApplicationDate(application.submittedAt)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {hasLoadedEntityField(application, 'status') && application.status && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[application.status] || 'bg-gray-100 text-gray-800'}`}>
              {application.status}
            </span>
          )}
          {typeof onSelect === 'function' && (!pending || access.canReview || access.isOwner) && (
            <button
              type="button"
              onClick={() => onSelect(application)}
              className="px-4 py-2 bg-[#4B2C5E] text-white rounded-lg font-medium hover:bg-[#3d2450] transition"
            >
              {access.canReview && pending ? 'Review' : actionLabel}
            </button>
          )}
        </div>
      </div>

      {hasLoadedEntityField(application, 'description') && application.description && (
        <p className="mb-4 line-clamp-2 max-w-full whitespace-normal break-words text-stone-700 [overflow-wrap:anywhere]">
          {application.description}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {hasLoadedEntityField(application, 'contactEmail') && application.contactEmail && (
          <p><span className="text-stone-500">Email:</span> <span className="text-stone-800">{application.contactEmail}</span></p>
        )}
        {hasLoadedEntityField(application, 'contactPhone') && application.contactPhone && (
          <p><span className="text-stone-500">Phone:</span> <span className="text-stone-800">{application.contactPhone}</span></p>
        )}
        {hasLoadedEntityField(application, 'address') && application.address && (
          <p><span className="text-stone-500">Address:</span> <span className="text-stone-800">{application.address}</span></p>
        )}
        {hasLoadedEntityField(application, 'workingHours') && application.workingHours && (
          <p><span className="text-stone-500">Working hours:</span> <span className="text-stone-800">{application.workingHours}</span></p>
        )}
      </div>

      {application.status === 'APPROVED' && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          Application approved. The Vendor account is ready.
        </div>
      )}
      {application.status === 'REJECTED' && hasLoadedEntityField(application, 'rejectionReason') && application.rejectionReason && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <strong>Rejection reason:</strong> {application.rejectionReason}
        </div>
      )}
      {hasLoadedEntityField(application, 'reviewedAt') && application.reviewedAt && (
        <p className="mt-4 text-xs text-stone-500">
          Reviewed: {formatVendorApplicationDate(application.reviewedAt)}
        </p>
      )}
    </article>
  );
}
