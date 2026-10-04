import { Star } from 'lucide-react';
import { formatDecimal } from '../ui/entities/shared/decimal';

const RatingDisplay = ({ rating, reviewCount, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className={`${sizeClasses[size]} fill-[#FFD700] text-[#FFD700]`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className={`${sizeClasses[size]} fill-[#FFD700] text-[#FFD700] opacity-50`} />
        );
      } else {
        stars.push(
          <Star key={i} className={`${sizeClasses[size]} text-[#cec3ce]`} />
        );
      }
    }
    return stars;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>
      <span className={`font-manrope text-[#4b444d] ${textSizeClasses[size]}`}>
        {formatDecimal(rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {reviewCount !== undefined && `(${reviewCount})`}
      </span>
    </div>
  );
};

export default RatingDisplay;
