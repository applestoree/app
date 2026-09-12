import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Package, Clock, ShieldCheck, ChevronRight, Store, HelpCircle, Sparkles, ExternalLink, KeyRound, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = useCart();
  const { user, loading, logout, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changing, setChanging] = useState(false);

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading account...</div>;
  if (!user) return <div className="p-4 space-y-4"><div className="bg-white p-5 rounded-3xl border border-black/5"><h2 className="font-bold text-lg">Sign in to your account</h2><p className="text-xs text-gray-500 mt-1">Access your profile and orders.</p><button onClick={() => navigate('/auth')} className="mt-4 px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold">Sign In</button></div></div>;

  const initials = (user.name || 'U').split(/\s+/).map(v => v[0]).join('').slice(0, 2).toUpperCase();
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPasswordMessage(''); setPasswordError(''); setChanging(true);
    try { await changePassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); setPasswordMessage('Password changed successfully.'); }
    catch (err) { setPasswordError(err instanceof Error ? err.message : 'Unable to change password'); }
    finally { setChanging(false); }
  };

  return <div className="pb-10 space-y-4 p-4">
    <div className="bg-white p-5 rounded-3xl border border-black/5 flex items-center gap-4 shadow-xs">
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-gray-700 to-black text-white flex items-center justify-center font-bold text-lg shadow-xs">{initials}</div>
      <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><h2 className="text-base font-bold text-[#1d1d1f] truncate">{user.name}</h2><span className="text-[10px] bg-blue-50 text-[#0071e3] font-semibold px-2 py-0.5 rounded-full">Customer</span></div><p className="text-xs text-[#86868b] truncate">{user.email || user.phone}</p><div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1"><ShieldCheck size={13} /><span>Account Verified</span></div></div>
    </div>

    <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><Package size={16} className="text-[#0071e3]" /><h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">My Orders & Shipments</h3></div><span className="text-xs text-gray-500 font-medium">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
      {orders.length === 0 ? <div className="p-4 bg-[#f5f5f7] rounded-xl text-center space-y-2"><p className="text-xs text-[#86868b]">You haven't placed any orders yet.</p><button type="button" onClick={() => navigate('/products')} className="px-4 py-1.5 bg-[#0071e3] text-white text-xs font-semibold rounded-full">Start Shopping</button></div> : <div className="space-y-2.5 divide-y divide-gray-100">{orders.map((ord) => <div key={ord.id} onClick={() => navigate(`/tracking/${ord.id}`)} className="pt-2.5 first:pt-0 flex items-center justify-between cursor-pointer p-2 rounded-xl"><div className="space-y-1"><div className="flex items-center gap-2"><span className="text-xs font-semibold text-[#1d1d1f]">{ord.id}</span><span className="text-[9px] font-bold uppercase bg-blue-100 text-[#0071e3] px-1.5 py-0.5 rounded">{ord.status?.replace('_', ' ')}</span></div><div className="text-[11px] text-[#86868b]">{ord.items?.length || 0} {(ord.items?.length || 0) === 1 ? 'item' : 'items'} • RM{(ord.total || 0).toLocaleString()}</div></div><div className="flex items-center text-xs text-[#0071e3] font-medium gap-0.5"><span>Track</span><ChevronRight size={14} /></div></div>)}</div>}
    </section>

    <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3"><div className="flex items-center gap-2"><KeyRound size={16} className="text-[#0071e3]" /><h3 className="text-xs font-semibold uppercase tracking-wider">Change Password</h3></div><form onSubmit={handleChangePassword} className="space-y-2"><input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required placeholder="Current password" className="w-full p-3 rounded-xl border text-sm" /><input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required placeholder="New password" className="w-full p-3 rounded-xl border text-sm" />{passwordError && <p className="text-xs text-red-600">{passwordError}</p>}{passwordMessage && <p className="text-xs text-emerald-600">{passwordMessage}</p>}<button disabled={changing} className="w-full p-3 rounded-xl bg-black text-white text-xs font-semibold disabled:opacity-50">{changing ? 'Updating...' : 'Change Password'}</button></form></section>

    <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3"><div className="flex items-center gap-2"><Store size={16} className="text-[#0071e3]" /><h3 className="text-xs font-semibold uppercase tracking-wider">Official Store</h3></div><div className="p-3 bg-[#f5f5f7] rounded-xl text-xs space-y-1"><div className="font-semibold text-[#1d1d1f]">Apple The Exchange TRX</div><div className="text-[#424245]">L2-40, Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur</div><div className="text-[#86868b] text-[11px] pt-1">Open daily: 10:00 AM – 10:00 PM</div></div><div className="grid grid-cols-2 gap-2 text-xs pt-1"><div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1"><div className="font-semibold flex items-center gap-1"><Sparkles size={13} className="text-amber-500" /><span>Genius Bar</span></div><p className="text-[11px] text-[#86868b]">Expert tech support & hardware repairs</p></div><div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1"><div className="font-semibold flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-500" /><span>Apple Trade In</span></div><p className="text-[11px] text-[#86868b]">Trade in old devices for store credit</p></div></div></section>
    <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-2 text-xs"><div className="flex items-center justify-between py-2 border-b border-gray-100"><div className="flex items-center gap-2"><ShieldCheck size={16} className="text-gray-500" /><span>AppleCare+ & Warranty Check</span></div><ChevronRight size={14} className="text-gray-400" /></div><div className="flex items-center justify-between py-2 border-b border-gray-100"><div className="flex items-center gap-2"><HelpCircle size={16} className="text-gray-500" /><span>Apple Support Malaysia: 1800 80 6419</span></div><ExternalLink size={14} className="text-gray-400" /></div><div className="flex items-center justify-between py-2 cursor-pointer" onClick={logout}><div className="flex items-center gap-2 text-red-600"><LogOut size={16} /><span>Sign Out</span></div><ChevronRight size={14} className="text-gray-400" /></div></section>
    <div className="text-center pt-2"><p className="text-[11px] text-[#86868b]">Apple Store Online • Malaysia</p><p className="text-[10px] text-gray-400 mt-0.5">Copyright © 2026 Apple Inc. All rights reserved.</p></div>
  </div>;
};
