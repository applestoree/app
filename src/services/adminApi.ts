const API_BASE = 'https://jhpbtooefyzdndstlzva.supabase.co/functions/v1/admin-api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) throw new Error(data?.error || 'Request failed');
  return data;
}

export const adminApi = {
  products: () => request<{ success: true; count?: number; data: any[] }>('/products'),
  createProduct: (product: any) => request<{ success: true; data: any }>('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, product: any) => request<{ success: true; data: any }>(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id: string) => request<{ success: true; data?: any }>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  orders: () => request<{ success: true; count?: number; data: any[] }>('/orders'),
  updateOrderStatus: (id: string | number, status: string) => request<{ success: true; data: any }>(`/orders/${encodeURIComponent(String(id))}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateOrderPayment: (id: string | number, payment: any) => request<{ success: true; data: any }>(`/orders/${encodeURIComponent(String(id))}/payment`, { method: 'PUT', body: JSON.stringify({ payment }) }),
  users: () => request<{ success: true; count?: number; data: any[] }>('/users'),
  updateUserRole: (phone: string, role: string) => request<{ success: true; data: any }>(`/users/${encodeURIComponent(phone)}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  reviews: () => request<{ success: true; count?: number; data: any[] }>('/reviews'),
  deleteReview: (id: string | number) => request<{ success: true; data?: any }>(`/reviews/${encodeURIComponent(String(id))}`, { method: 'DELETE' }),
};
