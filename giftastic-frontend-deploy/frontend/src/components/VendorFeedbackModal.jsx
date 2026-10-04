import { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import reviewService from '../services/reviewService';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';

const VendorFeedbackModal = ({ isOpen, onClose, vendorId, orderId, vendorName }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const mapped = commandDraftToPayload('feedbackSubmission', createCommandDraft('feedbackSubmission', {
        vendorId,
        orderId,
        feedback: feedback.trim(),
      }));
      if (!mapped.ok) {
        setError(Object.values(mapped.errors)[0]);
        return;
      }
      await reviewService.createVendorFeedback(mapped.payload);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setFeedback('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fbf9f6] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(52,21,71,0.16)]">
        <div className="sticky top-0 bg-[#fbf9f6] border-b border-[#e4e2df] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f4d9ff] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#341547]" />
            </div>
            <div>
              <h2 className="font-noto-serif text-xl font-semibold text-[#341547]">
                Vendor Feedback
              </h2>
              <p className="text-sm text-[#4b444d] font-manrope">
                Share your experience with {vendorName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#4b444d] hover:text-[#341547] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#d4f4dd] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1e4620]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-noto-serif text-xl font-semibold text-[#341547] mb-2">
                Thank You!
              </h3>
              <p className="text-[#4b444d] font-manrope">
                Your feedback has been submitted and will be reviewed by our moderators.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-plus-jakarta font-semibold text-sm text-[#1b1c1a] mb-2">
                  Your Feedback *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-[#705a49] rounded-lg font-manrope text-[#1b1c1a] focus:outline-none focus:border-[#341547] focus:ring-2 focus:ring-[#341547]/20 transition-all"
                  placeholder="Tell us about your experience with this vendor..."
                />
                <p className="mt-2 text-xs text-[#4b444d] font-manrope">
                  This feedback is anonymous and will only be visible to moderators. It helps us maintain quality standards.
                </p>
              </div>

              {error && (
                <div className="bg-[#ffdad6] text-[#93000a] px-4 py-3 rounded-lg font-manrope text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white text-[#341547] py-3 px-6 rounded-lg font-plus-jakarta font-semibold border-2 border-[#341547] hover:bg-[#f4d9ff] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#341547] text-white py-3 px-6 rounded-lg font-plus-jakarta font-semibold hover:bg-[#4b2c5e] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorFeedbackModal;
