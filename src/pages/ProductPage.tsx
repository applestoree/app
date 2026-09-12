import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../services/products.ts';
import { Product } from '../types/product.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductCardSkeleton } from '../components/Skeleton.tsx';
import { FilterOverlay } from '../overlays/FilterOverlay.tsx';
import { Search, SlidersHorizontal, RefreshCw, AlertCircle, X } from 'lucide-react';

export const ProductPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [flashSaleOnly, setFlashSaleOnly] = useState(searchParams.get('flashsale') === 'true');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts(forceRefresh);
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load products.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Synchronize category param if URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
    if (searchParams.get('flashsale') === 'true') {
      setFlashSaleOnly(true);
    }
  }, [searchParams]);

  // Extract unique categories directly from API data's product_type
  const categories = useMemo((): string[] => {
    return Array.from(new Set(products.map((p) => p.product_type).filter((t): t is string => Boolean(t))));
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter: minimal search by title, product_type, brand
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchTitle = p.title?.toLowerCase().includes(query);
          const matchType = p.product_type?.toLowerCase().includes(query);
          const matchBrand = p.brand?.toLowerCase().includes(query);
          if (!matchTitle && !matchType && !matchBrand) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (p.product_type !== selectedCategory) {
            return false;
          }
        }

        // Flash sale filter
        if (flashSaleOnly) {
          if (p.custom_label_0?.toLowerCase() !== 'flashsale') {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const getPrice = (item: Product) => {
          const s = item.variant_size?.[0];
          if (!s) return 0;
          const hasValidSale =
            s.sale_price !== undefined &&
            s.sale_price !== null &&
            !isNaN(Number(s.sale_price)) &&
            Number(s.sale_price) > 0;
          return hasValidSale ? Number(s.sale_price) : (Number(s.price) || 0);
        };

        if (sortBy === 'price_asc') {
          return getPrice(a) - getPrice(b);
        }
        if (sortBy === 'price_desc') {
          return getPrice(b) - getPrice(a);
        }
        if (sortBy === 'name_asc') {
          return a.title.localeCompare(b.title);
        }
        return 0; // default featured
      });
  }, [products, searchTerm, selectedCategory, flashSaleOnly, sortBy]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSortBy('featured');
    setFlashSaleOnly(false);
    setSearchTerm('');
    setSearchParams({});
    setIsFilterOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      {/* 1. Search Bar & Filter Button */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-black/5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              id="product-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search iPhone, Mac, AirPods..."
              className="w-full bg-[#f5f5f7] rounded-full pl-9 pr-8 py-2 text-xs text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            id="filter-toggle-btn"
            onClick={() => setIsFilterOpen(true)}
            className={`p-2 rounded-full border transition-colors relative active:scale-95 ${
              selectedCategory !== 'all' || flashSaleOnly || sortBy !== 'featured'
                ? 'bg-blue-50 border-blue-200 text-[#0071e3]'
                : 'bg-[#f5f5f7] border-transparent text-[#1d1d1f] hover:bg-gray-200'
            }`}
            aria-label="Open filters"
          >
            <SlidersHorizontal size={16} />
            {(selectedCategory !== 'all' || flashSaleOnly || sortBy !== 'featured') && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#0071e3] rounded-full" />
            )}
          </button>
        </div>

        {/* 2. Category Filter Pill Row (dynamic from product_type) */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#1d1d1f] text-white font-medium shadow-xs'
                : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-200'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1d1d1f] text-white font-medium shadow-xs'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Loading / Error / Empty / Grid */}
      <div className="p-4 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-12">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">
              Unable to load products
            </h3>
            <p className="text-xs text-[#86868b] max-w-[260px] mb-6 leading-relaxed">
              {error}. Please try again.
            </p>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full hover:bg-[#0077ed] active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-12">
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">
              No matching products
            </h3>
            <p className="text-xs text-[#86868b] mb-6">
              Try changing your search term or active filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#1d1d1f] text-white text-xs font-medium rounded-full hover:bg-black transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center text-xs text-[#86868b] mb-3 px-1">
              <span>Showing {filteredProducts.length} items</span>
              {flashSaleOnly && (
                <span className="text-red-600 font-semibold text-[11px] uppercase">
                  Flash Sale Filter Active
                </span>
              )}
            </div>

            {/* 3. Product Grid */}
            <div id="product-grid" className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.item_group_id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Overlay */}
      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => handleCategoryClick(cat)}
        sortBy={sortBy}
        onSelectSort={(s) => setSortBy(s)}
        flashSaleOnly={flashSaleOnly}
        onToggleFlashSale={(f) => setFlashSaleOnly(f)}
        onReset={handleResetFilters}
      />
    </div>
  );
};
