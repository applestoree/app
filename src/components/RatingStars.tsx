import React from 'react';
import { Star } from 'lucide-react';
import { ProductRating, ProductReviews } from '../types/product.ts';

interface RatingStarsProps {
  rating?: ProductRating;
  reviews?: ProductReviews;
  showReviews?: boolean;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviews,
  showReviews = true,
  size = 13,
}) => {
  if (!rating) return null;

  const average = rating.average || 0;
  const count = rating.count ?? reviews?.count ?? 0;

  return (
    <div className="flex items-center gap-1 text-[#86868b] text-xs">
      <div className="flex items-center text-amber-500">
        <Star
          size={size}
          className={average > 0 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      </div>
      <span className="font-medium text-[#1d1d1f] text-xs">
        {average.toFixed(1)}
      </span>
      {showReviews && (
        <span className="text-[#86868b] text-[11px]">
          ({count})
        </span>
      )}
    </div>
  );
};
