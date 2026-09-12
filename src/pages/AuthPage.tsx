import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { appleApi } from '../services/appleApi.ts';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = mode === 'login'
        ? await appleApi.login(phone.trim(), password)
        : await appleApi.register(name.trim(), phone.trim(), password);
      localStorage.setItem('apple_user', JSON.stringify(result.data));
      localStorage.setItem('apple_phone', result.data.phone);
      localStorage.setItem('apple_password', password);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue');
    } finally { setLoading(false); }
  };

  return (
    <StandalonePage title={mode === 'login' ? 'Sign In' : 'Create Account'}>
      <form onSubmit={submit} className="p-4 space-y-3">
        {mode === 'register' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required className="w-full p-3 rounded-xl border" />}
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required className="w-full p-3 rounded-xl border" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required className="w-full p-3 rounded-xl border" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={loading} className="w-full p-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50">{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full p-3 text-sm text-[#0071e3]">{mode === 'login' ? 'Create account' : 'Already have an account? Sign in'}</button>
      </form>
    </StandalonePage>
  );
};
