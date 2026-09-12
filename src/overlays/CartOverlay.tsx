import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { BottomSheet } from './BottomSheet.tsx';

export const CartOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, subtotal } = useCart();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <BottomSheet
      isOpen={isCartOpen}
      onClose={closeCart}
      title="Review Bag"
      position="right"
      id="cart-overlay"
    >
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center text-gray-400 mb-4">
            <ShoppingBag size={28} />
          </div>
          <h4 className="text-base font-semibold text-[#1d1d1f] mb-1">Your Bag is Empty</h4>
          <p className="text-xs text-[#86868b] max-w-[220px] mb-6">
            Free shipping on all orders. Explore genuine Apple products now.
          </p>
          <button
            type="button"
            onClick={() => {
              closeCart();
              navigate('/products');
            }}
            className="px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full hover:bg-[#0077ed] transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* Items list */}
          <div className="flex-1 p-4 space-y-3 divide-y divide-gray-100">
            {cart.map((item) => {
              const hasValidSale =
                item.selectedSize.sale_price !== undefined &&
                item.selectedSize.sale_price !== null &&
                !isNaN(Number(item.selectedSize.sale_price)) &&
                Number(item.selectedSize.sale_price) > 0;
              const unitPrice = hasValidSale
                ? Number(item.selectedSize.sale_price)
                : Number(item.selectedSize.price) || 0;

              return (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                  {/* Item Image */}
                  <div className="w-16 h-16 bg-[#fbfbfd] rounded-xl border border-black/5 p-1.5 flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.selectedColor.image_link}
                      alt={item.product.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-[#1d1d1f] truncate">
                      {item.product.title}
                    </h5>
                    <div className="text-[11px] text-[#86868b] flex items-center gap-1.5 mt-0.5">
                      <span>{item.selectedColor.color}</span>
                      <span>•</span>
                      <span>{item.selectedSize.size}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1d1d1f] mt-1">
                      RM{unitPrice.toLocaleString()}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded-l-md transition-colors text-gray-600"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-semibold px-2 text-[#1d1d1f]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded-r-md transition-colors text-gray-600"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer & Checkout button */}
          <div className="p-4 bg-[#fbfbfd] border-t border-black/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86868b]">Delivery</span>
              <span className="font-medium text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium text-[#1d1d1f]">Total</span>
              <span className="text-lg font-bold text-[#1d1d1f]">
                RM{(subtotal || 0).toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              id="cart-checkout-btn"
              onClick={handleCheckout}
              className="w-full py-3 bg-[#0071e3] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#0077ed] active:scale-[0.99] transition-all shadow-xs"
            >
              <span>Check Out</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
