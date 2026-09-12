import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, PaymentMethod, DeliveryType, ShippingAddress } from '../types/cart.ts';
import { getStates, getCities, getPostcodes } from 'malaysia-postcodes';
import { DeliveryAddressMap, ResolvedAddressResult } from '../components/DeliveryAddressMap.tsx';
import { MapPin, Store, Truck, Tag, CreditCard, QrCode, Building2, Check, ChevronRight, ChevronLeft, ShieldCheck, ShoppingBag, Home, Briefcase } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart, addOrder } = useCart();
  const { user } = useAuth();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [address, setAddress] = useState<ShippingAddress>({ fullName: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', postcode: '', country: 'Malaysia' });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressTag, setAddressTag] = useState<'Home' | 'Office'>('Home');
  const hasAddress = Boolean(address.fullName.trim() || address.street.trim() || address.city.trim() || address.state.trim() || address.postcode.trim());
  const statesList = getStates();
  const citiesList = address.state ? getCities(address.state) : [];
  const postcodesList = address.state && address.city ? getPostcodes(address.state, address.city) : [];
  const handleStateChange = (newState: string) => { const cities = newState ? getCities(newState) || [] : []; const city = cities[0] || ''; const postcodes = city ? getPostcodes(newState, city) || [] : []; setAddress(prev => ({ ...prev, state: newState, city, postcode: postcodes[0] || '' })); };
  const handleCityChange = (newCity: string) => { const postcodes = getPostcodes(address.state, newCity) || []; setAddress(prev => ({ ...prev, city: newCity, postcode: postcodes[0] || '' })); };
  const handlePostcodeChange = (newPostcode: string) => setAddress(prev => ({ ...prev, postcode: newPostcode }));
  const handleAddressResolvedFromMap = (resolved: ResolvedAddressResult) => setAddress(prev => ({ ...prev, street: resolved.street || prev.street, state: resolved.state || prev.state, city: resolved.city || prev.city, postcode: resolved.postcode || prev.postcode }));
  const storeLocation = 'Apple The Exchange TRX, L2-40, Persiaran TRX, 55188 Kuala Lumpur';
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('duitnow_qr');
  const [selectedBank, setSelectedBank] = useState('Maybank2u');
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const shippingFee = 0;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const handleApplyVoucher = (e: React.FormEvent) => { e.preventDefault(); setVoucherError(''); const code = voucherCode.trim().toUpperCase(); if (!code) return; if (code === 'APPLEMY' || code === 'TRX2026') { setAppliedVoucher({ code, discount: 50 }); setVoucherCode(''); } else setVoucherError('Invalid promo voucher code.'); };
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!user) { navigate('/auth'); return; }
    const order: Order = { id: '', items: [...cart], subtotal, shippingFee, discount, total: finalTotal, paymentMethod, deliveryType, shippingAddress: address, storeLocation: deliveryType === 'pickup' ? storeLocation : undefined, status: 'order_placed', createdAt: new Date().toISOString(), estimatedDelivery: '2 - 4 Business Days' };
    try { const created = await addOrder(order); clearCart(); navigate(`/tracking/${created.id}`); } catch (error) { alert(error instanceof Error ? error.message : 'Unable to place order'); }
  };

  if (cart.length === 0) return <StandalonePage title="Checkout"><div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto"><div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center text-gray-400 mb-4"><ShoppingBag size={28} /></div><h3 className="text-base font-semibold text-[#1d1d1f] mb-1">Your Bag is Empty</h3><p className="text-xs text-[#86868b] max-w-[240px] mb-6">Please add items to your bag before proceeding to checkout.</p><button type="button" onClick={() => navigate('/products')} className="px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full">Browse Apple Store</button></div></StandalonePage>;

  return <StandalonePage title="Checkout" footer={<div id="checkout-bottom-bar" className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 flex items-center justify-between select-none shrink-0"><div><div className="text-[10px] uppercase font-semibold text-[#86868b]">Total to Pay</div><div className="text-lg font-bold text-[#1d1d1f]">RM{(finalTotal || 0).toLocaleString()}</div></div><button type="button" id="place-order-btn" onClick={handlePlaceOrder} className="px-6 py-3 bg-[#0071e3] text-white text-xs font-semibold rounded-xl">Place Order <ChevronRight size={15} className="inline" /></button></div>}>
    <div className="flex-1 pb-6 space-y-3 p-4">
      <section className="bg-white p-3.5 rounded-2xl border border-black/5"><div className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider mb-2">Fulfillment Method</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setDeliveryType('delivery')} className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${deliveryType === 'delivery' ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold' : 'border-gray-200 text-[#1d1d1f]'}`}><Truck size={16} />Standard Delivery</button><button type="button" onClick={() => setDeliveryType('pickup')} className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${deliveryType === 'pickup' ? 'border-[#0071e3] bg-blue-50/40 text-[#0071e3] font-semibold' : 'border-gray-200 text-[#1d1d1f]'}`}><Store size={16} />Apple Store Pickup</button></div></section>
      {deliveryType === 'delivery' ? <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3"><div className="flex justify-between items-center"><div className="flex items-center gap-2.5"><MapPin size={16} className="text-[#0071e3]" /><div><div className="text-xs font-semibold">Delivery Address</div><div className="text-[10px] text-[#86868b]">Malaysia Standard Express Delivery</div></div></div><button type="button" onClick={() => setIsEditingAddress(true)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0071e3] bg-blue-50">{hasAddress ? 'Change' : 'Add Address'}</button></div><div onClick={() => setIsEditingAddress(true)} className="text-xs cursor-pointer">{hasAddress ? <><div className="font-semibold">{address.fullName} {address.phone && <span className="font-normal text-[#86868b]">{address.phone}</span>}</div><div>{address.street}</div><div>{[address.city, address.postcode, address.state].filter(Boolean).join(', ')}</div><div className="text-[11px] text-[#86868b]">Malaysia</div></> : <div className="py-3 px-4 bg-[#f5f5f7] rounded-xl text-center">No delivery address added yet</div>}</div></section> : <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold">Pickup Store</div><div className="text-xs text-[#424245]">Apple The Exchange TRX<br />Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur</div></section>}
      <section className="bg-white p-4 rounded-2xl border border-black/5"><div className="text-xs font-semibold">Payment</div><div className="grid grid-cols-2 gap-2 mt-2"><button type="button" onClick={() => setPaymentMethod('duitnow_qr')} className={`p-3 rounded-xl border text-xs ${paymentMethod === 'duitnow_qr' ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'}`}>DuitNow QR</button><button type="button" onClick={() => setPaymentMethod('bank_transfer')} className={`p-3 rounded-xl border text-xs ${paymentMethod === 'bank_transfer' ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'}`}>Bank Transfer</button></div></section>
      <section className="bg-white p-4 rounded-2xl border border-black/5"><form onSubmit={handleApplyVoucher} className="flex gap-2"><input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Voucher code" className="flex-1 p-2.5 rounded-xl border text-xs" /><button className="px-4 rounded-xl bg-black text-white text-xs"><Tag size={14} className="inline mr-1" />Apply</button></form>{voucherError && <p className="text-xs text-red-600 mt-2">{voucherError}</p>}</section>
      {isEditingAddress && <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-2"><input value={address.fullName} onChange={e => setAddress(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Full name" className="w-full p-2.5 rounded-xl border text-xs" /><input value={address.phone} onChange={e => setAddress(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="w-full p-2.5 rounded-xl border text-xs" /><input value={address.street} onChange={e => setAddress(prev => ({ ...prev, street: e.target.value }))} placeholder="Street address" className="w-full p-2.5 rounded-xl border text-xs" /><select value={address.state} onChange={e => handleStateChange(e.target.value)} className="w-full p-2.5 rounded-xl border text-xs"><option value="">Select state</option>{statesList.map((s: string) => <option key={s}>{s}</option>)}</select><select value={address.city} onChange={e => handleCityChange(e.target.value)} className="w-full p-2.5 rounded-xl border text-xs"><option value="">Select city</option>{citiesList.map((c: string) => <option key={c}>{c}</option>)}</select><select value={address.postcode} onChange={e => handlePostcodeChange(e.target.value)} className="w-full p-2.5 rounded-xl border text-xs"><option value="">Select postcode</option>{postcodesList.map((p: string) => <option key={p}>{p}</option>)}</select><DeliveryAddressMap onResolved={handleAddressResolvedFromMap} /><button type="button" onClick={() => setIsEditingAddress(false)} className="w-full p-2.5 rounded-xl bg-black text-white text-xs">Done</button></section>}
    </div>
  </StandalonePage>;
};
