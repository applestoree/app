import React from 'react';
import { BottomSheet } from './BottomSheet.tsx';
import { Check } from 'lucide-react';

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: string;
  onSelectSort: (sort: string) => void;
  flashSaleOnly: boolean;
  onToggleFlashSale: (val: boolean) => void;
  onReset: () => void;
}

export const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSelectSort,
  flashSaleOnly,
  onToggleFlashSale,
  onReset,
}) => {
  const sortOptions = [
    { id: 'featured', label: 'Featured' },
    { id: 'price_asc', label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' },
    { id: 'name_asc', label: 'Name: A to Z' },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter & Sort" id="filter-overlay">
      <div className="space-y-6 pb-2">
        {/* Categories */}
        <div>
          <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider mb-2.5">
            Category
          </h4>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#1d1d1f] text-white font-medium'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-200'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#1d1d1f] text-white font-medium'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider mb-2.5">
            Sort By
          </h4>
          <div className="space-y-1">
            {sortOptions.map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectSort(opt.id)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-blue-50/70 text-[#0071e3] font-semibold' : 'text-[#1d1d1f] hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} className="text-[#0071e3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flash Sale Switch */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#1d1d1f]">Flash Sale Only</div>
            <div className="text-[11px] text-gray-500">Show exclusive limited-time deals</div>
          </div>
          <button
            type="button"
            onClick={() => onToggleFlashSale(!flashSaleOnly)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              flashSaleOnly ? 'bg-[#0071e3]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                flashSaleOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onReset}
            className="py-2.5 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
