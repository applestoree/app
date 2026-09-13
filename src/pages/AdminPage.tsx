import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { adminApi } from '../services/adminApi.ts';
import { AdminBottomNav } from '../components/AdminBottomNav.tsx';

type AdminView = 'dashboard' | 'products' | 'orders' | 'users' | 'reviews';
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

function json(value: unknown) { return JSON.stringify(value ?? {}, null, 2); }
function Card({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p></div>;
}

export function AdminPage() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AdminView>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [productJson, setProductJson] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [p, o, u, r] = await Promise.all([adminApi.products(), adminApi.orders(), adminApi.users(), adminApi.reviews()]);
      setProducts(Array.isArray(p.data) ? p.data : []); setOrders(Array.isArray(o.data) ? o.data : []); setUsers(Array.isArray(u.data) ? u.data : []); setReviews(Array.isArray(r.data) ? r.data : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load admin data'); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { if (user?.role === 'admin') void load(); }, [user?.role, load]);
  const stats = useMemo(() => ({ products: products.length, orders: orders.length, users: users.length, reviews: reviews.length }), [products, orders, users, reviews]);
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  const createProduct = async () => { try { await adminApi.createProduct(JSON.parse(productJson)); setProductJson(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Invalid product JSON'); } };
  const updateProduct = async () => { try { const value = JSON.parse(productJson); if (!value.item_group_id) throw new Error('item_group_id is required'); await adminApi.updateProduct(value.item_group_id, value); setProductJson(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Invalid product JSON'); } };

  return (
    <main className="w-full max-w-[500px] mx-auto min-h-full bg-gray-50 flex flex-col">
      <div className="w-full flex-1 overflow-y-auto pb-8 p-4">
        <div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-semibold text-gray-900">Admin</h1><p className="text-sm text-gray-500">Apple Store Malaysia</p></div><button onClick={() => void load()} disabled={busy} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">{busy ? 'Loading…' : 'Refresh'}</button></div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {view === 'dashboard' && <section className="mt-5"><div className="grid grid-cols-2 gap-3"><Card label="Products" value={stats.products} /><Card label="Orders" value={stats.orders} /><Card label="Users" value={stats.users} /><Card label="Reviews" value={stats.reviews} /></div><div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4"><h2 className="font-semibold">Overview</h2><p className="mt-2 text-sm text-gray-500">Manage products, orders, users and reviews from the admin views.</p></div></section>}

        {view === 'products' && <section className="mt-5 space-y-3"><div className="rounded-2xl border border-gray-200 bg-white p-4"><h2 className="font-semibold">Product CRUD</h2><textarea value={productJson} onChange={(e) => setProductJson(e.target.value)} placeholder="Paste product JSON" className="mt-3 h-44 w-full rounded-xl border border-gray-200 p-3 font-mono text-xs" /><div className="mt-3 flex gap-2"><button onClick={() => void createProduct()} className="flex-1 rounded-xl bg-black px-3 py-2 text-sm text-white">Create</button><button onClick={() => void updateProduct()} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm">Update</button></div></div>{products.map((p) => <div key={p.item_group_id} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{p.title || p.item_group_id}</p><p className="text-xs text-gray-500">{p.item_group_id}</p></div><button onClick={() => setProductJson(json(p))} className="text-sm underline">Edit</button></div><button onClick={async () => { if (window.confirm(`Delete ${p.title || p.item_group_id}?`)) { try { await adminApi.deleteProduct(p.item_group_id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } } }} className="mt-3 text-sm text-red-600">Delete</button></div>)}</section>}
        {view === 'orders' && <section className="mt-5 space-y-3">{orders.map((o) => <div key={String(o.id)} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">Order #{o.id}</p><p className="text-sm text-gray-500">{o.phone || 'Guest'} · RM {Number(o.total || 0).toFixed(2)}</p></div><select value={o.status || 'pending'} onChange={async (e) => { try { await adminApi.updateOrderStatus(o.id, e.target.value); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Status update failed'); } }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div></div>)}</section>}
        {view === 'users' && <section className="mt-5 space-y-3">{users.map((u) => <div key={u.phone} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4"><div><p className="font-medium">{u.name || u.phone}</p><p className="text-xs text-gray-500">{u.phone}</p></div><select value={u.role || 'customer'} onChange={async (e) => { try { await adminApi.updateUserRole(u.phone, e.target.value); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Role update failed'); } }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm"><option value="customer">customer</option><option value="admin">admin</option></select></div>)}</section>}
        {view === 'reviews' && <section className="mt-5 space-y-3">{reviews.map((r) => <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{r.name} · {r.rating}/5</p><p className="mt-1 text-sm text-gray-600">{r.comment}</p><p className="mt-1 text-xs text-gray-400">{r.item_group_id} · {r.phone}</p></div><button onClick={async () => { if (window.confirm('Delete this review?')) { try { await adminApi.deleteReview(r.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } } }} className="text-sm text-red-600">Delete</button></div></div>)}</section>}
      </div>
      <div className="w-full shrink-0"><AdminBottomNav activeView={view} onViewChange={setView} /></div>
    </main>
  );
}
