import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorApplicationModal from '../components/modals/VendorApplicationModal';
import { vendorApplicationService } from '../services/vendorApplicationService';
import { useAuthStore } from '../store/useAuthStore';
import { getFriendlyErrorMessage } from '../services/api';
import {
  buildVendorApplicationAccess,
  buildVendorApplicationActions,
  VendorApplicationSummary,
  VENDOR_APPLICATION_CONTEXT,
} from '../ui/entities/vendorApplication';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';

export default function AdminVendorApplications() {
  const viewer = useAuthStore((state) => state.viewer);
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await vendorApplicationService.getPendingApplications();
      setApplications(data.map((application) => adaptEntityFromNamedSource('adaptVendorApplicationResponse', application)));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not load vendor applications. Please refresh and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReview = (application) => {
    setSelectedApp(application);
    setReviewAction('approve');
    setRejectionReason('');
  };

  const handleSubmitReview = async (requestedAction = reviewAction) => {
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', {
      decision: requestedAction === 'approve' ? 'APPROVE' : 'REJECT',
      reason: rejectionReason,
    }));
    if (!mapped.ok) { toast.error(Object.values(mapped.errors)[0]); return; }
    try {
      setProcessing(true);
      await vendorApplicationService.reviewApplication(
        selectedApp.id,
        mapped.payload.decision === 'APPROVE',
        mapped.payload.reason || null,
      );
      toast.success(`Application ${requestedAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not process this vendor application. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };
  const selectedAccess = selectedApp ? buildVendorApplicationAccess({
    application: selectedApp,
    viewer,
    context: VENDOR_APPLICATION_CONTEXT.ADMIN,
  }) : null;
  const selectedActions = selectedApp && selectedAccess ? buildVendorApplicationActions({
    application: selectedApp,
    access: selectedAccess,
    handlers: {
      approve: () => {
        setReviewAction('approve');
        handleSubmitReview('approve');
      },
      reject: () => {
        setReviewAction('reject');
        handleSubmitReview('reject');
      },
    },
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B2C5E]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4 flex items-center gap-2 text-[#4B2C5E] hover:text-[#6B4C7E] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-semibold">Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-serif font-bold text-[#4B2C5E] mb-2">Vendor Applications</h1>
            <p className="text-stone-600">Review and approve vendor applications</p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">inbox</span>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">No Pending Applications</h3>
              <p className="text-stone-600">All vendor applications have been reviewed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {applications.map((application) => (
                <VendorApplicationSummary
                  key={application.id}
                  application={application}
                  access={buildVendorApplicationAccess({
                    application,
                    viewer,
                    context: VENDOR_APPLICATION_CONTEXT.ADMIN,
                  })}
                  onSelect={handleReview}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <VendorApplicationModal
        isOpen={Boolean(selectedApp)}
        entity={selectedApp}
        access={selectedAccess}
        actions={selectedActions}
        pendingKey={processing ? reviewAction : null}
        onClose={() => setSelectedApp(null)}
      >
        <label className="mb-4 block text-sm font-semibold text-on-surface">
          Rejection reason
          <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-outline-variant p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
        </label>
      </VendorApplicationModal>
      <Footer />
    </div>
  );
}
