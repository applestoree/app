import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../services/products.ts';
import { Product } from '../types/product.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductCardSkeleton } from '../components/Skeleton.tsx';
import { Flame, ChevronRight, RefreshCw, AlertCircle, Sparkles, ShieldCheck, Truck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Extract categories dynamically from API product_type
  const categories: string[] = Array.from(
    new Set(products.map((p) => p.product_type).filter((t): t is string => Boolean(t)))
  );

  // Flash sale products: custom_label_0 === "flashsale" from API
  const flashSaleProducts = products.filter(
    (p) => p.custom_label_0?.toLowerCase() === 'flashsale'
  );

  // Recommended products (products not in flash sale or primary highlights)
  const recommendedProducts = products.filter(
    (p) => p.custom_label_0?.toLowerCase() !== 'flashsale'
  );

  // Hero featured product: first product or first flash sale
  const heroProduct = flashSaleProducts[0] || products[0];

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        {/* Hero skeleton */}
        <div className="w-full h-56 bg-gray-200/80 rounded-3xl animate-pulse" />
        {/* Category skeleton */}
        <div className="flex gap-2 overflow-x-auto py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-10 bg-gray-200 rounded-full flex-shrink-0 animate-pulse" />
          ))}
        </div>
        {/* Flash Sale skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">
          Unable to load products
        </h3>
        <p className="text-xs text-[#86868b] max-w-[260px] mb-6 leading-relaxed">
          {error}. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => loadData(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full hover:bg-[#0077ed] active:scale-95 transition-all shadow-xs"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
        <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">
          No Products Found
        </h3>
        <p className="text-xs text-[#86868b] mb-4">
          There are currently no products available in the catalog.
        </p>
        <button
          type="button"
          onClick={() => loadData(true)}
          className="px-5 py-2.5 bg-[#1d1d1f] text-white text-xs font-medium rounded-full"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8 space-y-6">
      {/* 1. Hero / Welcome Banner */}
      <section className="px-4 pt-3">
        <div
          onClick={() => heroProduct && navigate(`/product/${heroProduct.item_group_id}`)}
          className="relative bg-black text-white rounded-3xl p-6 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-lg"
        >
          <div className="relative z-10 max-w-[260px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-medium text-white/90 mb-3">
              <Sparkles size={11} className="text-amber-300" />
              <span>Apple Store Malaysia</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2">
              {heroProduct?.title || 'Apple Store Online'}
            </h2>
            <p className="text-xs text-white/70 line-clamp-2 mb-4 leading-relaxed">
              {heroProduct?.description || 'The best way to buy the products you love.'}
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#2997ff] hover:text-[#52aeff]">
              <span>Explore Now</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Hero product image background preview */}
          {heroProduct?.variant_color?.[0]?.image_link && (
            <div className="absolute -right-8 -bottom-8 w-44 h-44 opacity-85 pointer-events-none">
              <img
                src={heroProduct.variant_color[0].image_link}
                alt={heroProduct.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Apple Value Props Bar */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-[#1d1d1f]">
          <div className="bg-white border border-black/5 rounded-2xl p-2.5 flex items-center gap-2">
            <Truck size={16} className="text-[#0071e3] flex-shrink-0" />
            <div>
              <div className="font-semibold leading-tight">Free Delivery</div>
              <div className="text-[10px] text-[#86868b]">All over Malaysia</div>
            </div>
          </div>
          <div className="bg-white border border-black/5 rounded-2xl p-2.5 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#0071e3] flex-shrink-0" />
            <div>
              <div className="font-semibold leading-tight">Official Apple</div>
              <div className="text-[10px] text-[#86868b]">100% Genuine Warranty</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Section (Dynamic from API product_type) */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">Categories</h3>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="text-xs font-medium text-[#0071e3] hover:text-[#0077ed] flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
          {categories.map((category) => {
            // Pick first product from this category for thumbnail
            const catProduct = products.find((p) => p.product_type === category);
            const thumb = catProduct?.variant_color?.[0]?.image_link;

            return (
              <button
                key={category}
                type="button"
                onClick={() => navigate(`/products?category=${encodeURIComponent(category)}`)}
                className="flex-shrink-0 bg-white border border-black/5 rounded-2xl p-2.5 flex flex-col items-center gap-2 min-w-[90px] max-w-[105px] hover:border-black/15 transition-all active:scale-95 text-center"
              >
                <div className="w-12 h-12 bg-[#fbfbfd] rounded-xl p-1 flex items-center justify-center overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={category}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">Apple</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#1d1d1f] truncate w-full">
                  {category}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. FlashSale Section (custom_label_0 === "flashsale") */}
      {flashSaleProducts.length > 0 && (
        <section className="px-4">
          <div className="bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent p-3.5 rounded-3xl border border-red-500/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <Flame size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight flex items-center gap-1.5">
                    Flash Sale
                    <span className="text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Limited
                    </span>
                  </h3>
                  <p className="text-[10px] text-red-700">Special promotional prices direct from Apple</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/products?flashsale=true')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div
              id="flashsale-products-scroll"
              className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory"
            >
              {flashSaleProducts.map((product) => (
                <div
                  key={product.item_group_id}
                  className="w-[calc((100%-16px)/3)] min-w-[110px] flex-shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} compact titleTruncate={true} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. RecommendedProduct Section */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">
              Recommended Products
            </h3>
            <p className="text-[10px] text-[#86868b]">Curated devices and accessories</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="text-xs font-medium text-[#0071e3] hover:text-[#0077ed] flex items-center gap-0.5"
          >
            <span>All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {recommendedProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.item_group_id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};
