import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { adminApi } from '../services/adminApi.ts';
import { AdminBottomNav } from '../components/AdminBottomNav.tsx';

type AdminView = 'dashboard' | 'products' | 'orders' | 'users' | 'reviews';
type ProductForm = {
  item_group_id: string; title: string; description: string; availability: string; condition: string; brand: string; link: string;
  google_product_category: string; product_type: string; quantity_to_sell_on_facebook: string;
  custom_label_0: string; custom_label_1: string; custom_label_2: string; custom_label_3: string; custom_label_4: string; custom_label_5: string;
  variant_color: { color: string; image_link: string; additional_image_link: string }[];
  variant_size: { size: string; price: string; sale_price: string }[];
  main_features: string[]; sub_features: string[]; headline: string;
  rating: { count: string; average: string }; reviews: { count: string };
  created_at: string; updated_at: string;
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const emptyForm = (): ProductForm => ({
  item_group_id: '', title: '', description: '', availability: '', condition: '', brand: '', link: '', google_product_category: '', product_type: '', quantity_to_sell_on_facebook: '',
  custom_label_0: '', custom_label_1: '', custom_label_2: '', custom_label_3: '', custom_label_4: '', custom_label_5: '',
  variant_color: [{ color: '', image_link: '', additional_image_link: '' }], variant_size: [{ size: '', price: '', sale_price: '' }],
  main_features: [''], sub_features: [''], headline: '', rating: { count: '', average: '' }, reviews: { count: '' }, created_at: '', updated_at: '',
});
const str = (v: unknown) => v == null ? '' : String(v);

function Field({ label, type = 'text', value, onChange, readOnly = false }: { label: string; type?: string; value: string; onChange?: (v: string) => void; readOnly?: boolean }) {
  const cls = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-400';
  return <label className="block text-sm text-gray-700"><span>{label}</span>{type === 'textarea' ? <textarea value={value} onChange={e => onChange?.(e.target.value)} readOnly={readOnly} className={`${cls} min-h-24 resize-y`} /> : <input type={type} value={value} onChange={e => onChange?.(e.target.value)} readOnly={readOnly} className={cls} />}</label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4"><h2 className="font-semibold text-gray-900">{title}</h2>{children}</section>; }
function Card({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>; }

function productToForm(p: any): ProductForm {
  const colors = Array.isArray(p.variant_color) && p.variant_color.length ? p.variant_color : emptyForm().variant_color;
  const sizes = Array.isArray(p.variant_size) && p.variant_size.length ? p.variant_size : emptyForm().variant_size;
  const main = Array.isArray(p.main_features) && p.main_features.length ? p.main_features : [''];
  const sub = Array.isArray(p.sub_features) && p.sub_features.length ? p.sub_features : [''];
  return {
    ...emptyForm(), item_group_id: str(p.item_group_id), title: str(p.title), description: str(p.description), availability: str(p.availability), condition: str(p.condition), brand: str(p.brand), link: str(p.link), google_product_category: str(p.google_product_category), product_type: str(p.product_type), quantity_to_sell_on_facebook: str(p.quantity_to_sell_on_facebook),
    custom_label_0: str(p.custom_label_0), custom_label_1: str(p.custom_label_1), custom_label_2: str(p.custom_label_2), custom_label_3: str(p.custom_label_3), custom_label_4: str(p.custom_label_4), custom_label_5: str(p.custom_label_5),
    variant_color: colors.map((v: any) => ({ color: str(v.color), image_link: str(v.image_link), additional_image_link: str(v.additional_image_link) })),
    variant_size: sizes.map((v: any) => ({ size: str(v.size), price: str(v.price), sale_price: str(v.sale_price) })),
    main_features: main.map(str), sub_features: sub.map(str), headline: str(p.headline), rating: { count: str(p.rating?.count), average: str(p.rating?.average) }, reviews: { count: str(p.reviews?.count) }, created_at: str(p.created_at), updated_at: str(p.updated_at),
  };
}
function formToProduct(f: ProductForm) {
  const num = (v: string) => v === '' ? null : Number(v);
  return {
    item_group_id: f.item_group_id.trim(), title: f.title.trim(), description: f.description, availability: f.availability.trim(), condition: f.condition.trim(), brand: f.brand.trim(), link: f.link.trim(), google_product_category: f.google_product_category.trim(), product_type: f.product_type.trim(), quantity_to_sell_on_facebook: num(f.quantity_to_sell_on_facebook),
    custom_label_0: f.custom_label_0, custom_label_1: f.custom_label_1, custom_label_2: f.custom_label_2, custom_label_3: f.custom_label_3, custom_label_4: f.custom_label_4, custom_label_5: f.custom_label_5,
    variant_color: f.variant_color.filter(v => v.color || v.image_link || v.additional_image_link), variant_size: f.variant_size.filter(v => v.size || v.price || v.sale_price).map(v => ({ size: v.size, price: num(v.price), sale_price: num(v.sale_price) })),
    main_features: f.main_features.map(v => v.trim()).filter(Boolean), sub_features: f.sub_features.map(v => v.trim()).filter(Boolean), headline: f.headline, rating: { count: num(f.rating.count), average: num(f.rating.average) }, reviews: { count: num(f.reviews.count) },
  };
}

function ProductForm({ form, setForm }: { form: ProductForm; setForm: React.Dispatch<React.SetStateAction<ProductForm>> }) {
  const set = (key: keyof ProductForm, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));
  const labels = Array.from({ length: 6 }, (_, i) => `custom_label_${i}` as keyof ProductForm);
  const updateColor = (i: number, key: keyof ProductForm['variant_color'][number], value: string) => set('variant_color', form.variant_color.map((v, n) => n === i ? { ...v, [key]: value } : v));
  const updateSize = (i: number, key: keyof ProductForm['variant_size'][number], value: string) => set('variant_size', form.variant_size.map((v, n) => n === i ? { ...v, [key]: value } : v));
  const remove = (key: 'variant_color' | 'variant_size' | 'main_features' | 'sub_features', i: number) => set(key, form[key].filter((_, n) => n !== i));
  return <div className="space-y-4">
    <Section title="Basic Information"><Field label="Item Group ID" value={form.item_group_id} onChange={v => set('item_group_id', v)} /><Field label="Title" value={form.title} onChange={v => set('title', v)} /><Field label="Description" type="textarea" value={form.description} onChange={v => set('description', v)} /><div className="grid grid-cols-2 gap-3"><Field label="Availability" value={form.availability} onChange={v => set('availability', v)} /><Field label="Condition" value={form.condition} onChange={v => set('condition', v)} /><Field label="Brand" value={form.brand} onChange={v => set('brand', v)} /><Field label="Product Type" value={form.product_type} onChange={v => set('product_type', v)} /><Field label="Product Link" type="url" value={form.link} onChange={v => set('link', v)} /><Field label="Google Product Category" value={form.google_product_category} onChange={v => set('google_product_category', v)} /><Field label="Quantity to Sell on Facebook" type="number" value={form.quantity_to_sell_on_facebook} onChange={v => set('quantity_to_sell_on_facebook', v)} /></div></Section>
    <Section title="Custom Labels"><div className="grid grid-cols-2 gap-3">{labels.map(k => <Field key={String(k)} label={`Custom Label ${String(k).slice(-1)}`} value={String(form[k])} onChange={v => set(k, v)} />)}</div></Section>
    <Section title="Color Variants">{form.variant_color.map((v, i) => <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3"><Field label="Color" value={v.color} onChange={x => updateColor(i, 'color', x)} /><Field label="Image Link" type="url" value={v.image_link} onChange={x => updateColor(i, 'image_link', x)} /><Field label="Additional Image Link" type="url" value={v.additional_image_link} onChange={x => updateColor(i, 'additional_image_link', x)} /><button type="button" onClick={() => remove('variant_color', i)} disabled={form.variant_color.length === 1} className="text-sm text-red-600 disabled:opacity-40">Remove</button></div>)}<button type="button" onClick={() => set('variant_color', [...form.variant_color, { color: '', image_link: '', additional_image_link: '' }])} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">+ Add Color Variant</button></Section>
    <Section title="Size & Price Variants">{form.variant_size.map((v, i) => <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3"><Field label="Size" value={v.size} onChange={x => updateSize(i, 'size', x)} /><div className="grid grid-cols-2 gap-3"><Field label="Price" type="number" value={v.price} onChange={x => updateSize(i, 'price', x)} /><Field label="Sale Price" type="number" value={v.sale_price} onChange={x => updateSize(i, 'sale_price', x)} /></div><button type="button" onClick={() => remove('variant_size', i)} disabled={form.variant_size.length === 1} className="text-sm text-red-600 disabled:opacity-40">Remove</button></div>)}<button type="button" onClick={() => set('variant_size', [...form.variant_size, { size: '', price: '', sale_price: '' }])} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">+ Add Size Variant</button></Section>
    <Section title="Features"><div><p className="mb-2 text-sm font-medium">Main Features</p>{form.main_features.map((v, i) => <div key={i} className="mb-2 flex gap-2"><input value={v} onChange={e => set('main_features', form.main_features.map((x, n) => n === i ? e.target.value : x))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><button type="button" onClick={() => remove('main_features', i)} disabled={form.main_features.length === 1} className="text-sm text-red-600 disabled:opacity-40">Remove</button></div>)}<button type="button" onClick={() => set('main_features', [...form.main_features, ''])} className="text-sm underline">+ Add Main Feature</button></div><div><p className="mb-2 text-sm font-medium">Sub Features</p>{form.sub_features.map((v, i) => <div key={i} className="mb-2 flex gap-2"><input value={v} onChange={e => set('sub_features', form.sub_features.map((x, n) => n === i ? e.target.value : x))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><button type="button" onClick={() => remove('sub_features', i)} disabled={form.sub_features.length === 1} className="text-sm text-red-600 disabled:opacity-40">Remove</button></div>)}<button type="button" onClick={() => set('sub_features', [...form.sub_features, ''])} className="text-sm underline">+ Add Sub Feature</button></div></Section>
    <Section title="Marketing"><Field label="Headline" value={form.headline} onChange={v => set('headline', v)} /></Section>
    <Section title="Rating"><div className="grid grid-cols-2 gap-3"><Field label="Rating Count" type="number" value={form.rating.count} onChange={v => set('rating', { ...form.rating, count: v })} /><Field label="Rating Average" type="number" value={form.rating.average} onChange={v => set('rating', { ...form.rating, average: v })} /></div></Section>
    <Section title="Reviews"><Field label="Reviews Count" type="number" value={form.reviews.count} onChange={v => set('reviews', { count: v })} /></Section>
    <Section title="System"><div className="grid grid-cols-2 gap-3"><Field label="Created At" type="datetime-local" value={form.created_at} readOnly /><Field label="Updated At" type="datetime-local" value={form.updated_at} readOnly /></div></Section>
  </div>;
}

export function AdminPage() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<AdminView>('dashboard');
  const [products, setProducts] = useState<any[]>([]); const [orders, setOrders] = useState<any[]>([]); const [users, setUsers] = useState<any[]>([]); const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm()); const [editing, setEditing] = useState(false); const [productCrudOpen, setProductCrudOpen] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setBusy(true); setError(''); try { const [p, o, u, r] = await Promise.all([adminApi.products(), adminApi.orders(), adminApi.users(), adminApi.reviews()]); setProducts(Array.isArray(p.data) ? p.data : []); setOrders(Array.isArray(o.data) ? o.data : []); setUsers(Array.isArray(u.data) ? u.data : []); setReviews(Array.isArray(r.data) ? r.data : []); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load admin data'); } finally { setBusy(false); } }, []);
  useEffect(() => { if (user?.role === 'admin') void load(); }, [user?.role, load]);
  const stats = useMemo(() => ({ products: products.length, orders: orders.length, users: users.length, reviews: reviews.length }), [products, orders, users, reviews]);
  if (loading) return null; if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  const createProduct = async () => { try { const value = formToProduct(form); if (!value.item_group_id) throw new Error('Item Group ID is required'); await adminApi.createProduct(value); setForm(emptyForm()); setEditing(false); setProductCrudOpen(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Create failed'); } };
  const updateProduct = async () => { try { const value = formToProduct(form); if (!value.item_group_id) throw new Error('Item Group ID is required'); await adminApi.updateProduct(value.item_group_id, value); setEditing(false); setProductCrudOpen(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Update failed'); } };
  const editProduct = (p: any) => { setForm(productToForm(p)); setEditing(true); setProductCrudOpen(true); setView('products'); };
  const deleteProduct = async (id: string) => { if (!window.confirm(`Delete ${id}?`)) return; try { await adminApi.deleteProduct(id); if (form.item_group_id === id) { setForm(emptyForm()); setEditing(false); } await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } };

  const productPage = view === 'products';
  const productCrudMode = productPage && productCrudOpen;
  const closeProductCrud = () => { setProductCrudOpen(false); setForm(emptyForm()); setEditing(false); };

  return <main className="w-full max-w-[500px] mx-auto h-full min-h-[100dvh] bg-gray-50 flex flex-col">
    {productCrudMode ? <header className="w-full shrink-0 border-b border-gray-200 bg-white px-4 py-3"><div className="flex items-center justify-between gap-3"><h1 className="text-lg font-semibold text-gray-900">Product CRUD</h1><button type="button" onClick={closeProductCrud} aria-label="Close Product CRUD" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-lg leading-none text-gray-700">×</button></div></header> : <header className="w-full shrink-0 border-b border-gray-200 bg-white px-4 py-3"><div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">Admin</h1><p className="text-sm text-gray-500">Apple Store Malaysia</p></div><div className="flex items-center gap-2"><button onClick={() => void load()} disabled={busy} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">{busy ? 'Loading…' : 'Refresh'}</button><button type="button" onClick={logout} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600">Logout</button></div></div></header>}
    {error && <div className="w-full shrink-0 px-4 pt-3"><div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div></div>}
    <div className="w-full flex-1 min-h-0 overflow-y-auto p-4 pb-6">
      {view === 'dashboard' && <section className="space-y-4"><div className="grid grid-cols-2 gap-3"><Card label="Products" value={stats.products} /><Card label="Orders" value={stats.orders} /><Card label="Users" value={stats.users} /><Card label="Reviews" value={stats.reviews} /></div><Section title="Overview"><p className="text-sm text-gray-500">Manage products, orders, users and reviews from the admin views.</p></Section></section>}
      {view === 'products' && !productCrudOpen && <section className="space-y-4"><Section title="Product List"><div className="mb-3 flex justify-end"><button type="button" onClick={() => { setForm(emptyForm()); setEditing(false); setProductCrudOpen(true); }} className="rounded-xl bg-black px-3 py-2 text-sm text-white">+ New Product</button></div>{products.length === 0 ? <p className="text-sm text-gray-500">No products.</p> : <div className="space-y-2">{products.map(p => <div key={p.item_group_id} className="rounded-xl border border-gray-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{p.title || p.item_group_id}</p><p className="text-xs text-gray-500">{p.item_group_id}</p></div><button type="button" onClick={() => editProduct(p)} className="text-sm underline">Edit</button></div><button type="button" onClick={() => void deleteProduct(p.item_group_id)} className="mt-2 text-sm text-red-600">Delete</button></div>)}</div>}</Section></section>}
      {view === 'products' && productCrudOpen && <ProductForm form={form} setForm={setForm}/>} 
      {view === 'orders' && <section className="space-y-3">{orders.map(o => <div key={String(o.id)} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">Order #{o.id}</p><p className="text-sm text-gray-500">{o.phone || 'Guest'} · RM {Number(o.total || 0).toFixed(2)}</p></div><select value={o.status || 'pending'} onChange={async e => { try { await adminApi.updateOrderStatus(o.id, e.target.value); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Status update failed'); } }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div></div>)}</section>}
      {view === 'users' && <section className="space-y-3">{users.map(u => <div key={u.phone} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4"><div><p className="font-medium">{u.name || u.phone}</p><p className="text-xs text-gray-500">{u.phone}</p></div><select value={u.role || 'customer'} onChange={async e => { try { await adminApi.updateUserRole(u.phone, e.target.value); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Role update failed'); } }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm"><option value="customer">customer</option><option value="admin">admin</option></select></div>)}</section>}
      {view === 'reviews' && <section className="space-y-3">{reviews.map(r => <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{r.name} · {r.rating}/5</p><p className="mt-1 text-sm text-gray-600">{r.comment}</p><p className="mt-1 text-xs text-gray-400">{r.item_group_id} · {r.phone}</p></div><button onClick={async () => { if (!window.confirm('Delete this review?')) return; try { await adminApi.deleteReview(r.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } }} className="text-sm text-red-600">Delete</button></div></div>)}</section>}
    </div>
    {productCrudMode && <div className="w-full shrink-0 border-t border-gray-200 bg-white p-3"><div className="flex gap-2"><button type="button" onClick={() => void createProduct()} disabled={busy} className="flex-1 rounded-xl bg-black px-3 py-3 text-sm font-medium text-white disabled:opacity-50">Create</button><button type="button" onClick={() => void updateProduct()} disabled={busy || !editing} className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium disabled:opacity-50">Update</button></div></div>}
    {!productCrudMode && <div className="w-full shrink-0"><AdminBottomNav activeView={view} onViewChange={setView} /></div>}
  </main>;
}
