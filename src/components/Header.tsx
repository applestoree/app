import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Search, Bell, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface HeaderProps {
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const navigate = useNavigate();
  const { totalItems, openCart } = useCart();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  return (
    <>
      <header
        id="app-header"
        className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between select-none"
      >
        {/* Apple Logo & Store Title */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer active:opacity-75 transition-opacity"
        >
          <Apple size={22} className="text-[#1d1d1f] fill-[#1d1d1f]" />
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
              Store
            </span>
            <span className="text-[10px] font-normal text-[#86868b] tracking-wider uppercase leading-none">
              Malaysia
            </span>
          </div>
        </div>

        {/* Actions: Search, Notification, Cart */}
        <div className="flex items-center gap-1">
          {/* Search Button */}
          <button
            id="header-search-btn"
            type="button"
            onClick={() => {
              if (onSearchClick) {
                onSearchClick();
              } else {
                navigate('/products');
              }
            }}
            className="p-2 text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            aria-label="Search products"
          >
            <Search size={19} />
          </button>

          {/* Notification Button */}
          <button
            id="header-notification-btn"
            type="button"
            onClick={() => setShowNotificationModal(true)}
            className="p-2 text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-colors relative active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {/* Cart Button */}
          <button
            id="header-cart-btn"
            type="button"
            onClick={openCart}
            className="p-2 text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-colors relative active:scale-95"
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={19} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-black text-white text-[10px] font-semibold flex items-center justify-center rounded-full">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Quick Notification Alert Overlay */}
      {showNotificationModal && (
        <div
          id="notification-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setShowNotificationModal(false)}
        >
          <div
            className="w-full max-w-[340px] bg-white rounded-2xl p-5 shadow-2xl border border-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Apple size={18} className="text-[#1d1d1f]" />
                <h4 className="text-sm font-semibold text-[#1d1d1f]">
                  Apple Store Updates
                </h4>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-xs text-gray-400 hover:text-black font-medium"
              >
                Close
              </button>
            </div>
            <div className="py-4 space-y-3">
              <div className="p-3 bg-[#f5f5f7] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1d1d1f]">
                    Apple The Exchange TRX
                  </span>
                  <span className="text-[10px] text-gray-500">Official Store</span>
                </div>
                <p className="text-[#424245] leading-relaxed">
                  Welcome to Apple Store Malaysia. Discover new arrivals with free delivery and pickup options.
                </p>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-blue-900">
                  Flash Sale Available
                </span>
                <p className="text-blue-800 leading-relaxed">
                  Special promotional pricing is currently active on selected Apple devices.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full py-2.5 bg-[#1d1d1f] text-white text-xs font-medium rounded-xl hover:bg-black transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};
