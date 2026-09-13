import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { appleApi } from '../services/appleApi.ts';
import { normalizePhone } from '../utils/phone.ts';
import { PhoneInput } from '../components/PhoneInput.tsx';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2021/11/24/05/19/user-6820232_1280.png';
type Step = 'phone' | 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkPhone = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      setPhone(normalizedPhone);
      const result = await appleApi.checkUser(normalizedPhone);
      if (result.exists) { setAccount(result.data); setStep('login'); }
      else { setAccount(null); setStep('register'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to check phone'); }
    finally { setLoading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      setPhone(normalizedPhone);
      if (step === 'login') await login(normalizedPhone, password);
      else await register(name.trim(), normalizedPhone, password, DEFAULT_AVATAR);
      navigate('/profile');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue'); }
    finally { setLoading(false); }
  };

  const back = () => { setError(''); setPassword(''); setName(''); setAccount(null); setStep('phone'); };

  return <StandalonePage title={step === 'phone' ? 'Sign In' : step === 'login' ? 'Welcome Back' : 'Create Account'}>
    {step === 'phone' && <form onSubmit={checkPhone} className="p-4 space-y-3">
      <div><h2 className="text-lg font-bold">Continue with phone</h2><p className="text-xs text-gray-500 mt-1">We'll check your account first.</p></div>
      <PhoneInput value={phone} onChange={setPhone} placeholder="Phone number" required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={loading} className="w-full p-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50">{loading ? 'Checking...' : 'Continue'}</button>
    </form>}
    {step === 'login' && <form onSubmit={submit} className="p-4 space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f5f5f7]"><img src={account?.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover bg-white" /><div className="min-w-0"><p className="font-semibold text-sm truncate">{account?.name}</p><p className="text-xs text-gray-500 truncate">{phone}</p></div></div>
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required autoFocus className="w-full p-3 rounded-xl border" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={loading} className="w-full p-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
      <button type="button" onClick={back} className="w-full p-3 text-sm text-[#0071e3]">Use another phone</button>
    </form>}
    {step === 'register' && <form onSubmit={submit} className="p-4 space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f5f5f7]"><img src={DEFAULT_AVATAR} alt="" className="w-12 h-12 rounded-full object-cover bg-white" /><div><p className="font-semibold text-sm">New account</p><p className="text-xs text-gray-500">{phone}</p></div></div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required autoFocus className="w-full p-3 rounded-xl border" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required className="w-full p-3 rounded-xl border" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={loading} className="w-full p-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
      <button type="button" onClick={back} className="w-full p-3 text-sm text-[#0071e3]">Use another phone</button>
    </form>}
  </StandalonePage>;
};
