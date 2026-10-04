import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import reviewService from '../services/reviewService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReviewModal from '../components/modals/ReviewModal';
import { useAuthStore } from '../store/useAuthStore';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import {
  buildUserReviewRestrictionAccess,
  UserReviewRestrictionSummary,
  USER_REVIEW_RESTRICTION_CONTEXT,
} from '../ui/entities/userReviewRestriction';
import { buildReviewAccess, ReviewSemanticViews, REVIEW_CONTEXT } from '../ui/entities/review';

export default function MyReviews() {
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const [reviews, setReviews] = useState([]);
  const [restriction, setRestriction] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const reviewAccess = (review) => buildReviewAccess({ review, viewer, context: REVIEW_CONTEXT.SELF });
  const restrictionAccess = (model) => buildUserReviewRestrictionAccess({
    restriction: model,
    viewer,
    context: USER_REVIEW_RESTRICTION_CONTEXT.SELF,
  });

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      const [reviewsResult, restrictionResult] = await Promise.allSettled([
        reviewService.getMyReviews(),
        user?.id ? reviewService.getRestriction(user.id) : Promise.resolve(null),
      ]);
      if (!active) return;
      if (reviewsResult.status === 'fulfilled') {
        setReviews((reviewsResult.value || [])
          .map((record) => adaptEntityFromNamedSource('adaptReviewSelfResponse', record))
          .filter((review) => reviewAccess(review).canRead));
      }
      if (restrictionResult.status === 'fulfilled' && restrictionResult.value) {
        const model = adaptEntityFromNamedSource('adaptUserReviewRestrictionResponse', restrictionResult.value);
        setRestriction(restrictionAccess(model).canRead ? model : null);
      }
      setLoading(false);
    };
    loadData();
    return () => { active = false; };
  }, [user?.id, viewer]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navbar />
      <main className="container mx-auto max-w-4xl flex-1 px-4 py-8">
        <header className="mb-8">
          <h1 className="font-noto-serif text-4xl font-bold text-primary">My Reviews</h1>
          <p className="mt-2 text-on-surface-variant">View your submitted reviews and moderation state.</p>
        </header>
        {restriction && <UserReviewRestrictionSummary restriction={restriction} access={restrictionAccess(restriction)} />}
        {loading ? (
          <div role="status" className="py-12 text-center text-on-surface-variant">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl bg-white py-12 text-center shadow-sm">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-40" />
            <p className="text-on-surface-variant">You haven&apos;t submitted any reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl bg-white p-6 shadow-sm">
                <ReviewSemanticViews.ReviewSummary entity={review} access={reviewAccess(review)} />
                <button type="button" onClick={() => setSelectedReview(review)} className="mt-4 min-h-11 rounded-lg border border-primary/20 px-4 text-sm font-bold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Details
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
      <ReviewModal entity={selectedReview} access={selectedReview ? reviewAccess(selectedReview) : null} isOpen={Boolean(selectedReview)} onClose={() => setSelectedReview(null)} />
      <Footer />
    </div>
  );
}
