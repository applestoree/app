import React from 'react';

interface PriceDisplayProps {
  price?: number | null;
  salePrice?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price = 0,
  salePrice,
  size = 'md',
  className = '',
}) => {
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  const safeSalePrice =
    salePrice !== undefined && salePrice !== null && !isNaN(Number(salePrice))
      ? Number(salePrice)
      : undefined;

  const hasSale =
    safeSalePrice !== undefined && safeSalePrice > 0 && safeSalePrice < safePrice;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
    xl: 'text-xl font-bold',
  };

  return (
    <div className={`flex items-baseline gap-2 flex-wrap ${className}`}>
      {hasSale ? (
        <>
          <span className={`${sizeClasses[size]} font-semibold text-[#1d1d1f]`}>
            RM{safeSalePrice.toLocaleString()}
          </span>
          <span className="text-xs text-[#86868b] line-through font-normal">
            RM{safePrice.toLocaleString()}
          </span>
        </>
      ) : (
        <span className={`${sizeClasses[size]} font-semibold text-[#1d1d1f]`}>
          RM{safePrice.toLocaleString()}
        </span>
      )}
    </div>
  );
};
