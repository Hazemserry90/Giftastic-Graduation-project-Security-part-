import { useState } from 'react';
import { Star, X } from 'lucide-react';
import reviewService from '../services/reviewService';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';

const ReviewForm = ({ entityId, reviewType, orderId = null, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const mapped = commandDraftToPayload('reviewSubmission', createCommandDraft('reviewSubmission', {
        reviewType,
        entityId,
        rating,
        comment: comment.trim() || null,
        isAnonymous,
        orderId,
      }));
      if (!mapped.ok) {
        setError(Object.values(mapped.errors)[0]);
        return;
      }
      await reviewService.createReview(mapped.payload);

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoveredRating || rating);
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              isFilled
                ? 'fill-[#FFD700] text-[#FFD700]'
                : 'text-[#cec3ce]'
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(52,21,71,0.08)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-noto-serif text-xl font-semibold text-[#341547]">
          Write a Review
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[#4b444d] hover:text-[#341547] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block font-plus-jakarta font-semibold text-sm text-[#1b1c1a] mb-2">
            Rating *
          </label>
          <div className="flex items-center gap-2">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-2 font-manrope text-[#4b444d]">
                {rating} out of 5
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block font-plus-jakarta font-semibold text-sm text-[#1b1c1a] mb-2">
            Your Review (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-[#705a49] rounded-lg font-manrope text-[#1b1c1a] focus:outline-none focus:border-[#341547] focus:ring-2 focus:ring-[#341547]/20 transition-all"
            placeholder="Share your experience..."
          />
          <p className="mt-1 text-xs text-[#4b444d] font-manrope">
            Your review will be checked for inappropriate content before being published.
          </p>
        </div>

        {/* Anonymous option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-[#341547] border-[#705a49] rounded focus:ring-[#341547]"
          />
          <label htmlFor="anonymous" className="font-manrope text-sm text-[#1b1c1a]">
            Post anonymously
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-[#ffdad6] text-[#93000a] px-4 py-3 rounded-lg font-manrope text-sm">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#341547] text-white py-3 px-6 rounded-lg font-plus-jakarta font-semibold hover:bg-[#4b2c5e] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
