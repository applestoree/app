import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../services/products.ts';
import { Product, ProductColor, ProductSize } from '../types/product.ts';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { PriceDisplay } from '../components/PriceDisplay.tsx';
import { RatingStars } from '../components/RatingStars.tsx';
import { DetailSkeleton } from '../components/Skeleton.tsx';
import { VariantSelector } from '../overlays/VariantSelector.tsx';
import { useCart } from '../context/CartContext.tsx';
import { isIWatchProduct, formatIWatchColor, parseIWatchColorParts } from '../utils/colorFormatter.ts';
import {
  ShoppingBag,
  Share2,
  Check,
  Truck,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const DetailProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, totalItems, openCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected variants
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant selector overlay state
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [variantSheetMode, setVariantSheetMode] = useState<'cart' | 'buy' | 'both'>('cart');
  const [addedToast, setAddedToast] = useState(false);

  const isWatch = useMemo(() => {
    return isIWatchProduct(product?.product_type, product?.title);
  }, [product?.product_type, product?.title]);

  const loadProduct = async (forceRefresh = false) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProductById(id, forceRefresh);
      if (!data) {
        throw new Error(`Product with ID "${id}" was not found.`);
      }
      setProduct(data);
      if (data.variant_color?.length > 0) {
        const isWatchProduct = isIWatchProduct(data.product_type, data.title);
        const firstCol = data.variant_color[0];
        setSelectedColor({
          ...firstCol,
          color: isWatchProduct ? formatIWatchColor(firstCol.color) : firstCol.color,
        });
      }
      if (data.variant_size?.length > 0) {
        setSelectedSize(data.variant_size[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load product details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  // Handle color change and reset image index
  const handleSelectColor = (col: ProductColor) => {
    setSelectedColor({
      ...col,
      color: isWatch ? formatIWatchColor(col.color) : col.color,
    });
    setActiveImageIndex(0);
  };

  // For iWatch: extract unique Case and Strap options, plus handlers to select each individually
  const watchOptions = useMemo(() => {
    if (!isWatch || !product?.variant_color?.length) {
      return { cases: [] as string[], straps: [] as string[], combinations: new Map<string, ProductColor>() };
    }
    const caseSet = new Set<string>();
    const strapSet = new Set<string>();
    const comboMap = new Map<string, ProductColor>();

    product.variant_color.forEach((col) => {
      const parts = parseIWatchColorParts(col.color);
      caseSet.add(parts.caseColor);
      strapSet.add(parts.strapColor);
      comboMap.set(`${parts.caseColor.toLowerCase()}__${parts.strapColor.toLowerCase()}`, col);
    });

    return {
      cases: Array.from(caseSet),
      straps: Array.from(strapSet),
      combinations: comboMap,
    };
  }, [isWatch, product?.variant_color]);

  const currentWatchParts = useMemo(() => {
    if (!isWatch || !selectedColor) return { caseColor: '', strapColor: '' };
    return parseIWatchColorParts(selectedColor.color);
  }, [isWatch, selectedColor]);

  // Handle selecting Case specifically for iWatch
  const handleSelectCase = (newCase: string) => {
    if (!product?.variant_color?.length) return;
    const currentStrap = currentWatchParts.strapColor;

    // 1. Try exact match with current strap
    const exactMatch = watchOptions.combinations.get(`${newCase.toLowerCase()}__${currentStrap.toLowerCase()}`);
    if (exactMatch) {
      handleSelectColor(exactMatch);
      return;
    }

    // 2. Find any variant with this case
    const matchCase = product.variant_color.find((col) => {
      const p = parseIWatchColorParts(col.color);
      return p.caseColor.toLowerCase() === newCase.toLowerCase();
    });
    if (matchCase) {
      handleSelectColor(matchCase);
    }
  };

  // Handle selecting Strap specifically for iWatch
  const handleSelectStrap = (newStrap: string) => {
    if (!product?.variant_color?.length) return;
    const currentCase = currentWatchParts.caseColor;

    // 1. Try exact match with current case
    const exactMatch = watchOptions.combinations.get(`${currentCase.toLowerCase()}__${newStrap.toLowerCase()}`);
    if (exactMatch) {
      handleSelectColor(exactMatch);
      return;
    }

    // 2. Find any variant with this strap
    const matchStrap = product.variant_color.find((col) => {
      const p = parseIWatchColorParts(col.color);
      return p.strapColor.toLowerCase() === newStrap.toLowerCase();
    });
    if (matchStrap) {
      handleSelectColor(matchStrap);
    }
  };

  // Compile all images for selected color
  const allImages = useMemo(() => {
    if (!selectedColor) return [];
    const images: string[] = [];
    if (selectedColor.image_link) {
      images.push(selectedColor.image_link);
    }
    if (Array.isArray(selectedColor.additional_image_link)) {
      images.push(...selectedColor.additional_image_link.filter(Boolean));
    }
    return images;
  }, [selectedColor]);

  const currentPrice = selectedSize?.price || product?.variant_size?.[0]?.price || 0;
  const rawSalePrice = selectedSize?.sale_price ?? product?.variant_size?.[0]?.sale_price;
  const currentSalePrice =
    rawSalePrice !== null && rawSalePrice !== undefined && !isNaN(Number(rawSalePrice))
      ? Number(rawSalePrice)
      : undefined;

  const handleAddToCart = () => {
    setVariantSheetMode('cart');
    setIsVariantSheetOpen(true);
  };

  const handleBuyNow = () => {
    setVariantSheetMode('buy');
    setIsVariantSheetOpen(true);
  };

  const handleVariantConfirm = (
    color: ProductColor,
    size: ProductSize,
    quantity: number,
    action: 'cart' | 'buy'
  ) => {
    if (!product) return;
    setSelectedColor(color);
    setSelectedSize(size);
    addToCart(product, color, size, quantity);

    if (action === 'buy') {
      navigate('/checkout');
    } else {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <StandalonePage title="Loading Product...">
        <DetailSkeleton />
      </StandalonePage>
    );
  }

  if (error || !product) {
    return (
      <StandalonePage title="Product Error">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">
            {error || 'Product Not Found'}
          </h3>
          <p className="text-xs text-[#86868b] max-w-[260px] mb-6">
            We couldn't retrieve the requested product from the Apple Store catalog.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadProduct(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] text-white text-xs font-semibold rounded-full hover:bg-[#0077ed]"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 bg-gray-100 text-[#1d1d1f] text-xs font-medium rounded-full hover:bg-gray-200"
            >
              Browse Products
            </button>
          </div>
        </div>
      </StandalonePage>
    );
  }

  const isFlashSale = product.custom_label_0?.toLowerCase() === 'flashsale';

  return (
    <StandalonePage
      title={product.title}
      rightAction={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Share product"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={openCart}
            className="p-2 text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-colors relative"
            aria-label="View bag"
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      }
      footer={
        <div
          id="bottom-action-bar"
          className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 flex items-center gap-3 select-none shrink-0"
        >
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-medium text-[#86868b] tracking-wider">
              Total
            </span>
            <PriceDisplay price={currentPrice} salePrice={currentSalePrice} size="lg" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              className="px-4 py-2.5 rounded-xl border border-[#1d1d1f] text-[#1d1d1f] text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all"
            >
              Add to Bag
            </button>
            <button
              type="button"
              id="buy-now-btn"
              onClick={handleBuyNow}
              className="px-5 py-2.5 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] active:scale-95 transition-all shadow-xs"
            >
              Buy Now
            </button>
          </div>
        </div>
      }
    >
      <div className="flex-1 pb-6 space-y-5">
        {/* Added to Bag Floating Notification */}
        {addedToast && (
          <div className="sticky top-2 z-40 mx-4 bg-[#1d1d1f] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Added to your Bag</span>
            </div>
            <button
              type="button"
              onClick={openCart}
              className="text-xs text-[#2997ff] font-semibold hover:underline"
            >
              View Bag
            </button>
          </div>
        )}

        {/* 1. Product Image Gallery */}
        <section id="product-gallery-section" className="bg-white border-b border-black/5 w-full">
          {/* Main Selected Image */}
          <div
            id="product-main-image-container"
            className="relative w-full aspect-square bg-[#fbfbfd] flex items-center justify-center overflow-hidden"
          >
            {isFlashSale && (
              <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full shadow-xs">
                Flash Sale
              </div>
            )}
            {allImages.length > 0 ? (
              <img
                id="product-main-image"
                src={allImages[activeImageIndex] || allImages[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply transition-all duration-300"
              />
            ) : (
              <div className="text-xs text-gray-400">No Image Available</div>
            )}
          </div>

          {/* Multiple image thumbnails if available */}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-2 py-3 px-4 overflow-x-auto">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl border p-1 bg-[#fbfbfd] overflow-hidden transition-all flex-shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#0071e3] ring-1 ring-[#0071e3]'
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2. Product Info, Price & Variant Selectors (Combined Section) */}
        <section className="w-full -mt-2.5">
          <div className="p-4 bg-white border-y sm:border-x border-black/5 rounded-t-2xl sm:rounded-2xl sm:mx-2 space-y-4">
            {/* Title, Brand, Availability */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#86868b] uppercase tracking-wider mb-1">
                <span>{product.brand} • {product.product_type}</span>
                <span className={`font-semibold capitalize ${
                  product.availability?.toLowerCase().includes('stock') ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {product.availability}
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight leading-snug">
                {product.title}
              </h1>
              {product.headline && (
                <p className="text-xs font-medium text-[#0071e3] mt-0.5">
                  {product.headline}
                </p>
              )}
            </div>

            {/* Rating & Reviews */}
            {product.rating && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <RatingStars rating={product.rating} reviews={product.reviews} size={15} />
                <span className="text-[11px] text-gray-400">|</span>
                <span className="text-xs text-gray-500 capitalize">{product.condition} condition</span>
              </div>
            )}

            {/* Price Block */}
            <div className="p-3 bg-[#fbfbfd] border border-black/5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                  Price
                </div>
                <PriceDisplay price={currentPrice} salePrice={currentSalePrice} size="xl" />
              </div>
              {isFlashSale && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md uppercase">
                    Save on Promo
                  </span>
                </div>
              )}
            </div>

            {/* Quick BottomSheet Variant Trigger */}
            <button
              type="button"
              id="open-variant-bottomsheet-btn"
              onClick={() => {
                setVariantSheetMode('both');
                setIsVariantSheetOpen(true);
              }}
              className="w-full flex items-center justify-between p-3.5 bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-[0.99] rounded-2xl border border-black/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-black/5 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  {selectedColor?.image_link || allImages[0] ? (
                    <img
                      src={selectedColor?.image_link || allImages[0]}
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#0071e3]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                    <span>Pilih Varian</span>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span className="text-[#0071e3]">BottomSheet</span>
                  </div>
                  <div className="text-xs font-semibold text-[#1d1d1f] mt-0.5 truncate">
                    {selectedColor?.color || 'Pilih Warna'} • {selectedSize?.size || 'Pilih Ukuran'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#0071e3] text-xs font-semibold shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                <span>Pilih</span>
                <ChevronRight size={16} />
              </div>
            </button>

            {/* Variant Color Picker */}
            {product.variant_color && product.variant_color.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-4">
                {isWatch ? (
                  <>
                    {/* Case Selector */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[#1d1d1f] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
                          Case
                        </span>
                        <span className="text-[#0071e3] font-semibold">{currentWatchParts.caseColor}</span>
                      </div>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
                        {watchOptions.cases.map((caseName) => {
                          const isSelected = currentWatchParts.caseColor.toLowerCase() === caseName.toLowerCase();
                          const caseVariant = product.variant_color.find((col) => {
                            const p = parseIWatchColorParts(col.color);
                            return p.caseColor.toLowerCase() === caseName.toLowerCase();
                          });

                          return (
                            <div
                              key={`case-${caseName}`}
                              className="flex-shrink-0 snap-start flex flex-col items-center w-20"
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectCase(caseName)}
                                className={`w-20 h-20 aspect-square rounded-2xl border flex items-center justify-center transition-all relative p-2 ${
                                  isSelected
                                    ? 'border-[#0071e3] bg-blue-50/40 ring-2 ring-[#0071e3]/30 shadow-xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                                title={`Case ${caseName}`}
                              >
                                {caseVariant?.image_link ? (
                                  <img
                                    src={caseVariant.image_link}
                                    alt={caseName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-400" />
                                )}
                              </button>
                              <span
                                className={`text-[11px] truncate w-full text-center mt-1.5 leading-tight ${
                                  isSelected ? 'text-[#0071e3] font-semibold' : 'text-[#1d1d1f] font-medium'
                                }`}
                                title={`Case ${caseName}`}
                              >
                                Case {caseName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Strap Selector */}
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[#1d1d1f] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
                          Strap
                        </span>
                        <span className="text-[#0071e3] font-semibold">{currentWatchParts.strapColor}</span>
                      </div>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
                        {watchOptions.straps.map((strapName) => {
                          const isSelected = currentWatchParts.strapColor.toLowerCase() === strapName.toLowerCase();
                          const matchingVariant =
                            watchOptions.combinations.get(
                              `${currentWatchParts.caseColor.toLowerCase()}__${strapName.toLowerCase()}`
                            ) ||
                            product.variant_color.find((col) => {
                              const p = parseIWatchColorParts(col.color);
                              return p.strapColor.toLowerCase() === strapName.toLowerCase();
                            });

                          return (
                            <div
                              key={`strap-${strapName}`}
                              className="flex-shrink-0 snap-start flex flex-col items-center w-20"
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectStrap(strapName)}
                                className={`w-20 h-20 aspect-square rounded-2xl border flex items-center justify-center transition-all relative p-2 ${
                                  isSelected
                                    ? 'border-[#0071e3] bg-blue-50/40 ring-2 ring-[#0071e3]/30 shadow-xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                                title={`Strap ${strapName}`}
                              >
                                {matchingVariant?.image_link ? (
                                  <img
                                    src={matchingVariant.image_link}
                                    alt={strapName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-300" />
                                )}
                              </button>
                              <span
                                className={`text-[11px] truncate w-full text-center mt-1.5 leading-tight ${
                                  isSelected ? 'text-[#0071e3] font-semibold' : 'text-[#1d1d1f] font-medium'
                                }`}
                                title={`Strap ${strapName}`}
                              >
                                Strap {strapName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#1d1d1f]">Color</span>
                      <span className="text-[#86868b] font-medium text-right truncate max-w-[240px]">
                        {selectedColor?.color || ''}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
                      {product.variant_color.map((col, idx) => {
                        const isSelected = selectedColor?.color === col.color;
                        return (
                          <div
                            key={`${col.color}-${idx}`}
                            className="flex-shrink-0 snap-start flex flex-col items-center w-20"
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectColor(col)}
                              className={`w-20 h-20 aspect-square rounded-2xl border flex items-center justify-center transition-all relative p-2 ${
                                isSelected
                                  ? 'border-[#0071e3] bg-blue-50/40 ring-2 ring-[#0071e3]/30 shadow-xs'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                              title={col.color}
                            >
                              {col.image_link ? (
                                <img
                                  src={col.image_link}
                                  alt={col.color}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-400" />
                              )}
                            </button>
                            <span
                              className={`text-[11px] truncate w-full text-center mt-1.5 leading-tight ${
                                isSelected ? 'text-[#0071e3] font-semibold' : 'text-[#1d1d1f] font-medium'
                              }`}
                              title={col.color}
                            >
                              {col.color}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Variant Size / Capacity / Specs Picker */}
            {product.variant_size && product.variant_size.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#1d1d1f]">Size</span>
                  <span className="text-[#86868b]">{selectedSize?.size}</span>
                </div>
                {/* Horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
                  {product.variant_size.map((sz, idx) => {
                    const isSelected = selectedSize?.size === sz.size;
                    const hasValidSale =
                      sz.sale_price !== undefined &&
                      sz.sale_price !== null &&
                      !isNaN(Number(sz.sale_price)) &&
                      Number(sz.sale_price) > 0;
                    const priceToShow = hasValidSale ? Number(sz.sale_price) : (Number(sz.price) || 0);
                    return (
                      <button
                        key={`${sz.size}-${idx}`}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`flex-shrink-0 snap-start min-w-[86px] px-3 py-2.5 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                          isSelected
                            ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] ring-1 ring-[#0071e3]/30 font-semibold'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-[#1d1d1f]'
                        }`}
                        title={`${sz.size} - RM${priceToShow.toLocaleString()}`}
                      >
                        <div className="flex items-center justify-center w-full">
                          <span className="text-xs font-semibold truncate leading-tight">{sz.size}</span>
                        </div>
                        <div
                          className={`text-[10px] mt-1 truncate font-medium w-full text-center ${
                            isSelected ? 'text-[#0071e3]' : 'text-[#86868b]'
                          }`}
                        >
                          RM{priceToShow.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. Product Description */}
        <section className="px-4">
          <div className="p-4 bg-white border border-black/5 rounded-2xl space-y-2">
            <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              Overview
            </h3>
            <p className="text-xs text-[#424245] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </section>

        {/* 6. Main Features */}
        {product.main_features && product.main_features.length > 0 && (
          <section className="px-4">
            <div className="p-4 bg-white border border-black/5 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#0071e3]" />
                <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
                  Key Highlights
                </h3>
              </div>
              <ul className="space-y-2">
                {product.main_features.map((feat, idx) => (
                  <li key={idx} className="text-xs text-[#1d1d1f] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] mt-1.5 flex-shrink-0" />
                    <span className="leading-normal">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 7. Sub Features */}
        {product.sub_features && product.sub_features.length > 0 && (
          <section className="px-4">
            <div className="p-4 bg-white border border-black/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
                Additional Features
              </h3>
              <ul className="space-y-1.5">
                {product.sub_features.map((sub, idx) => (
                  <li key={idx} className="text-xs text-[#424245] flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    <span className="leading-normal">{sub}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 8. Delivery & Apple Protection Perks */}
        <section className="px-4 space-y-2 text-xs text-[#1d1d1f]">
          <div className="p-3.5 bg-white border border-black/5 rounded-2xl flex items-center gap-3">
            <Truck size={18} className="text-[#0071e3] flex-shrink-0" />
            <div>
              <div className="font-semibold">Fast, Free Delivery</div>
              <div className="text-[11px] text-[#86868b]">
                Or pickup today at Apple The Exchange TRX.
              </div>
            </div>
          </div>
          <div className="p-3.5 bg-white border border-black/5 rounded-2xl flex items-center gap-3">
            <ShieldCheck size={18} className="text-[#0071e3] flex-shrink-0" />
            <div>
              <div className="font-semibold">Apple Malaysia Official 1-Year Warranty</div>
              <div className="text-[11px] text-[#86868b]">
                AppleCare+ available upon device activation.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Variant Selector BottomSheet Overlay */}
      {product && (
        <VariantSelector
          isOpen={isVariantSheetOpen}
          onClose={() => setIsVariantSheetOpen(false)}
          product={product}
          initialColor={selectedColor || undefined}
          initialSize={selectedSize || undefined}
          onConfirm={handleVariantConfirm}
          onVariantChange={(color, size) => {
            setSelectedColor(color);
            setSelectedSize(size);
          }}
          mode={variantSheetMode}
        />
      )}
    </StandalonePage>
  );
};
