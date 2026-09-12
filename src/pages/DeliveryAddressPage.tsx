import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { ShippingAddress } from '../types/cart.ts';
import { getStates, getCities, getPostcodes } from 'malaysia-postcodes';
import { DeliveryAddressMap, ResolvedAddressResult } from '../components/DeliveryAddressMap.tsx';

const EMPTY_ADDRESS: ShippingAddress = { fullName: '', phone: '', street: '', city: '', state: '', postcode: '', country: 'Malaysia' };

export const DeliveryAddressPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [address, setAddress] = useState<ShippingAddress>(() => location.state?.address || EMPTY_ADDRESS);
  const statesList = getStates();
  const citiesList = address.state ? getCities(address.state) : [];
  const postcodesList = address.state && address.city ? getPostcodes(address.state, address.city) : [];
  const hasAddress = Boolean(address.fullName.trim() && address.phone.trim() && address.street.trim() && address.city.trim() && address.state.trim() && address.postcode.trim());

  const update = (key: keyof ShippingAddress, value: string) => setAddress(prev => ({ ...prev, [key]: value }));
  const handleStateChange = (state: string) => setAddress(prev => ({ ...prev, state, city: '', postcode: '' }));
  const handleCityChange = (city: string) => setAddress(prev => ({ ...prev, city, postcode: '' }));
  const handleAddressResolved = (resolved: ResolvedAddressResult) => setAddress(prev => ({ ...prev, street: resolved.street || prev.street, state: resolved.state || prev.state, city: resolved.city || prev.city, postcode: resolved.postcode || prev.postcode }));
  const handleSave = () => {
    if (!hasAddress) { alert('Please complete your delivery address'); return; }
    navigate('/checkout', { replace: true, state: { address } });
  };

  return <StandalonePage title="Delivery Address" footer={<div className="w-full bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 shrink-0"><button type="button" onClick={handleSave} className="w-full p-3 bg-[#0071e3] text-white text-xs font-semibold rounded-xl">Save Address</button></div>}>
    <div className="flex-1 p-4 pb-6 space-y-3">
      <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-2">
        <input value={address.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Full name" className="w-full p-3 rounded-xl border text-xs" />
        <input value={address.phone} onChange={e => update('phone', e.target.value)} placeholder="Phone" className="w-full p-3 rounded-xl border text-xs" />
        <input value={address.street} onChange={e => update('street', e.target.value)} placeholder="Street address" className="w-full p-3 rounded-xl border text-xs" />
        <select value={address.state} onChange={e => handleStateChange(e.target.value)} className="w-full p-3 rounded-xl border text-xs"><option value="">Select state</option>{statesList.map((state: string) => <option key={state}>{state}</option>)}</select>
        <select value={address.city} onChange={e => handleCityChange(e.target.value)} disabled={!address.state} className="w-full p-3 rounded-xl border text-xs disabled:opacity-50"><option value="">Select city</option>{citiesList.map((city: string) => <option key={city}>{city}</option>)}</select>
        <select value={address.postcode} onChange={e => update('postcode', e.target.value)} disabled={!address.city} className="w-full p-3 rounded-xl border text-xs disabled:opacity-50"><option value="">Select postcode</option>{postcodesList.map((postcode: string) => <option key={postcode}>{postcode}</option>)}</select>
      </section>
      <DeliveryAddressMap onResolved={handleAddressResolved} />
    </div>
  </StandalonePage>;
};
