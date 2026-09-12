import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { useCart } from '../context/CartContext.tsx';
import { Order, PaymentMethod, DeliveryType, ShippingAddress } from '../types/cart.ts';
import { getStates, getCities, getPostcodes } from 'malaysia-postcodes';
import { DeliveryAddressMap, ResolvedAddressResult } from '../components/DeliveryAddressMap.tsx';
import {
  MapPin,
  Store,
  Truck,
  Tag,
  CreditCard,
  QrCode,
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ShoppingBag,
  Home,
  Briefcase
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart, addOrder } = useCart();

  // Delivery options: Delivery vs Store Pickup
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');

  // Address with genuine Malaysia State, City, Postcode data
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Malaysia',
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressTag, setAddressTag] = useState<'Home' | 'Office'>('Home');

  const hasAddress = Boolean(
    address.fullName.trim() ||
    address.street.trim() ||
    address.city.trim() ||
    address.state.trim() ||
    address.postcode.trim()
  );

  // Malaysia postcodes dynamic data
  const statesList = getStates();
  const citiesList = address.state ? getCities(address.state) : [];
  const postcodesList = address.state && address.city ? getPostcodes(address.state, address.city) : [];

  const handleStateChange = (newState: string) => {
    if (!newState) {
      setAddress((prev) => ({
        ...prev,
        state: '',
        city: '',
        postcode: '',
      }));
      return;
    }
    const cities = getCities(newState) || [];
    const firstCity = cities[0] || '';
    const postcodes = firstCity ? getPostcodes(newState, firstCity) || [] : [];
    const firstPostcode = postcodes[0] || '';
    setAddress((prev) => ({
      ...prev,
      state: newState,
      city: firstCity,
      postcode: firstPostcode,
    }));
  };

  const handleCityChange = (newCity: string) => {
    const postcodes = getPostcodes(address.state, newCity) || [];
    const firstPostcode = postcodes[0] || '';
    setAddress((prev) => ({
      ...prev,
      city: newCity,
      postcode: firstPostcode,
    }));
  };

  const handlePostcodeChange = (newPostcode: string) => {
    setAddress((prev) => ({
      ...prev,
      postcode: newPostcode,
    }));
  };

  const handleAddressResolvedFromMap = (resolved: ResolvedAddressResult) => {
    setAddress((prev) => ({
      ...prev,
      street: resolved.street || prev.street,
      state: resolved.state || prev.state,
      city: resolved.city || prev.city,
      postcode: resolved.postcode || prev.postcode,
    }));
  };

  // Store Pickup location
  const storeLocation = 'Apple The Exchange TRX, L2-40, Persiaran TRX, 55188 Kuala Lumpur';

  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');

  // Payment method: Bank Transfer or DuitNow QR
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('duitnow_qr');
  const [selectedBank, setSelectedBank] = useState('Maybank2u');

  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const shippingFee = 0; // Free delivery across Malaysia
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'APPLEMY' || code === 'TRX2026') {
      setAppliedVoucher({ code, discount: 50 });
      setVoucherCode('');
    } else {
      setVoucherError('Invalid promo voucher code.');
    }
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    // Generate unique Apple Malaysia order ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `MY-APL-${randomNum}`;

    const newOrder: Order = {
      id: orderId,
      items: [...cart],
      subtotal,
      shippingFee,
      discount,
      total: finalTotal,
      paymentMethod,
      deliveryType,
      shippingAddress: address,
      storeLocation: deliveryType === 'pickup' ? storeLocation : undefined,
      status: 'order_placed',
      createdAt: new Date().toISOString(),
      estimatedDelivery: '2 - 4 Business Days',
    };

    addOrder(newOrder);
    clearCart();
    navigate(`/tracking/${orderId}`);
  };

  if (cart.length === 0) {
    return (
      <StandalonePage title="Checkout">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
          <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center text-gray-400 mb-4">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">
            Your Bag is Empty
          </h3>
          <p className="text-xs text-[#86868b] max-w-[240px] mb-6">
            Please add items to your bag before proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full hover:bg-[#0077ed]"
          >
            Browse Apple Store
          </button>
        </div>
      </StandalonePage>
    );
  }

  return (
    <StandalonePage
      title="Checkout"
      footer={
        <div
          id="checkout-bottom-bar"
          className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 flex items-center justify-between select-none shrink-0"
        >
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#86868b]">Total to Pay</div>
            <div className="text-lg font-bold text-[#1d1d1f]">
              RM{(finalTotal || 0).toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            id="place-order-btn"
            onClick={handlePlaceOrder}
            className="px-6 py-3 bg-[#0071e3] text-white text-xs font-semibold rounded-xl hover:bg-[#0077ed] active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Place Order</span>
            <ChevronRight size={15} />
          </button>
        </div>
      }
    >
      <div className="flex-1 pb-6 space-y-3 p-4">
        {/* 1. Store / Delivery Type Selector */}
        <section className="bg-white p-3.5 rounded-2xl border border-black/5">
          <div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider mb-2">
            Fulfillment Method
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType('delivery')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                deliveryType === 'delivery'
                  ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold'
                  : 'border-gray-200 text-[#1d1d1f]'
              }`}
            >
              <Truck size={16} />
              <div className="text-xs">
                <div>Standard Delivery</div>
                <div className="text-[10px] text-gray-500 font-normal">Free Malaysia-wide</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                deliveryType === 'pickup'
                  ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold'
                  : 'border-gray-200 text-[#1d1d1f]'
              }`}
            >
              <Store size={16} />
              <div className="text-xs">
                <div>Apple Store Pickup</div>
                <div className="text-[10px] text-gray-500 font-normal">The Exchange TRX</div>
              </div>
            </button>
          </div>
        </section>

        {/* 2. Address / Store Section */}
        {deliveryType === 'delivery' ? (
          <section
            id="checkout-delivery-address-section"
            className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs space-y-3 transition-all hover:border-black/10"
          >
            {/* Address Section Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f] tracking-tight">
                    Delivery Address
                  </div>
                  <div className="text-[10px] text-[#86868b]">
                    Malaysia Standard Express Delivery
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="toggle-edit-address-btn"
                onClick={() => setIsEditingAddress(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0071e3] bg-blue-50/80 hover:bg-blue-100/90 active:scale-95 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>{hasAddress ? 'Change' : 'Add Address'}</span>
                <ChevronRight size={13} className="text-[#0071e3]" />
              </button>
            </div>

            <div className="h-[1px] bg-black/[0.04]" />

            {/* Address Display Preview (clicking opens fullpage) */}
            <div
              id="checkout-address-display"
              onClick={() => setIsEditingAddress(true)}
              className="text-xs space-y-2 pt-0.5 cursor-pointer group"
            >
              {hasAddress ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-[#1d1d1f] flex items-center gap-2">
                      <span>{address.fullName || 'Recipient'}</span>
                      {address.phone && (
                        <span className="font-normal text-[11px] text-[#86868b] bg-[#f5f5f7] px-2 py-0.5 rounded-md">
                          {address.phone}
                        </span>
                      )}
                      {addressTag && (
                        <span className="text-[10px] font-medium text-[#0071e3] bg-blue-50 px-1.5 py-0.5 rounded">
                          {addressTag}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#0071e3] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <span>Edit in fullpage</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>

                  <div className="space-y-0.5 text-xs text-[#333336] leading-relaxed">
                    {address.street && <div>{address.street}</div>}
                    <div className="font-medium text-[#1d1d1f]">
                      {[address.city, address.postcode, address.state].filter(Boolean).join(', ')}
                    </div>
                    <div className="text-[11px] text-[#86868b]">Malaysia</div>
                  </div>

                  {address.postcode && (
                    <div className="pt-1 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-medium border border-emerald-100">
                        <Check size={12} className="text-emerald-600" />
                        <span>Verified Malaysian Postcode • {address.postcode}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-3 px-4 bg-[#f5f5f7] rounded-xl border border-dashed border-gray-300 text-center space-y-1 group-hover:border-[#0071e3] group-hover:bg-blue-50/20 transition-all">
                  <div className="text-xs font-semibold text-[#1d1d1f] flex items-center justify-center gap-1.5">
                    <MapPin size={14} className="text-[#0071e3]" />
                    <span>No delivery address added yet</span>
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    Tap to enter your delivery address in Malaysia
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
              <Store size={15} className="text-[#0071e3]" />
              <span>Pickup Store</span>
            </div>
            <div className="text-xs text-[#424245] space-y-0.5">
              <div className="font-semibold text-[#1d1d1f]">Apple The Exchange TRX</div>
              <div>Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur</div>
              <div className="text-[11px] text-emerald-600 font-medium">Ready for pickup today</div>
            </div>
          </section>
        )}

        {/* 3. Shipping Info */}
        <section className="bg-white p-3.5 rounded-2xl border border-black/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-[#0071e3]" />
            <div>
              <span className="font-semibold text-[#1d1d1f]">Official Apple Courier</span>
              <div className="text-[11px] text-[#86868b]">Estimated 2 - 4 business days</div>
            </div>
          </div>
          <span className="font-bold text-emerald-600 text-xs">FREE</span>
        </section>

        {/* 4. Voucher Code */}
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
            <Tag size={15} className="text-[#0071e3]" />
            <span>Promo Code or Gift Card</span>
          </div>
          {appliedVoucher ? (
            <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <Check size={14} />
                <span>Code applied: {appliedVoucher.code}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedVoucher(null)}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyVoucher} className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Try 'APPLEMY' or 'TRX2026'"
                className="flex-1 bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
              >
                Apply
              </button>
            </form>
          )}
          {voucherError && <div className="text-[11px] text-red-600">{voucherError}</div>}
        </section>

        {/* 5. Payment Methods (Bank Transfer, DuitNow QR) */}
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
            <CreditCard size={15} className="text-[#0071e3]" />
            <span>Payment Method</span>
          </div>

          {/* DuitNow QR Option */}
          <div
            onClick={() => setPaymentMethod('duitnow_qr')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === 'duitnow_qr'
                ? 'border-[#0071e3] bg-blue-50/40'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs">
                  <QrCode size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f]">DuitNow QR</div>
                  <div className="text-[10px] text-gray-500">
                    Scan with any Malaysian bank or eWallet app
                  </div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'duitnow_qr'
                    ? 'border-[#0071e3] bg-[#0071e3]'
                    : 'border-gray-300'
                }`}
              >
                {paymentMethod === 'duitnow_qr' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>

            {paymentMethod === 'duitnow_qr' && (
              <div className="mt-3 p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3">
                <div className="w-16 h-16 bg-pink-50 border border-pink-200 rounded-lg flex flex-col items-center justify-center p-1 text-pink-700">
                  <QrCode size={32} />
                  <span className="text-[8px] font-bold mt-0.5">DuitNow</span>
                </div>
                <div className="text-[11px] text-gray-600 leading-snug">
                  Official Apple Malaysia DuitNow ID will be displayed upon order confirmation.
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer Option */}
          <div
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === 'bank_transfer'
                ? 'border-[#0071e3] bg-blue-50/40'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1d1d1f]">Online Bank Transfer</div>
                  <div className="text-[10px] text-gray-500">
                    FPX Instant Banking (Maybank, CIMB, RHB, etc.)
                  </div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#0071e3] bg-[#0071e3]'
                    : 'border-gray-300'
                }`}
              >
                {paymentMethod === 'bank_transfer' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                {['Maybank2u', 'CIMB Clicks', 'Public Bank', 'Hong Leong'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBank(bank);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs ${
                      selectedBank === bank
                        ? 'border-[#0071e3] bg-blue-50/50 font-semibold text-[#0071e3]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 6. Order Summary */}
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
          <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
            Order Summary ({cart.length} items)
          </h4>

          {/* Brief item review */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {cart.map((item) => {
              const hasValidSale =
                item.selectedSize.sale_price !== undefined &&
                item.selectedSize.sale_price !== null &&
                !isNaN(Number(item.selectedSize.sale_price)) &&
                Number(item.selectedSize.sale_price) > 0;
              const price = hasValidSale
                ? Number(item.selectedSize.sale_price)
                : Number(item.selectedSize.price) || 0;
              return (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-semibold text-gray-500">{item.quantity}x</span>
                    <span className="text-[#1d1d1f] truncate">{item.product.title}</span>
                    <span className="text-gray-400 text-[10px]">({item.selectedSize.size})</span>
                  </div>
                  <span className="font-semibold text-[#1d1d1f] whitespace-nowrap">
                    RM{((price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>RM{(subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="text-emerald-600 font-semibold">FREE</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Voucher Discount</span>
                <span>-RM{(discount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[#1d1d1f] font-bold text-sm pt-2 border-t border-gray-100">
              <span>Total (incl. tax)</span>
              <span>RM{(finalTotal || 0).toLocaleString()}</span>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#86868b] text-center pt-1">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Encrypted 256-bit Apple Payment Security</span>
        </div>
      </div>

      {/* Delivery Address Fullpage */}
      {isEditingAddress && (
        <div
          id="delivery-address-fullpage"
          className="absolute inset-0 z-50 bg-[#f5f5f7] flex flex-col overflow-hidden animate-in fade-in duration-150"
        >
          {/* Fullpage Top Bar */}
          <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between min-h-[54px] shrink-0">
            <button
              type="button"
              id="back-from-address-fullpage-btn"
              onClick={() => setIsEditingAddress(false)}
              className="p-1 -ml-2 text-[#0071e3] hover:bg-blue-50/70 rounded-full transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <ChevronLeft size={22} />
              <span className="text-xs font-semibold">Checkout</span>
            </button>
            <h1 className="text-sm font-semibold text-[#1d1d1f] tracking-tight">
              Delivery Address
            </h1>
            <button
              type="button"
              onClick={() => setIsEditingAddress(false)}
              className="text-xs font-semibold text-[#0071e3] hover:underline px-1 py-1 cursor-pointer"
            >
              Done
            </button>
          </header>

          {/* Fullpage Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {/* Apple Delivery Promise Banner */}
            <div className="bg-white p-3.5 rounded-2xl border border-black/5 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={18} />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-[#1d1d1f]">Apple Express Delivery</div>
                <div className="text-[11px] text-[#86868b] leading-relaxed">
                  Free standard shipping anywhere in Malaysia with official Apple courier tracking.
                </div>
              </div>
            </div>

            {/* Recipient Details Section */}
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs space-y-3">
              <div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                Recipient Information
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="address-fullname-fullpage"
                  className="block text-[11px] font-medium text-[#1d1d1f] mb-1"
                >
                  Full Name
                </label>
                <input
                  id="address-fullname-fullpage"
                  type="text"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  placeholder="Recipient's Name as per MyKad/Passport"
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 hover:border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="address-phone-fullpage"
                  className="block text-[11px] font-medium text-[#1d1d1f] mb-1"
                >
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-gray-500">
                    🇲🇾 +60
                  </div>
                  <input
                    id="address-phone-fullpage"
                    type="text"
                    value={address.phone.replace(/^\+60\s?/, '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^\+60\s?/, '');
                      setAddress({ ...address, phone: `+60 ${val}` });
                    }}
                    placeholder="12 345 6789"
                    className="w-full pl-16 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 hover:border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div className="text-[10px] text-[#86868b] mt-1">
                  Required for delivery SMS updates and courier contact.
                </div>
              </div>
            </div>

            {/* Address Details Section */}
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                  Address in Malaysia
                </div>
                <div className="text-[10px] text-[#0071e3] font-semibold flex items-center gap-1">
                  <span>Leaflet & Nominatim</span>
                </div>
              </div>

              {/* Interactive Leaflet Map with Nominatim Reverse Geocoding & Search */}
              <DeliveryAddressMap onAddressResolved={handleAddressResolvedFromMap} />

              {/* Street Address */}
              <div>
                <label
                  htmlFor="address-street-fullpage"
                  className="block text-[11px] font-medium text-[#1d1d1f] mb-1"
                >
                  Street Address
                </label>
                <input
                  id="address-street-fullpage"
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Unit / Floor / Building, Street Name"
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 hover:border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* 1. Automated Select for State */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="address-state-select-fullpage"
                    className="text-[11px] font-medium text-[#1d1d1f]"
                  >
                    State (Negeri)
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">{statesList.length} States</span>
                </div>
                <select
                  id="address-state-select-fullpage"
                  value={address.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 hover:border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs font-medium text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all cursor-pointer"
                >
                  <option value="">Select State (Negeri)</option>
                  {statesList.map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2 & 3. Automated Select for City & Postcode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="address-city-select-fullpage"
                      className="text-[11px] font-medium text-[#1d1d1f]"
                    >
                      City (Bandar)
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">{citiesList.length}</span>
                  </div>
                  <select
                    id="address-city-select-fullpage"
                    value={address.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 hover:border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs font-medium text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all cursor-pointer truncate"
                  >
                    <option value="">{address.state ? 'Select City (Bandar)' : 'Select State first'}</option>
                    {citiesList.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="address-postcode-select-fullpage"
                      className="text-[11px] font-medium text-[#1d1d1f]"
                    >
                      Postcode (Poskod)
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">{postcodesList.length}</span>
                  </div>
                  <select
                    id="address-postcode-select-fullpage"
                    value={address.postcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 hover:border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs font-medium text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all cursor-pointer"
                  >
                    <option value="">{address.city ? 'Select Postcode (Poskod)' : 'Select City first'}</option>
                    {!postcodesList.includes(address.postcode) && address.postcode && (
                      <option value={address.postcode}>{address.postcode}</option>
                    )}
                    {postcodesList.map((postcodeVal) => (
                      <option key={postcodeVal} value={postcodeVal}>
                        {postcodeVal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-[11px] font-medium text-[#1d1d1f] mb-1">Country / Region</label>
                <div className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/5 rounded-xl text-xs text-gray-500 font-medium flex items-center justify-between">
                  <span>Malaysia</span>
                  <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                    Express Covered
                  </span>
                </div>
              </div>
            </div>

            {/* Address Type Tag */}
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs space-y-2.5">
              <div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                Address Tag
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddressTag('Home')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    addressTag === 'Home'
                      ? 'border-[#0071e3] bg-blue-50/50 text-[#0071e3] font-semibold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home size={14} />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddressTag('Office')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    addressTag === 'Office'
                      ? 'border-[#0071e3] bg-blue-50/50 text-[#0071e3] font-semibold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>Office</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fullpage Fixed Bottom Action Bar */}
          <div className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-4 shrink-0 shadow-lg">
            <button
              type="button"
              id="save-address-fullpage-btn"
              onClick={() => setIsEditingAddress(false)}
              className="w-full py-3.5 bg-[#0071e3] text-white text-xs font-semibold rounded-xl hover:bg-[#0077ed] active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Save and Use Address</span>
              <Check size={16} />
            </button>
          </div>
        </div>
      )}
    </StandalonePage>
  );
};
