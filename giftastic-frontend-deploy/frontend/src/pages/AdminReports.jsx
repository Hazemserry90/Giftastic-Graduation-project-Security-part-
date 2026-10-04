import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportModal from '../components/modals/ReportModal';
import { reportService } from '../services/reportService';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../store/useAuthStore';
import { getFriendlyErrorMessage } from '../services/api';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import {
  buildReportAccess,
  buildReportActions,
  getReportOutcomeLabel,
  getReportStatusLabel,
  getReportStatusGroup,
  ReportSemanticViews,
  REPORT_CONTEXT,
} from '../ui/entities/report';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';
import { buildUserAccess, getUserReferenceLabel, USER_CONTEXT } from '../ui/entities/user';

export default function AdminReports() {
  const navigate = useNavigate();
  const viewer = useAuthStore((state) => state.viewer);
  const hydrateAdminFacet = useAuthStore((state) => state.hydrateAdminFacet);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [reporters, setReporters] = useState({});
  const [reportedVendors, setReportedVendors] = useState({});
  const [vendorsLoaded, setVendorsLoaded] = useState(false);
  const loadGeneration = useRef(0);
  const statusFilters = ['ALL', 'PENDING', 'FINISHED'];

  const accessFor = (report, activeViewer = viewer) => buildReportAccess({
    report,
    viewer: activeViewer,
    context: REPORT_CONTEXT.MODERATION,
  });

  const loadReports = async () => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    try {
      const profile = await adminService.getMyAdminProfile();
      const activeViewer = hydrateAdminFacet(profile);
      const data = ['ALL', 'PENDING', 'FINISHED'].includes(filter)
        ? await reportService.getAllReports()
        : await reportService.getReportsByStatus(filter);
      if (generation !== loadGeneration.current) return;
      const records = Array.isArray(data) ? data : data?.content || [];
      setReports(records
        .map((record) => adaptEntityFromNamedSource('adaptReportDomain', record))
        .filter((report) => filter === 'ALL' || getReportStatusGroup(report.status) === filter)
        .filter((report) => accessFor(report, activeViewer).canRead));
      toast.dismiss('admin-reports-load');
    } catch (error) {
      if (generation === loadGeneration.current) {
        toast.error(getFriendlyErrorMessage(error, 'We could not load reports. Please refresh and try again.'), { id: 'admin-reports-load' });
      }
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedReport(null);
    setActionNotes('');
    loadReports();
    return () => { loadGeneration.current += 1; };
  }, [filter]);

  useEffect(() => {
    let active = true;
    adminService.getAllUsers()
      .then((records) => {
        if (!active) return;
        setReporters(Object.fromEntries((records || []).map((record) => {
          const user = adaptEntityFromNamedSource('adaptUserAdminManagementRecord', record);
          return [user.id, user];
        })));
      })
      .catch(() => {});
    adminService.getAllVendors()
      .then((records) => {
        if (!active) return;
        const entries = [];
        (records || []).forEach((record) => {
          const vendor = adaptEntityFromNamedSource('adaptVendorPublicListRecord', record);
          if (vendor.userId) entries.push([vendor.userId, vendor]);
          if (vendor.supplierId) entries.push([vendor.supplierId, vendor]);
        });
        setReportedVendors(Object.fromEntries(entries));
        setVendorsLoaded(true);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const getReportedVendorUserId = (report) => reportedVendors[report?.reportedEntityId]?.userId || report?.reportedEntityId;
  const isReportedVendor = (report) => report?.reportType === 'VENDOR' || Boolean(reportedVendors[report?.reportedEntityId]);
  const getActionReport = (report) => {
    if (!report) return report;
    if (['USER', 'VENDOR'].includes(report.reportType) && !vendorsLoaded) {
      return { ...report, reportType: 'PENDING_ENTITY_LOOKUP' };
    }
    if (isReportedVendor(report)) return { ...report, reportType: 'VENDOR' };
    return report;
  };

  const handleAction = async (action) => {
    if (!selectedReport) return;
    const decision = ['banReportedUser', 'deactivateReportedVendor'].includes(action)
      ? 'APPROVE'
      : 'INVALIDATE';
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', {
      decision,
      notes: actionNotes,
      reason: '',
    }));
    if (!mapped.ok) { toast.error(Object.values(mapped.errors)[0]); return; }
    setPendingAction(action);
    try {
      if (action === 'banReportedUser') {
        await adminService.banUser(selectedReport.reportedEntityId);
        await reportService.markActionTaken(selectedReport.id, mapped.payload.notes || 'Banned reported user', 'BAN_USER');
      }
      if (action === 'deactivateReportedVendor') {
        await adminService.deactivateVendor(getReportedVendorUserId(selectedReport));
        await reportService.markActionTaken(selectedReport.id, mapped.payload.notes || 'Deactivated reported vendor', 'DEACTIVATE_VENDOR');
      }
      if (action === 'resolve') await reportService.resolveReport(selectedReport.id, mapped.payload.notes);
      toast.success('Report updated successfully');
      setSelectedReport(null);
      setActionNotes('');
      await loadReports();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not update this report. Please try again.'), { id: 'admin-report-update' });
    } finally {
      setPendingAction(null);
    }
  };

  const selectedAccess = selectedReport ? accessFor(selectedReport) : null;
  const selectedReporter = selectedReport ? reporters[selectedReport.reporterId] : null;
  const selectedReporterAccess = selectedReporter ? buildUserAccess({
    user: selectedReporter,
    viewer,
    context: USER_CONTEXT.ADMIN_READ,
  }) : null;
  const selectedOutcomeLabel = selectedReport ? getReportOutcomeLabel(selectedReport) : null;
  const selectedActions = selectedReport && selectedAccess ? buildReportActions({
    report: getActionReport(selectedReport),
    access: selectedAccess,
    handlers: {
      banReportedUser: () => handleAction('banReportedUser'),
      deactivateReportedVendor: () => handleAction('deactivateReportedVendor'),
      resolve: () => handleAction('resolve'),
    },
  }) : [];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-12">
        <button type="button" onClick={() => navigate('/admin/dashboard')} className="mb-4 min-h-11 text-sm font-bold text-primary">← Back to Dashboard</button>
        <h1 className="font-headline-lg text-headline-lg text-primary">Report Management</h1>
        <p className="mt-2 text-on-surface-variant">Review and manage user reports.</p>
        <div className="my-8 inline-flex max-w-full overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`min-h-11 px-4 text-sm font-semibold transition-colors sm:px-6 ${filter === status ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container'}`}
            >
              {getReportStatusLabel(status)}
            </button>
          ))}
        </div>
        {loading ? <p role="status" className="py-12 text-center">Loading reports…</p> : reports.length === 0 ? <p className="rounded-xl bg-white py-12 text-center">No reports found.</p> : (
          <div className="space-y-4">
            {reports.map((report) => (
              <button key={report.id} type="button" onClick={() => setSelectedReport(report)} className="block w-full rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <ReportSemanticViews.ReportSummary entity={report} access={accessFor(report)} />
              </button>
            ))}
          </div>
        )}
      </main>
      <ReportModal
        entity={selectedReport}
        access={selectedAccess}
        actions={selectedActions}
        isOpen={Boolean(selectedReport)}
        pendingKey={pendingAction}
        onClose={() => {
          setSelectedReport(null);
          setActionNotes('');
        }}
      >
        <div className="mb-4 rounded-lg border border-outline-variant bg-white p-3 text-sm">
          <span className="font-semibold text-on-surface">Submitted by: </span>
          <span className="text-on-surface-variant">
            {selectedReporter
              ? getUserReferenceLabel(selectedReporter, selectedReporterAccess)
              : selectedReport?.reporterId || 'Unknown user'}
          </span>
        </div>
        {selectedOutcomeLabel && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <span className="font-semibold text-on-surface">Outcome: </span>
            <span className="text-on-surface-variant">{selectedOutcomeLabel}</span>
          </div>
        )}
        <label className="mb-4 block text-sm font-semibold">Admin notes
          <textarea value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-outline-variant p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
        </label>
      </ReportModal>
      <Footer />
    </div>
  );
}
