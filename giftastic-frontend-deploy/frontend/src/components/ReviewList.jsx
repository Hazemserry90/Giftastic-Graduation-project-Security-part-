import { useEffect, useState } from 'react';
import reviewService from '../services/reviewService';
import ReviewModal from './modals/ReviewModal';
import { useAuthStore } from '../store/useAuthStore';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildReviewAccess, ReviewSemanticViews, REVIEW_CONTEXT } from '../ui/entities/review';

export default function ReviewList({ entityId, reviewType }) {
  const viewer = useAuthStore((state) => state.viewer);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const getAccess = (review) => buildReviewAccess({ review, viewer, context: REVIEW_CONTEXT.PUBLIC });

  useEffect(() => {
    let active = true;
    setLoading(true);
    reviewService.getReviewsByEntity(entityId, reviewType)
      .then((data) => {
        if (active) setReviews((data || []).map((record) => adaptEntityFromNamedSource('adaptReviewPublicResponse', record)));
      })
      .catch(() => { if (active) setReviews([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entityId, reviewType]);

  if (loading) return <div role="status" className="py-8 text-center text-on-surface-variant">Loading reviews…</div>;
  const visible = reviews.filter((review) => getAccess(review).canRead);
  if (!visible.length) return <p className="py-8 text-center text-on-surface-variant">No reviews yet. Be the first to review.</p>;

  return (
    <section className="space-y-6" aria-labelledby={`reviews-${entityId}`}>
      <h3 id={`reviews-${entityId}`} className="font-noto-serif text-2xl font-semibold text-primary">Customer Reviews ({visible.length})</h3>
      <div className="space-y-4">
        {visible.map((review) => (
          <article key={review.id} className="rounded-xl bg-white p-6 shadow-sm">
            <ReviewSemanticViews.ReviewSummary entity={review} access={getAccess(review)} />
            <button type="button" onClick={() => setSelectedReview(review)} className="mt-4 min-h-11 rounded-lg border border-primary/20 px-4 text-sm font-bold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Details</button>
          </article>
        ))}
      </div>
      <ReviewModal entity={selectedReview} access={selectedReview ? getAccess(selectedReview) : null} isOpen={Boolean(selectedReview)} onClose={() => setSelectedReview(null)} />
    </section>
  );
}
