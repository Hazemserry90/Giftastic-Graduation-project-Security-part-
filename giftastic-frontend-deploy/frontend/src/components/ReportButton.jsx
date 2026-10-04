import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { reportService } from '../services/reportService';
import { useAuthStore } from '../store/useAuthStore';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';

export default function ReportButton({ entityType, entityId, entityName }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const reasons = {
    PRODUCT: ['Inappropriate content', 'Fraudulent product', 'Misleading description', 'Copyright violation', 'Other'],
    GIFT_FLOW: ['Inappropriate content', 'Offensive theme', 'Spam', 'Other'],
    USER: ['Harassment', 'Spam', 'Inappropriate behavior', 'Impersonation', 'Other'],
    VENDOR: ['Fraudulent activity', 'Poor service', 'Misleading information', 'Spam', 'Other'],
    ADMIN: ['Abuse of power', 'Inappropriate behavior', 'Bias', 'Other']
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to report');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setLoading(true);
    try {
      const mapped = commandDraftToPayload('reportSubmission', createCommandDraft('reportSubmission', {
        reportType: entityType,
        reportedEntityId: entityId,
        reason,
        description,
      }));
      if (!mapped.ok) {
        toast.error(Object.values(mapped.errors)[0]);
        return;
      }
      await reportService.createReport(mapped.payload);
      
      toast.success('Report submitted successfully');
      setShowModal(false);
      setReason('');
      setDescription('');
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('You have already reported this');
      } else {
        toast.error('Failed to submit report');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg transition-all"
      >
        <span className="material-symbols-outlined text-base">flag</span>
        <span className="font-label-sm">Report</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-headline-md text-primary">Report {entityType.toLowerCase().replace('_', ' ')}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant ml-1 block mb-2">
                  What's the issue?
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="">Select a reason</option>
                  {reasons[entityType]?.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant ml-1 block mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide more context about the issue..."
                  className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-secondary-container/10 border border-secondary/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm mt-0.5">info</span>
                  <p className="text-xs text-on-surface-variant">
                    Reports are reviewed by our moderation team. False reports may result in account restrictions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-error text-on-error rounded-lg hover:bg-error/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
