import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/product.ts';
import { PriceDisplay } from './PriceDisplay.tsx';
import { RatingStars } from './RatingStars.tsx';

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  compact?: boolean;
  titleTruncate?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  featured = false,
  compact = false,
  titleTruncate,
}) => {
  const navigate = useNavigate();

  // Primary image from the first color variant
  const primaryColor = product.variant_color?.[0];
  const imageUrl = primaryColor?.image_link || '';

  // Primary price from first size variant
  const primarySize = product.variant_size?.[0];
  const price = primarySize?.price || 0;
  const salePrice = primarySize?.sale_price;

  const isFlashSale = product.custom_label_0?.toLowerCase() === 'flashsale';

  const handleClick = () => {
    navigate(`/product/${product.item_group_id}`);
  };

  return (
    <div
      onClick={handleClick}
      id={`product-card-${product.item_group_id}`}
      className={`group bg-white rounded-2xl ${
        compact ? 'p-2 sm:p-2.5' : 'p-3.5'
      } border border-black/5 hover:border-black/15 transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.98] h-full ${
        featured ? 'col-span-2' : ''
      }`}
    >
      <div className="relative">
        {/* Flash Sale Badge if applicable */}
        {isFlashSale && (
          <div
            className={`absolute top-0 left-0 z-10 bg-red-600 text-white ${
              compact ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
            } font-semibold tracking-wide rounded-full uppercase shadow-xs`}
          >
            Sale
          </div>
        )}

        {/* Product Image */}
        <div
          className={`w-full aspect-square flex items-center justify-center ${
            compact ? 'p-1 mb-1.5' : 'p-2 mb-2'
          } bg-[#fbfbfd] rounded-xl overflow-hidden`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-xs text-gray-400">No Image</div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Brand or Category */}
          <div
            className={`${
              compact ? 'text-[9px] mb-0.5' : 'text-[11px] mb-0.5'
            } font-medium text-[#86868b] tracking-tight uppercase truncate`}
          >
            {product.product_type || product.brand}
          </div>

          {/* Title */}
          <h3
            className={`${
              compact ? 'text-[11px] leading-snug mb-1' : 'text-[13px] leading-tight mb-1.5'
            } font-medium text-[#1d1d1f] truncate group-hover:text-blue-600 transition-colors`}
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        <div>
          {/* Price */}
          <PriceDisplay price={price} salePrice={salePrice} size={compact ? 'sm' : 'md'} />

          {/* Rating left & Reviews right */}
          {!compact && product.rating && (
            <div className="mt-2 flex items-center justify-between">
              <RatingStars rating={product.rating} showReviews={false} />
              <span className="text-[#86868b] text-[11px]">
                {product.reviews?.count ?? product.rating.count ?? 0} reviews
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
