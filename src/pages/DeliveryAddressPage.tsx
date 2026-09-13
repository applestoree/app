import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { ShippingAddress } from '../types/cart.ts';
import { DeliveryAddressMap, ResolvedAddressResult } from '../components/DeliveryAddressMap.tsx';
import { PhoneInput } from '../components/PhoneInput.tsx';

const EMPTY_ADDRESS: ShippingAddress = { fullName: '', phone: '', street: '', city: '', state: '', postcode: '', country: 'Malaysia' };

type NominatimNearestResponse = { address?: { city?: string; town?: string; municipality?: string; village?: string; county?: string; state?: string; postcode?: string } };

const reverseNearest = async (lat: number, lon: number, zoom: number): Promise<NominatimNearestResponse | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=1`, { headers: { 'Accept-Language': 'en-MY, en;q=0.9, ms-MY;q=0.8, ms;q=0.7' } });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
};

const resolveNearestMissingFields = async (resolved: ResolvedAddressResult): Promise<ResolvedAddressResult> => {
  const needsCity = !resolved.city.trim();
  const needsState = !resolved.state.trim();
  const needsPostcode = !resolved.postcode.trim();
  if (!needsCity && !needsState && !needsPostcode) return resolved;
  const result: ResolvedAddressResult = { ...resolved };
  if (needsCity || needsState) {
    const admin = (await reverseNearest(resolved.lat, resolved.lon, 10))?.address;
    if (admin) {
      result.city = result.city || admin.city || admin.town || admin.municipality || admin.village || admin.county || '';
      result.state = result.state || admin.state || '';
    }
  }
  if (needsPostcode) result.postcode = result.postcode || (await reverseNearest(resolved.lat, resolved.lon, 18))?.address?.postcode || '';
  return result;
};

export const DeliveryAddressPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [address, setAddress] = useState<ShippingAddress>(() => location.state?.address || EMPTY_ADDRESS);

  const hasAddress = Boolean(address.fullName.trim() && address.phone.trim() && address.street.trim() && address.city.trim() && address.state.trim() && address.postcode.trim());
  const update = (key: keyof ShippingAddress, value: string) => setAddress((prev) => ({ ...prev, [key]: value }));

  const handleAddressResolved = async (resolved: ResolvedAddressResult) => {
    const completed = await resolveNearestMissingFields(resolved);
    setAddress((prev) => ({ ...prev, street: completed.street || prev.street, city: completed.city || prev.city, state: completed.state || prev.state, postcode: completed.postcode || prev.postcode, country: 'Malaysia' }));
  };

  const handleSave = () => {
    if (!hasAddress) { alert('Please select a complete delivery address from the map'); return; }
    navigate('/checkout', { replace: true, state: { address } });
  };

  return (
    <StandalonePage title="Delivery Address" footer={
      <div className="flex w-full flex-col bg-white/95 backdrop-blur-md border-t border-black/5 p-3 px-4 shrink-0">
        <button type="button" onClick={handleSave} disabled={!hasAddress} className="w-full p-3 bg-[#0071e3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl">Save Address</button>
      </div>
    }>
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col gap-2 bg-white px-4 py-3">
          <input value={address.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Full name" className="w-full p-3 rounded-xl border text-xs" />
          <PhoneInput value={address.phone} onChange={(value) => update('phone', value)} placeholder="Phone number" />
          <input value={address.street} readOnly placeholder="Address" className="w-full p-3 rounded-xl border text-xs bg-[#f5f5f7] text-[#1d1d1f]" />
        </div>
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <DeliveryAddressMap onAddressResolved={handleAddressResolved} />
        </div>
      </div>
    </StandalonePage>
  );
};
