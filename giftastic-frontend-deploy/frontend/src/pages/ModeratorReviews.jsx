import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import reviewService from '../services/reviewService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReviewModal from '../components/modals/ReviewModal';
import { useAuthStore } from '../store/useAuthStore';
import { adminService } from '../services/adminService';
import {
  buildVendorFeedbackAccess,
  VendorFeedbackSemanticViews,
  VENDOR_FEEDBACK_CONTEXT,
} from '../ui/entities/vendorFeedback';
import {
  buildReviewAccess,
  buildReviewActions,
  ReviewSemanticViews,
  REVIEW_CONTEXT,
} from '../ui/entities/review';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';

const ModeratorReviews = () => {
  const viewer = useAuthStore((state) => state.viewer);
  const hydrateAdminFacet = useAuthStore((state) => state.hydrateAdminFacet);
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailReview, setDetailReview] = useState(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await adminService.getMyAdminProfile();
      const activeViewer = hydrateAdminFacet(profile);
      if (activeTab === 'reviews') {
        const data = await reviewService.getPendingReviews();
        setReviews((data || [])
          .map((review) => adaptEntityFromNamedSource('adaptReviewModerationResponse', review))
          .filter((review) => buildReviewAccess({
            review,
            viewer: activeViewer,
            context: REVIEW_CONTEXT.MODERATION,
          }).canRead));
      } else {
        const data = await reviewService.getPendingVendorFeedback();
        setFeedback(data
          .map((item) => adaptEntityFromNamedSource('adaptVendorFeedbackResponse', item))
          .filter((item) => buildVendorFeedbackAccess({
            feedback: item,
            viewer: activeViewer,
            context: VENDOR_FEEDBACK_CONTEXT.MODERATION,
          }).canRead));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', { decision: 'APPROVE', notes: moderatorNotes }));
    if (!mapped.ok) return;
    try {
      setActionLoading(true);
      await reviewService.approveReview(reviewId, mapped.payload.notes);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setSelectedItem(null);
      setModeratorNotes('');
    } catch (error) {
      console.error('Failed to approve review:', error);
      alert('Failed to approve review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReview = async (reviewId) => {
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', { decision: 'REJECT', notes: moderatorNotes }));
    if (!mapped.ok) { alert(Object.values(mapped.errors)[0]); return; }
    try {
      setActionLoading(true);
      await reviewService.rejectReview(reviewId, mapped.payload.notes);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setSelectedItem(null);
      setModeratorNotes('');
    } catch (error) {
      console.error('Failed to reject review:', error);
      alert('Failed to reject review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewModalAction = (action, review) => {
    if (action === 'approve') {
      handleApproveReview(review.id);
    }
    if (action === 'reject') {
      handleRejectReview(review.id);
    }
  };

  const selectedReviewAccess = activeTab === 'reviews' && selectedItem
    ? buildReviewAccess({
      review: selectedItem,
      viewer,
      context: REVIEW_CONTEXT.MODERATION,
    })
    : null;
  const selectedReviewActions = selectedReviewAccess
    ? buildReviewActions({
      review: selectedItem,
      access: selectedReviewAccess,
      handlers: {
        approve: (review) => handleApproveReview(review.id),
        reject: (review) => handleRejectReview(review.id),
      },
    })
    : [];

  return (
    <div className="min-h-screen bg-[#fbf9f6] flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="font-noto-serif text-4xl font-bold text-[#341547] mb-2">
            Review Moderation
          </h1>
          <p className="text-[#4b444d] font-manrope">
            Review and moderate pending reviews and vendor feedback
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#e4e2df]">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-4 font-plus-jakarta font-semibold transition-colors ${
              activeTab === 'reviews'
                ? 'text-[#341547] border-b-2 border-[#341547]'
                : 'text-[#4b444d] hover:text-[#341547]'
            }`}
          >
            Pending Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-3 px-4 font-plus-jakarta font-semibold transition-colors ${
              activeTab === 'feedback'
                ? 'text-[#341547] border-b-2 border-[#341547]'
                : 'text-[#4b444d] hover:text-[#341547]'
            }`}
          >
            Vendor Feedback ({feedback.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#341547]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List */}
            <div className="space-y-4">
              {activeTab === 'reviews' ? (
                reviews.length === 0 ? (
                  <div className="text-center py-12 text-[#4b444d]">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-manrope">No pending reviews</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <ReviewSemanticViews.ReviewModerationCard
                      key={review.id}
                      entity={review}
                      access={buildReviewAccess({
                        review,
                        viewer,
                        context: REVIEW_CONTEXT.MODERATION,
                      })}
                      selected={selectedItem?.id === review.id}
                      onSelect={setSelectedItem}
                    />
                  ))
                )
              ) : (
                feedback.length === 0 ? (
                  <div className="text-center py-12 text-[#4b444d]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-manrope">No pending feedback</p>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedItem(item)} className="block w-full rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                      <VendorFeedbackSemanticViews.VendorFeedbackSummary
                        entity={item}
                        access={buildVendorFeedbackAccess({ feedback: item, viewer, context: VENDOR_FEEDBACK_CONTEXT.MODERATION })}
                      />
                    </button>
                  ))
                )
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:sticky lg:top-4 h-fit">
              {selectedItem ? (
                <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(52,21,71,0.08)]">
                  <h3 className="font-noto-serif text-xl font-semibold text-[#341547] mb-4">
                    Moderation Actions
                  </h3>
                  
                  <div className="mb-6">
                    {activeTab === 'reviews' ? (
                      <ReviewSemanticViews.ReviewModerationExcerpt
                        entity={selectedItem}
                        access={selectedReviewAccess}
                      />
                    ) : (
                      <VendorFeedbackSemanticViews.VendorFeedbackModerationExcerpt
                        entity={selectedItem}
                        access={buildVendorFeedbackAccess({
                          feedback: selectedItem,
                          viewer,
                          context: VENDOR_FEEDBACK_CONTEXT.MODERATION,
                        })}
                      />
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block font-plus-jakarta font-semibold text-sm text-[#1b1c1a] mb-2">
                      Moderator Notes (Optional)
                    </label>
                    <textarea
                      value={moderatorNotes}
                      onChange={(e) => setModeratorNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-[#705a49] rounded-lg font-manrope text-[#1b1c1a] focus:outline-none focus:border-[#341547] focus:ring-2 focus:ring-[#341547]/20 transition-all"
                      placeholder="Add notes about your decision..."
                    />
                  </div>

                  <div className="flex gap-3">
                    {activeTab === 'reviews' && (
                      <button
                        type="button"
                        onClick={() => setDetailReview(selectedItem)}
                        className="flex-1 border border-[#341547]/20 text-[#341547] py-3 px-6 rounded-lg font-plus-jakarta font-semibold hover:bg-[#341547]/5 active:scale-[0.98] transition-all"
                      >
                        Details
                      </button>
                    )}
                    {activeTab === 'reviews' && selectedReviewActions.some((action) => action.key === 'approve') && <button
                      onClick={() => selectedReviewActions.find((action) => action.key === 'approve')?.onSelect(selectedItem)}
                      disabled={actionLoading}
                      className="flex-1 bg-[#d4f4dd] text-[#1e4620] py-3 px-6 rounded-lg font-plus-jakarta font-semibold hover:bg-[#b8e6c3] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>}
                    {activeTab === 'reviews' && selectedReviewActions.some((action) => action.key === 'reject') && <button
                      onClick={() => selectedReviewActions.find((action) => action.key === 'reject')?.onSelect(selectedItem)}
                      disabled={actionLoading}
                      className="flex-1 bg-[#ffdad6] text-[#93000a] py-3 px-6 rounded-lg font-plus-jakarta font-semibold hover:bg-[#ffb4ab] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 shadow-[0_2px_8px_rgba(52,21,71,0.08)] text-center">
                  <p className="text-[#4b444d] font-manrope">
                    Select an item to moderate
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ReviewModal
        isOpen={!!detailReview}
        entity={detailReview}
        access={detailReview ? buildReviewAccess({ review: detailReview, viewer, context: REVIEW_CONTEXT.MODERATION }) : null}
        actions={detailReview ? buildReviewActions({
          review: detailReview,
          access: buildReviewAccess({ review: detailReview, viewer, context: REVIEW_CONTEXT.MODERATION }),
          handlers: {
            approve: () => handleReviewModalAction('approve', detailReview),
            reject: () => handleReviewModalAction('reject', detailReview),
          },
        }) : []}
        actionLoading={actionLoading}
        onClose={() => setDetailReview(null)}
      >
        <label className="mb-4 block text-sm font-semibold text-on-surface">
          Moderator notes
          <textarea value={moderatorNotes} onChange={(event) => setModeratorNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-outline-variant p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
        </label>
      </ReviewModal>

      <Footer />
    </div>
  );
};

export default ModeratorReviews;
