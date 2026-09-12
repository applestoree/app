import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, PaymentMethod, DeliveryType, ShippingAddress, ShippingMethod } from '../types/cart.ts';
import { MapPin, Store, Truck, Tag, ChevronRight, ShoppingBag } from 'lucide-react';

const STORE_LOCATION = 'Apple The Exchange TRX, L2-40, Persiaran TRX, 55188 Kuala Lumpur';
const SHIPPING_FEES: Record<ShippingMethod, number> = { store_pickup: 0, same_day: 15, standard: 8, east_malaysia: 20 };

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, clearCart, addOrder } = useCart();
  const { user } = useAuth();
  const initialAddress: ShippingAddress = { fullName: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', postcode: '', country: 'Malaysia' };
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [address, setAddress] = useState<ShippingAddress>(() => location.state?.address || initialAddress);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('duitnow_qr');

  useEffect(() => {
    if (location.state?.address) setAddress(location.state.address as ShippingAddress);
  }, [location.key]);

  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const shippingOptions = useMemo(() => {
    const state = address.state.trim().toLowerCase();
    const eastMalaysia = state === 'sabah' || state === 'sarawak';
    const klangValley = state === 'kuala lumpur' || state === 'selangor';
    if (deliveryType === 'pickup') return [{ id: 'store_pickup' as ShippingMethod, title: 'Store Pickup', description: 'Apple The Exchange TRX', eta: 'Same day / subject to store readiness', fee: SHIPPING_FEES.store_pickup }];
    if (eastMalaysia) return [{ id: 'east_malaysia' as ShippingMethod, title: 'East Malaysia Delivery', description: 'Sabah / Sarawak', eta: '3–7 business days', fee: SHIPPING_FEES.east_malaysia }];
    return [
      ...(klangValley ? [{ id: 'same_day' as ShippingMethod, title: 'Same Day Delivery', description: 'Kuala Lumpur / selected Klang Valley', eta: 'Same day', fee: SHIPPING_FEES.same_day }] : []),
      { id: 'standard' as ShippingMethod, title: 'Standard Delivery', description: 'Peninsular Malaysia', eta: '1–3 business days', fee: SHIPPING_FEES.standard }
    ];
  }, [address.state, deliveryType]);

  const activeShippingMethod = shippingOptions.some(option => option.id === shippingMethod) ? shippingMethod : shippingOptions[0]?.id || 'standard';
  const shippingFee = shippingOptions.find(option => option.id === activeShippingMethod)?.fee ?? SHIPPING_FEES.standard;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const hasAddress = Boolean(address.fullName.trim() && address.phone.trim() && address.street.trim() && address.city.trim() && address.state.trim() && address.postcode.trim());

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

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const phone = address.phone.trim();
    if (!phone) { alert('Phone is required to place an order'); return; }
    if (deliveryType === 'delivery' && !hasAddress) { alert('Please complete your delivery address before placing the order'); return; }
    const order: Order = { id: '', items: [...cart], subtotal, shippingFee, discount, total: finalTotal, paymentMethod, deliveryType, shippingMethod: activeShippingMethod, shippingAddress: { ...address, phone }, storeLocation: deliveryType === 'pickup' ? STORE_LOCATION : undefined, status: 'order_placed', createdAt: new Date().toISOString(), estimatedDelivery: shippingOptions.find(option => option.id === activeShippingMethod)?.eta || '1–3 business days' };
    try { const created = await addOrder(order); clearCart(); navigate(`/tracking/${created.id}`); } catch (error) { alert(error instanceof Error ? error.message : 'Unable to place order'); }
  };

  if (cart.length === 0) return <StandalonePage title="Checkout"><div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto"><div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center text-gray-400 mb-4"><ShoppingBag size={28} /></div><h3 className="text-base font-semibold text-[#1d1d1f] mb-1">Your Bag is Empty</h3><p className="text-xs text-[#86868b] max-w-[240px] mb-6">Please add items to your bag before proceeding to checkout.</p><button type="button" onClick={() => navigate('/products')} className="px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full">Browse Apple Store</button></div></StandalonePage>;

  return <StandalonePage title="Checkout" footer={<div id="checkout-bottom-bar" className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 flex items-center justify-between select-none shrink-0"><div><div className="text-[10px] uppercase font-semibold text-[#86868b]">Total to Pay</div><div className="text-lg font-bold text-[#1d1d1f]">RM{(finalTotal || 0).toLocaleString()}</div></div><button type="button" id="place-order-btn" onClick={handlePlaceOrder} className="px-6 py-3 bg-[#0071e3] text-white text-xs font-semibold rounded-xl">Place Order <ChevronRight size={15} className="inline" /></button></div>}>
    <div className="flex-1 pb-6 space-y-3 p-4">
      <section className="bg-white p-3.5 rounded-2xl border border-black/5"><div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider mb-2">Fulfillment Method</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setDeliveryType('delivery'); setShippingMethod('standard'); }} className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${deliveryType === 'delivery' ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold' : 'border-gray-200 text-[#1d1d1f]'}`}><Truck size={16} />Delivery</button><button type="button" onClick={() => { setDeliveryType('pickup'); setShippingMethod('store_pickup'); }} className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${deliveryType === 'pickup' ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold' : 'border-gray-200 text-[#1d1d1f]'}`}><Store size={16} />Store Pickup</button></div></section>
      {deliveryType === 'delivery' ? <>
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3"><div className="flex justify-between items-center"><div className="flex items-center gap-2.5"><MapPin size={16} className="text-[#0071e3]" /><div><div className="text-xs font-semibold">Delivery Address</div><div className="text-[10px] text-[#86868b]">Malaysia delivery</div></div></div><button type="button" onClick={() => navigate('/delivery-address', { state: { address } })} className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0071e3] bg-blue-50">{hasAddress ? 'Change' : 'Add Address'}</button></div><div onClick={() => navigate('/delivery-address', { state: { address } })} className="text-xs cursor-pointer">{hasAddress ? <><div className="font-semibold">{address.fullName} <span className="font-normal text-[#86868b]">{address.phone}</span></div><div>{address.street}</div><div>{[address.city, address.postcode, address.state].filter(Boolean).join(', ')}</div><div className="text-[11px] text-[#86868b]">Malaysia</div></> : <div className="py-3 px-4 bg-[#f5f5f7] rounded-xl text-center">No complete delivery address added yet</div>}</div></section>
        <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold mb-2">Delivery Method</div><div className="space-y-2">{shippingOptions.map(option => <button key={option.id} type="button" disabled={!hasAddress} onClick={() => setShippingMethod(option.id)} className={`w-full p-3 rounded-xl border text-left ${activeShippingMethod === option.id ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'} ${!hasAddress ? 'opacity-50 cursor-not-allowed' : ''}`}><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-semibold">{option.title}</div><div className="text-[10px] text-[#86868b]">{option.description} · {option.eta}</div></div><div className="text-xs font-semibold whitespace-nowrap">RM{option.fee}</div></div></button>)}</div>{!hasAddress && <p className="text-[10px] text-[#86868b] mt-2">Complete your address to see available delivery methods.</p>}</section>
      </> : <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold">Pickup Store</div><div className="text-xs text-[#424245]">Apple The Exchange TRX<br />Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur</div><div className="mt-2 text-xs font-semibold">RM0 · Same day / subject to store readiness</div></section>}
      <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold">Payment</div><div className="grid grid-cols-2 gap-2 mt-2"><button type="button" onClick={() => setPaymentMethod('duitnow_qr')} className={`p-3 rounded-xl border text-xs ${paymentMethod === 'duitnow_qr' ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'}`}>DuitNow QR</button><button type="button" onClick={() => setPaymentMethod('bank_transfer')} className={`p-3 rounded-xl border text-xs ${paymentMethod === 'bank_transfer' ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'}`}>Bank Transfer</button></div></section>
      <section className="bg-white p-4 rounded-2xl border border-black/5"><form onSubmit={handleApplyVoucher} className="flex gap-2"><input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Voucher code" className="flex-1 p-2.5 rounded-xl border text-xs" /><button className="px-4 rounded-xl bg-black text-white text-xs"><Tag size={14} className="inline mr-1" />Apply</button></form>{voucherError && <p className="text-xs text-red-600 mt-2">{voucherError}</p>}</section>
      <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold mb-3">Order Summary</div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-[#86868b]">Subtotal</span><span>RM{subtotal.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-[#86868b]">Shipping Fee</span><span>RM{shippingFee.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-[#86868b]">Discount</span><span>-RM{discount.toLocaleString()}</span></div><div className="pt-2 mt-2 border-t border-black/5 flex justify-between font-semibold"><span>Total</span><span>RM{finalTotal.toLocaleString()}</span></div></div></section>
    </div>
  </StandalonePage>;
};
