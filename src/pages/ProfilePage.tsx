import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';
import {
  User,
  Package,
  Clock,
  ShieldCheck,
  ChevronRight,
  Store,
  HelpCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = useCart();

  return (
    <div className="pb-10 space-y-4 p-4">
      {/* 1. Apple ID Profile Card */}
      <div className="bg-white p-5 rounded-3xl border border-black/5 flex items-center gap-4 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-gray-700 to-black text-white flex items-center justify-center font-bold text-lg shadow-xs">
          MA
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-[#1d1d1f] truncate">
              Mohd Amirul
            </h2>
            <span className="text-[10px] bg-blue-50 text-[#0071e3] font-semibold px-2 py-0.5 rounded-full">
              Apple ID
            </span>
          </div>
          <p className="text-xs text-[#86868b] truncate">amirul.apple@icloud.com</p>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck size={13} />
            <span>Apple Account Verified</span>
          </div>
        </div>
      </div>

      {/* 2. My Orders Section */}
      <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[#0071e3]" />
            <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              My Orders & Shipments
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-4 bg-[#f5f5f7] rounded-xl text-center space-y-2">
            <p className="text-xs text-[#86868b]">
              You haven't placed any orders yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-1.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full hover:bg-[#0077ed]"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-gray-100">
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => navigate(`/tracking/${ord.id}`)}
                className="pt-2.5 first:pt-0 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 p-2 rounded-xl transition-colors active:scale-[0.99]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1d1d1f]">
                      {ord.id}
                    </span>
                    <span className="text-[9px] font-bold uppercase bg-blue-100 text-[#0071e3] px-1.5 py-0.5 rounded">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} • RM{(ord.total || 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center text-xs text-[#0071e3] font-medium gap-0.5">
                  <span>Track</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Apple Store Malaysia Location & Services */}
      <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
        <div className="flex items-center gap-2">
          <Store size={16} className="text-[#0071e3]" />
          <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
            Official Store
          </h3>
        </div>

        <div className="p-3 bg-[#f5f5f7] rounded-xl text-xs space-y-1">
          <div className="font-semibold text-[#1d1d1f]">Apple The Exchange TRX</div>
          <div className="text-[#424245]">
            L2-40, Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur
          </div>
          <div className="text-[#86868b] text-[11px] pt-1">
            Open daily: 10:00 AM – 10:00 PM
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
            <div className="font-semibold text-[#1d1d1f] flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              <span>Genius Bar</span>
            </div>
            <p className="text-[11px] text-[#86868b]">Expert tech support & hardware repairs</p>
          </div>
          <div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
            <div className="font-semibold text-[#1d1d1f] flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Apple Trade In</span>
            </div>
            <p className="text-[11px] text-[#86868b]">Trade in old devices for store credit</p>
          </div>
        </div>
      </section>

      {/* 4. Support & Warranty */}
      <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-2 text-xs">
        <div className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer">
          <div className="flex items-center gap-2 text-[#1d1d1f]">
            <ShieldCheck size={16} className="text-gray-500" />
            <span>AppleCare+ & Warranty Check</span>
          </div>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer">
          <div className="flex items-center gap-2 text-[#1d1d1f]">
            <HelpCircle size={16} className="text-gray-500" />
            <span>Apple Support Malaysia: 1800 80 6419</span>
          </div>
          <ExternalLink size={14} className="text-gray-400" />
        </div>
        <div className="flex items-center justify-between py-2 cursor-pointer">
          <div className="flex items-center gap-2 text-[#1d1d1f]">
            <Clock size={16} className="text-gray-500" />
            <span>Return Policy (14 Days)</span>
          </div>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
      </section>

      <div className="text-center pt-2">
        <p className="text-[11px] text-[#86868b]">
          Apple Store Online • Malaysia
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Copyright © 2026 Apple Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};
