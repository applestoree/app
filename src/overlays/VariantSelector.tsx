import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductColor, ProductSize } from '../types/product.ts';
import { BottomSheet } from './BottomSheet.tsx';
import { PriceDisplay } from '../components/PriceDisplay.tsx';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { isIWatchProduct, formatIWatchColor, parseIWatchColorParts } from '../utils/colorFormatter.ts';

interface VariantSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialColor?: ProductColor;
  initialSize?: ProductSize;
  onConfirm: (color: ProductColor, size: ProductSize, quantity: number, action: 'cart' | 'buy') => void;
  onVariantChange?: (color: ProductColor, size: ProductSize) => void;
  mode?: 'cart' | 'buy' | 'both';
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  isOpen,
  onClose,
  product,
  initialColor,
  initialSize,
  onConfirm,
  onVariantChange,
  mode = 'cart',
}) => {
  const isWatch = isIWatchProduct(product.product_type, product.title);

  const [selectedColor, setSelectedColor] = useState<ProductColor>(() => {
    const raw = initialColor || product.variant_color?.[0] || { color: 'Standard', image_link: '' };
    return {
      ...raw,
      color: isWatch ? formatIWatchColor(raw.color) : raw.color,
    };
  });

  const [selectedSize, setSelectedSize] = useState<ProductSize>(
    initialSize || product.variant_size?.[0] || { size: 'Standard', price: 0 }
  );

  const [quantity, setQuantity] = useState(1);

  // Sync state whenever the BottomSheet is opened
  useEffect(() => {
    if (isOpen) {
      if (initialColor) {
        setSelectedColor({
          ...initialColor,
          color: isWatch ? formatIWatchColor(initialColor.color) : initialColor.color,
        });
      }
      if (initialSize) {
        setSelectedSize(initialSize);
      }
      setQuantity(1);
    }
  }, [isOpen, initialColor, initialSize, isWatch]);

  const activeImage = selectedColor.image_link || product.variant_color?.[0]?.image_link;
  const currentPrice = selectedSize.price || 0;
  const currentSalePrice =
    selectedSize.sale_price !== null &&
    selectedSize.sale_price !== undefined &&
    !isNaN(Number(selectedSize.sale_price))
      ? Number(selectedSize.sale_price)
      : undefined;

  const handleAction = (actionType: 'cart' | 'buy') => {
    const finalColor = {
      ...selectedColor,
      color: isWatch ? formatIWatchColor(selectedColor.color) : selectedColor.color,
    };
    onConfirm(finalColor, selectedSize, quantity, actionType);
    onClose();
  };

  const handleColorChange = (col: ProductColor) => {
    const formatted = {
      ...col,
      color: isWatch ? formatIWatchColor(col.color) : col.color,
    };
    setSelectedColor(formatted);
    onVariantChange?.(formatted, selectedSize);
  };

  const handleSizeChange = (sz: ProductSize) => {
    setSelectedSize(sz);
    onVariantChange?.(selectedColor, sz);
  };

  const formattedSelectedColor = isWatch ? formatIWatchColor(selectedColor.color) : selectedColor.color;

  // Extract unique cases & straps for iWatch
  const watchOptions = useMemo(() => {
    if (!isWatch || !product.variant_color?.length) {
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
  }, [isWatch, product.variant_color]);

  const currentWatchParts = useMemo(() => {
    if (!isWatch || !selectedColor) return { caseColor: '', strapColor: '' };
    return parseIWatchColorParts(selectedColor.color);
  }, [isWatch, selectedColor]);

  const handleSelectCase = (newCase: string) => {
    if (!product.variant_color?.length) return;
    const currentStrap = currentWatchParts.strapColor;
    const exactMatch = watchOptions.combinations.get(`${newCase.toLowerCase()}__${currentStrap.toLowerCase()}`);
    if (exactMatch) {
      const updated = { ...exactMatch, color: formatIWatchColor(exactMatch.color) };
      setSelectedColor(updated);
      onVariantChange?.(updated, selectedSize);
      return;
    }
    const matchCase = product.variant_color.find((col) => {
      const p = parseIWatchColorParts(col.color);
      return p.caseColor.toLowerCase() === newCase.toLowerCase();
    });
    if (matchCase) {
      const updated = { ...matchCase, color: formatIWatchColor(matchCase.color) };
      setSelectedColor(updated);
      onVariantChange?.(updated, selectedSize);
    }
  };

  const handleSelectStrap = (newStrap: string) => {
    if (!product.variant_color?.length) return;
    const currentCase = currentWatchParts.caseColor;
    const exactMatch = watchOptions.combinations.get(`${currentCase.toLowerCase()}__${newStrap.toLowerCase()}`);
    if (exactMatch) {
      const updated = { ...exactMatch, color: formatIWatchColor(exactMatch.color) };
      setSelectedColor(updated);
      onVariantChange?.(updated, selectedSize);
      return;
    }
    const matchStrap = product.variant_color.find((col) => {
      const p = parseIWatchColorParts(col.color);
      return p.strapColor.toLowerCase() === newStrap.toLowerCase();
    });
    if (matchStrap) {
      const updated = { ...matchStrap, color: formatIWatchColor(matchStrap.color) };
      setSelectedColor(updated);
      onVariantChange?.(updated, selectedSize);
    }
  };

  const effectiveUnitPrice = currentSalePrice ?? currentPrice;
  const totalPrice = effectiveUnitPrice * quantity;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pilih Varian" id="variant-selector-sheet">
      <div className="space-y-5 pb-2">
        {/* Product summary snippet */}
        <div className="flex gap-4 items-center pb-4 border-b border-gray-100">
          <div className="w-20 h-20 bg-[#fbfbfd] rounded-2xl border border-black/5 p-2 flex items-center justify-center flex-shrink-0">
            {activeImage && (
              <img
                src={activeImage}
                alt={formattedSelectedColor}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#1d1d1f] truncate">
              {product.title}
            </h4>
            <div className="mt-1">
              <PriceDisplay price={currentPrice} salePrice={currentSalePrice} size="lg" />
            </div>
            <div className="text-[11px] text-[#86868b] mt-0.5 truncate">
              Pilihan: <span className="text-[#1d1d1f] font-medium">{formattedSelectedColor}</span> • <span className="text-[#1d1d1f] font-medium">{selectedSize.size}</span>
            </div>
          </div>
        </div>

        {/* Color Selection */}
        {product.variant_color && product.variant_color.length > 0 && (
          <div className="space-y-4">
            {isWatch ? (
              <>
                {/* 1. Case Selector */}
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
                          key={`modal-case-${caseName}`}
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
                            title={caseName}
                          >
                            {caseName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Strap Selector */}
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
                          key={`modal-strap-${strapName}`}
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
                            title={strapName}
                          >
                            {strapName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="text-xs font-semibold text-[#1d1d1f] mb-2 flex items-center justify-between">
                  <span>Color</span>
                  <span className="text-gray-500 font-normal max-w-[200px] truncate">{formattedSelectedColor}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
                  {product.variant_color.map((col, idx) => {
                    const isSelected = selectedColor.color === col.color;
                    return (
                      <div
                        key={`${col.color}-${idx}`}
                        className="flex-shrink-0 snap-start flex flex-col items-center w-20"
                      >
                        <button
                          type="button"
                          onClick={() => handleColorChange(col)}
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
              </div>
            )}
          </div>
        )}

        {/* Size / Capacity / Variant Selection */}
        {product.variant_size && product.variant_size.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#1d1d1f] mb-2 flex items-center justify-between">
              <span>Size / Capacity</span>
              <span className="text-gray-500 font-normal">{selectedSize.size}</span>
            </div>
            {/* Horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
              {product.variant_size.map((sz, idx) => {
                const isSelected = selectedSize.size === sz.size;
                const hasValidSale =
                  sz.sale_price !== undefined &&
                  sz.sale_price !== null &&
                  !isNaN(Number(sz.sale_price)) &&
                  Number(sz.sale_price) > 0;
                const priceValue = hasValidSale ? Number(sz.sale_price) : (Number(sz.price) || 0);
                return (
                  <button
                    key={`${sz.size}-${idx}`}
                    type="button"
                    onClick={() => handleSizeChange(sz)}
                    className={`flex-shrink-0 snap-start min-w-[86px] px-3 py-2.5 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                      isSelected
                        ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] ring-1 ring-[#0071e3]/30 font-semibold'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-[#1d1d1f]'
                    }`}
                    title={`${sz.size} - RM${priceValue.toLocaleString()}`}
                  >
                    <div className="flex items-center justify-center w-full">
                      <span className="text-xs font-semibold truncate leading-tight">{sz.size}</span>
                    </div>
                    <div
                      className={`text-[10px] mt-1 truncate font-medium w-full text-center ${
                        isSelected ? 'text-[#0071e3]' : 'text-gray-500'
                      }`}
                    >
                      RM{priceValue.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity selector with subtotal */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs font-semibold text-[#1d1d1f] block">Quantity</span>
            <span className="text-[11px] text-[#86868b] mt-0.5 block">
              Subtotal: <span className="font-semibold text-[#1d1d1f]">RM {totalPrice.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-xs font-semibold text-[#1d1d1f] select-none">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Actions based on mode */}
        <div className="pt-3 border-t border-gray-100">
          {mode === 'cart' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="sheet-add-to-cart-btn"
                onClick={() => handleAction('cart')}
                className="flex-1 py-3.5 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <ShoppingBag size={15} />
                <span>Add to Bag</span>
              </button>
              <button
                type="button"
                id="sheet-switch-buy-btn"
                onClick={() => handleAction('buy')}
                className="px-4 py-3.5 rounded-xl border border-gray-300 text-[#1d1d1f] text-xs font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Buy Now
              </button>
            </div>
          ) : mode === 'buy' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="sheet-buy-now-btn"
                onClick={() => handleAction('buy')}
                className="flex-1 py-3.5 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Buy Now</span>
              </button>
              <button
                type="button"
                id="sheet-switch-cart-btn"
                onClick={() => handleAction('cart')}
                className="px-4 py-3.5 rounded-xl border border-gray-300 text-[#1d1d1f] text-xs font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={15} />
                <span>Add to Bag</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="sheet-add-to-cart-btn"
                onClick={() => handleAction('cart')}
                className="py-3.5 rounded-xl border border-[#0071e3] text-[#0071e3] text-xs font-semibold hover:bg-blue-50/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={15} />
                <span>Add to Bag</span>
              </button>
              <button
                type="button"
                id="sheet-buy-now-btn"
                onClick={() => handleAction('buy')}
                className="py-3.5 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Buy Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};