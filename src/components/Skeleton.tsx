import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-black/5 flex flex-col justify-between animate-pulse">
      <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 pt-1" />
      </div>
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      <div className="w-full aspect-square bg-gray-100 rounded-3xl" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-7 bg-gray-100 rounded w-3/4" />
        <div className="h-5 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
};
