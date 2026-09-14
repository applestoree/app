import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { BottomSheet } from '../overlays/BottomSheet.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, PaymentMethod, ShippingAddress, ShippingMethod } from '../types/cart.ts';
import { MapPin, Truck, Tag, ChevronRight, ShoppingBag, Check, CreditCard } from 'lucide-react';

const SHIPPING_FEES: Record<ShippingMethod, number> = { store_pickup: 0, same_day: 15, standard: 8, east_malaysia: 20 };

const PAYMENT_OPTIONS: { id: PaymentMethod; title: string; description: string }[] = [
  { id: 'duitnow_qr', title: 'DuitNow QR', description: 'Pay using DuitNow QR' },
  { id: 'bank_transfer', title: 'Bank Transfer', description: 'Maybank2u / online bank' },
];

const INSTAGRAM_DM_URL = 'https://ig.me/m/applestoremalaysiaa';

const generateOrderId = () => {
  const now = new Date();
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3).slice(0, 2)}`;
};

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, clearCart, addOrder } = useCart();
  const { user } = useAuth();
  const initialAddress: ShippingAddress = { fullName: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', postcode: '', country: 'Malaysia' };
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [address, setAddress] = useState<ShippingAddress>(() => location.state?.address || initialAddress);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('duitnow_qr');
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [pendingOrderMessage, setPendingOrderMessage] = useState('');

  useEffect(() => {
    if (location.state?.address) setAddress(location.state.address as ShippingAddress);
  }, [location.key]);

  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const shippingOptions = useMemo(() => {
    const state = address.state.trim().toLowerCase();
    const eastMalaysia = state === 'sabah' || state === 'sarawak';
    const klangValley = state === 'kuala lumpur' || state === 'selangor';
    if (eastMalaysia) return [{ id: 'east_malaysia' as ShippingMethod, title: 'East Malaysia Delivery', description: 'Sabah / Sarawak', eta: '3–7 business days', fee: SHIPPING_FEES.east_malaysia }];
    return [
      ...(klangValley ? [{ id: 'same_day' as ShippingMethod, title: 'Same Day Delivery', description: 'Kuala Lumpur / selected Klang Valley', eta: 'Same day', fee: SHIPPING_FEES.same_day }] : []),
      { id: 'standard' as ShippingMethod, title: 'Standard Delivery', description: 'Peninsular Malaysia', eta: '1–3 business days', fee: SHIPPING_FEES.standard }
    ];
  }, [address.state]);

  const activeShippingMethod = shippingOptions.some(option => option.id === shippingMethod) ? shippingMethod : shippingOptions[0]?.id || 'standard';
  const shippingFee = shippingOptions.find(option => option.id === activeShippingMethod)?.fee ?? SHIPPING_FEES.standard;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const hasAddress = Boolean(address.fullName.trim() && address.phone.trim() && address.street.trim() && address.city.trim() && address.state.trim() && address.postcode.trim());
  const selectedPayment = PAYMENT_OPTIONS.find(option => option.id === paymentMethod) || PAYMENT_OPTIONS[0];

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'APPLEMY' || code === 'TRX2026') {
      setAppliedVoucher({ code, discount: 50 });
      setVoucherCode('');
    } else setVoucherError('Invalid promo voucher code.');
  };

  const buildOrderMessage = (orderId: string) => {
    const phone = address.phone.trim();
    const orderItems = cart.map(item => {
      const unitPrice = item.selectedSize.sale_price != null && Number(item.selectedSize.sale_price) > 0 ? Number(item.selectedSize.sale_price) : Number(item.selectedSize.price) || 0;
      return `• ${item.product.title} — ${item.selectedSize.size} — RM${unitPrice.toLocaleString()} × ${item.quantity}`;
    }).join('\n');

    return [
      `Order ID: ${orderId}`,
      '',
      'Items:',
      orderItems,
      '',
      `Subtotal: RM${subtotal.toLocaleString()}`,
      `Shipping Fee: RM${shippingFee.toLocaleString()}`,
      `Discount: RM${discount.toLocaleString()}`,
      `Total: RM${finalTotal.toLocaleString()}`,
      '',
      'Customer:',
      `Name: ${address.fullName}`,
      `Phone: ${phone}`,
      '',
      'Delivery Address:',
      address.street,
      `${address.city}, ${address.postcode}, ${address.state}`,
      address.country,
      '',
      `Payment Method: ${selectedPayment.title}`,
      `Delivery Method: ${shippingOptions.find(option => option.id === activeShippingMethod)?.title || 'Standard Delivery'}`,
      '',
      'Please confirm my order. Thank you!'
    ].join('\n');
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const phone = address.phone.trim();
    if (!phone) { alert('Phone is required to place an order'); return; }
    if (!hasAddress) { alert('Please complete your delivery address before placing the order'); return; }

    const orderId = generateOrderId();
    setPendingOrderId(orderId);
    setPendingOrderMessage(buildOrderMessage(orderId));
    setIsOrderConfirmationOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderId || !pendingOrderMessage || cart.length === 0) return;

    const phone = address.phone.trim();
    const order: Order = {
      id: pendingOrderId,
      items: [...cart],
      subtotal,
      shippingFee,
      discount,
      total: finalTotal,
      paymentMethod,
      deliveryType: 'delivery',
      shippingMethod: activeShippingMethod,
      shippingAddress: { ...address, phone },
      status: 'order_placed',
      createdAt: new Date().toISOString(),
      estimatedDelivery: shippingOptions.find(option => option.id === activeShippingMethod)?.eta || '1–3 business days'
    };

    try {
      await addOrder(order);
      await navigator.clipboard.writeText(pendingOrderMessage);
      setIsOrderConfirmationOpen(false);
      clearCart();
      window.location.href = INSTAGRAM_DM_URL;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to place order');
    }
  };

  const handleCancelOrder = () => {
    setIsOrderConfirmationOpen(false);
    setPendingOrderId('');
    setPendingOrderMessage('');
  };

  if (cart.length === 0) return <StandalonePage title="Checkout"><div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto"><div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center text-gray-400 mb-4"><ShoppingBag size={28} /></div><h3 className="text-base font-semibold text-[#1d1d1f] mb-1">Your Bag is Empty</h3><p className="text-xs text-[#86868b] max-w-[240px] mb-6">Please add items to your bag before proceeding to checkout.</p><button type="button" onClick={() => navigate('/products')} className="px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full">Browse Apple Store</button></div></StandalonePage>;

  return <StandalonePage title="Checkout" footer={<div id="checkout-bottom-bar" className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 flex items-center justify-between select-none shrink-0"><div><div className="text-[10px] uppercase font-semibold text-[#86868b]">Total to Pay</div><div className="text-lg font-bold text-[#1d1d1f]">RM{(finalTotal || 0).toLocaleString()}</div></div><button type="button" id="place-order-btn" onClick={handlePlaceOrder} className="px-6 py-3 bg-[#0071e3] text-white text-xs font-semibold rounded-xl">Place Order <ChevronRight size={15} className="inline" /></button></div>}>
    <div className="flex-1 pb-6 space-y-3 p-4">
      <section className="bg-white p-4 rounded-2xl border border-black/5">
        <div className="flex items-center justify-between mb-3"><div className="text-xs font-semibold">Cart</div><div className="text-[10px] text-[#86868b]">{cart.reduce((total, item) => total + item.quantity, 0)} items</div></div>
        <div className="space-y-3">{cart.map(item => {
          const unitPrice = item.selectedSize.sale_price != null && Number(item.selectedSize.sale_price) > 0 ? Number(item.selectedSize.sale_price) : Number(item.selectedSize.price) || 0;
          const originalPrice = Number(item.selectedSize.price) || 0;
          const itemSubtotal = unitPrice * item.quantity;
          return <div key={item.id} className="flex gap-3 py-1"><img src={item.selectedColor.image_link} alt={item.product.title} className="w-20 h-20 rounded-xl object-contain bg-[#f5f5f7] shrink-0" /><div className="min-w-0 flex-1"><div className="text-xs font-semibold text-[#1d1d1f] line-clamp-2">{item.product.title}</div><div className="text-[10px] text-[#86868b] mt-1">{item.selectedColor.color} · {item.selectedSize.size}</div><div className="flex items-end justify-between gap-2 mt-2"><div><div className="text-[10px] text-[#86868b]">Qty {item.quantity}</div><div className="text-xs font-semibold">{item.selectedSize.sale_price != null && Number(item.selectedSize.sale_price) > 0 && originalPrice > unitPrice && <span className="line-through text-[#86868b] mr-1">RM{originalPrice.toLocaleString()}</span>}RM{unitPrice.toLocaleString()}</div></div><div className="text-xs font-semibold whitespace-nowrap">RM{itemSubtotal.toLocaleString()}</div></div></div></div>;
        })}</div>
      </section>

      <section className="bg-white p-3.5 rounded-2xl border border-black/5"><div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider mb-2">Fulfillment Method</div><div className="p-2.5 rounded-xl border border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold flex items-center gap-2.5"><Truck size={16} />Delivery</div></section>

      <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3"><div className="flex justify-between items-center"><div className="flex items-center gap-2.5"><MapPin size={16} className="text-[#0071e3]" /><div><div className="text-xs font-semibold">Delivery Address</div><div className="text-[10px] text-[#86868b]">Malaysia delivery</div></div></div><button type="button" onClick={() => navigate('/delivery-address', { state: { address } })} className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0071e3] bg-blue-50">{hasAddress ? 'Change' : 'Add Address'}</button></div><div onClick={() => navigate('/delivery-address', { state: { address } })} className="text-xs cursor-pointer">{hasAddress ? <><div className="font-semibold">{address.fullName} <span className="font-normal text-[#86868b]">{address.phone}</span></div><div>{address.street}</div><div>{[address.city, address.postcode, address.state].filter(Boolean).join(', ')}</div><div className="text-[11px] text-[#86868b]">Malaysia</div></> : <div className="py-3 px-4 bg-[#f5f5f7] rounded-xl text-center">No complete delivery address added yet</div>}</div></section>

      <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold mb-2">Delivery Method</div><div className="space-y-2">{shippingOptions.map(option => <button key={option.id} type="button" disabled={!hasAddress} onClick={() => setShippingMethod(option.id)} className={`w-full p-3 rounded-xl border text-left ${activeShippingMethod === option.id ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'} ${!hasAddress ? 'opacity-50 cursor-not-allowed' : ''}`}><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-semibold">{option.title}</div><div className="text-[10px] text-[#86868b]">{option.description} · {option.eta}</div></div><div className="text-xs font-semibold whitespace-nowrap">RM{option.fee}</div></div></button>)}</div>{!hasAddress && <p className="text-[10px] text-[#86868b] mt-2">Complete your address to see available delivery methods.</p>}</section>

      <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold">Payment</div><button type="button" onClick={() => setIsPaymentSheetOpen(true)} className="w-full mt-2 p-3 rounded-xl border border-gray-200 text-left flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#f5f5f7] flex items-center justify-center shrink-0"><CreditCard size={17} className="text-[#0071e3]" /></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{selectedPayment.title}</div><div className="text-[10px] text-[#86868b]">{selectedPayment.description}</div></div><ChevronRight size={16} className="text-[#86868b] shrink-0" /></button></section>

      <section className="bg-white p-4 rounded-2xl border border-black/5"><form onSubmit={handleApplyVoucher} className="flex gap-2"><input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Voucher code" className="flex-1 p-2.5 rounded-xl border text-xs" /><button className="px-4 rounded-xl bg-black text-white text-xs"><Tag size={14} className="inline mr-1" />Apply</button></form>{voucherError && <p className="text-xs text-red-600 mt-2">{voucherError}</p>}</section>

      <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold mb-3">Order Summary</div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-[#86868b]">Subtotal</span><span>RM{subtotal.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-[#86868b]">Shipping Fee</span><span>RM{shippingFee.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-[#86868b]">Discount</span><span>-RM{discount.toLocaleString()}</span></div><div className="pt-2 mt-2 border-t border-black/5 flex justify-between font-semibold"><span>Total</span><span>RM{finalTotal.toLocaleString()}</span></div></div></section>
    </div>

    <BottomSheet isOpen={isPaymentSheetOpen} onClose={() => setIsPaymentSheetOpen(false)} title="Payment Method" id="payment-method-bottomsheet">
      <div className="space-y-2">{PAYMENT_OPTIONS.map(option => <button key={option.id} type="button" onClick={() => { setPaymentMethod(option.id); setIsPaymentSheetOpen(false); }} className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${paymentMethod === option.id ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200 bg-white'}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === option.id ? 'bg-white text-[#0071e3]' : 'bg-[#f5f5f7] text-[#424245]'}`}><CreditCard size={18} /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-[#1d1d1f]">{option.title}</div><div className="text-[10px] text-[#86868b] mt-0.5">{option.description}</div></div>{paymentMethod === option.id && <Check size={18} className="text-[#0071e3] shrink-0" />}</button>)}</div>
    </BottomSheet>

    {isOrderConfirmationOpen && <div id="order-confirmation-popup" className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title">
      <div className="w-full max-w-[460px] max-h-[85dvh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-black/5 shrink-0">
          <div id="order-confirmation-title" className="text-sm font-semibold text-[#1d1d1f]">Confirm Order</div>
          <div className="text-[10px] text-[#86868b] mt-1">Review the exact message that will be copied to Instagram.</div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-[#f5f5f7]">
          <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-[#1d1d1f] font-sans">{pendingOrderMessage}</pre>
        </div>
        <div className="p-3 border-t border-black/5 flex gap-2 shrink-0">
          <button type="button" onClick={handleCancelOrder} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-[#1d1d1f]">Cancel</button>
          <button type="button" onClick={handleConfirmOrder} className="flex-1 px-4 py-3 rounded-xl bg-[#0071e3] text-white text-xs font-semibold">Confirm & Open Instagram</button>
        </div>
      </div>
    </div>}
  </StandalonePage>;
};
