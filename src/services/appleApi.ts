import { normalizePhone } from '../utils/phone.ts';

const API_BASE = 'https://jhpbtooefyzdndstlzva.supabase.co/functions/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) throw new Error(data?.error || 'Request failed');
  return data;
}

export const appleApi = {
  login: (phone: string, password: string) => request<{ success: true; data: any }>('/apple-users/login', { method: 'POST', body: JSON.stringify({ phone: normalizePhone(phone), password }) }),
  register: (name: string, phone: string, password: string, avatar_url?: string) => request<{ success: true; data: any }>('/apple-users/register', { method: 'POST', body: JSON.stringify({ name, phone: normalizePhone(phone), password, avatar_url }) }),
  checkUser: async (phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    const response = await fetch(`${API_BASE}/apple-users/${encodeURIComponent(normalizedPhone)}`, { headers: { 'Content-Type': 'application/json' } });
    if (response.status === 404) return { exists: false as const, data: null };
    const data = await response.json();
    if (!response.ok || data?.success === false) throw new Error(data?.error || 'Unable to check phone');
    return { exists: true as const, data: data.data };
  },
  changePassword: (phone: string, current_password: string, new_password: string) => request<{ success: true; data: any }>('/apple-users/change-password', { method: 'POST', body: JSON.stringify({ phone: normalizePhone(phone), current_password, new_password }) }),
  getUser: (phone: string) => request<{ success: true; data: any }>(`/apple-users/${encodeURIComponent(normalizePhone(phone))}`),
  getOrders: (phone: string) => request<{ success: true; data: any[] }>(`/apple-orders?phone=${encodeURIComponent(normalizePhone(phone))}`),
  createOrder: (order: any) => request<{ success: true; data: any }>('/apple-orders', {
    method: 'POST',
    body: JSON.stringify({
      ...order,
      phone: normalizePhone(order.phone),
      address: order.address
        ? { ...order.address, phone: normalizePhone(order.address.phone) }
        : order.address,
    }),
  }),
};
