import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatReportDate,
  getReportDisplayType,
  getReportStatusStyle,
  getReportTypeIcon,
} from './reportSelectors';

export default function ReportSummary({ report, access, onManage }) {
  if (!report || !access?.canRead) return null;
  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-plum p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <span className="material-symbols-outlined text-3xl text-primary">
            {getReportTypeIcon(report.reportType)}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {getReportDisplayType(report)} Report
              </h3>
              {hasLoadedEntityField(report, 'status') && report.status && (
                <span className={`px-3 py-1 rounded-full text-xs font-label-sm ${getReportStatusStyle(report.status)}`}>
                  {report.status.replaceAll('_', ' ')}
                </span>
              )}
            </div>
            {hasLoadedEntityField(report, 'reason') && (
              <p className="text-sm text-on-surface-variant mb-2"><strong>Reason:</strong> {report.reason}</p>
            )}
            {hasLoadedEntityField(report, 'description') && report.description && (
              <p className="text-sm text-on-surface-variant mb-2"><strong>Description:</strong> {report.description}</p>
            )}
            {hasLoadedEntityField(report, 'createdAt') && report.createdAt && (
              <p className="text-xs text-on-surface-variant">Reported on {formatReportDate(report.createdAt)}</p>
            )}
            {hasLoadedEntityField(report, 'reviewedAt') && report.reviewedAt && (
              <p className="text-xs text-on-surface-variant">Reviewed on {formatReportDate(report.reviewedAt)}</p>
            )}
            {access.canViewAdminNotes && hasLoadedEntityField(report, 'adminNotes') && report.adminNotes && (
              <div className="mt-3 p-3 bg-primary-container/10 rounded-lg">
                <p className="text-xs font-label-sm text-on-surface-variant mb-1">Admin Notes:</p>
                <p className="text-sm text-on-surface">{report.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
        {access.canManage && typeof onManage === 'function' && (
          <button
            type="button"
            onClick={() => onManage(report)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-all font-label-sm"
          >
            Take Action
          </button>
        )}
      </div>
    </article>
  );
}
