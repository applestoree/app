import React, { createContext, useContext, useEffect, useState } from 'react';
import { appleApi } from '../services/appleApi.ts';

export interface AppleUser {
  phone: string;
  name: string;
  email?: string;
  avatar_url?: string;
  address?: unknown;
  created_at?: string;
  password?: string;
  role?: string;
}

interface AuthContextType {
  user: AppleUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_KEY = 'apple_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppleUser | null>(() => {
    try { const saved = localStorage.getItem(USER_KEY); return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved?.phone) return;
        const result = await appleApi.getUser(saved.phone);
        const next = { ...result.data, password: saved.password };
        setUser(next);
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } catch { localStorage.removeItem(USER_KEY); setUser(null); }
      finally { setLoading(false); }
    };
    void restore();
  }, []);

  const save = (next: AppleUser) => { setUser(next); localStorage.setItem(USER_KEY, JSON.stringify(next)); };
  const login = async (phone: string, password: string) => { const result = await appleApi.login(phone, password); save(result.data); };
  const register = async (name: string, phone: string, password: string) => { const result = await appleApi.register(name, phone, password); save(result.data); };
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.phone) throw new Error('Not logged in');
    const result = await appleApi.changePassword(user.phone, currentPassword, newPassword);
    save({ ...user, ...result.data, password: newPassword });
  };
  const logout = () => { localStorage.removeItem(USER_KEY); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, changePassword, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; }
