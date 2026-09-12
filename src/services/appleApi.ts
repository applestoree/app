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
  login: (phone: string, password: string) => request<{ success: true; data: any }>('/apple-users/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  register: (name: string, phone: string, password: string) => request<{ success: true; data: any }>('/apple-users/register', { method: 'POST', body: JSON.stringify({ name, phone, password }) }),
  changePassword: (phone: string, current_password: string, new_password: string) => request<{ success: true; data: any }>('/apple-users/change-password', { method: 'POST', body: JSON.stringify({ phone, current_password, new_password }) }),
  getUser: (phone: string) => request<{ success: true; data: any }>(`/apple-users/${encodeURIComponent(phone)}`),
  getOrders: (phone: string) => request<{ success: true; data: any[] }>(`/apple-orders?phone=${encodeURIComponent(phone)}`),
  createOrder: (order: any) => request<{ success: true; data: any }>('/apple-orders', { method: 'POST', body: JSON.stringify(order) }),
};
