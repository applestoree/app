import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  App,
  Badge,
  Block,
  BlockTitle,
  Button,
  Dialog,
  DialogButton,
  KonstaProvider,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Toggle,
  Toolbar,
  ToolbarPane,
} from 'konsta/react';
import { useAuth } from '../context/AuthContext.tsx';
import { adminApi } from '../services/adminApi.ts';
import { AdminBottomNav } from '../components/AdminBottomNav.tsx';

type AdminView = 'dashboard' | 'products' | 'orders' | 'users' | 'reviews';
type ProductForm = {
  item_group_id: string; title: string; description: string; availability: string; condition: string; brand: string; link: string;
  google_product_category: string; product_type: string; quantity_to_sell_on_facebook: string;
  custom_label_0: string; custom_label_1: string; custom_label_2: string; custom_label_3: string; custom_label_4: string; custom_label_5: string;
  variant_color: { color: string; image_link: string; additional_image_link: string }[];
  variant_size: { size: string; price: string; sale_price: string; discount_is_active: boolean; discount: string }[];
  main_features: string[]; sub_features: string[]; headline: string;
  rating: { count: string; average: string }; reviews: { count: string };
  created_at: string; updated_at: string;
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const PAYMENT_METHODS = ['duitnow_qr', 'transferbank'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'cancelled'];
const emptySize = () => ({ size: '', price: '', sale_price: '', discount_is_active: false, discount: '' });
const emptyForm = (): ProductForm => ({
  item_group_id: '', title: '', description: '', availability: '', condition: '', brand: '', link: '', google_product_category: '', product_type: '', quantity_to_sell_on_facebook: '',
  custom_label_0: '', custom_label_1: '', custom_label_2: '', custom_label_3: '', custom_label_4: '', custom_label_5: '',
  variant_color: [{ color: '', image_link: '', additional_image_link: '' }], variant_size: [emptySize()],
  main_features: [''], sub_features: [''], headline: '', rating: { count: '', average: '' }, reviews: { count: '' }, created_at: '', updated_at: '',
});
const str = (v: unknown) => v == null ? '' : String(v);
const money = (v: unknown) => `RM ${Number(v || 0).toFixed(2)}`;
const jsonObject = (v: unknown): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, any> : {};
const jsonArray = (v: unknown): any[] => Array.isArray(v) ? v : [];

function Field({ label, type = 'text', value, onChange, readOnly = false, min, max, step, inputClassName }: { label: string; type?: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; min?: string; max?: string; step?: string; inputClassName?: string }) {
  return <ListInput outline label={label} type={type} value={value} readOnly={readOnly} min={min} max={max} step={step} inputClassName={inputClassName} onChange={e => onChange?.(e.target.value)} />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <ListInput outline label={label} type="select" dropdown value={value} onChange={e => onChange(e.target.value)}>
    <option value="">—</option>
    {options.map(option => <option key={option} value={option}>{option}</option>)}
  </ListInput>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <>
    <BlockTitle>{title}</BlockTitle>
    <Block strong inset outline>{children}</Block>
  </>;
}

function productToForm(p: any): ProductForm {
  const colors = Array.isArray(p.variant_color) && p.variant_color.length ? p.variant_color : emptyForm().variant_color;
  const sizes = Array.isArray(p.variant_size) && p.variant_size.length ? p.variant_size : emptyForm().variant_size;
  const main = Array.isArray(p.main_features) && p.main_features.length ? p.main_features : [''];
  const sub = Array.isArray(p.sub_features) && p.sub_features.length ? p.sub_features : [''];
  return {
    ...emptyForm(), item_group_id: str(p.item_group_id), title: str(p.title), description: str(p.description), availability: str(p.availability), condition: str(p.condition), brand: str(p.brand), link: str(p.link), google_product_category: str(p.google_product_category), product_type: str(p.product_type), quantity_to_sell_on_facebook: str(p.quantity_to_sell_on_facebook),
    custom_label_0: str(p.custom_label_0), custom_label_1: str(p.custom_label_1), custom_label_2: str(p.custom_label_2), custom_label_3: str(p.custom_label_3), custom_label_4: str(p.custom_label_4), custom_label_5: str(p.custom_label_5),
    variant_color: colors.map((v: any) => ({ color: str(v.color), image_link: str(v.image_link), additional_image_link: str(v.additional_image_link) })),
    variant_size: sizes.map((v: any) => ({ size: str(v.size), price: str(v.price), sale_price: str(v.sale_price), discount_is_active: v.discount_is_active === true, discount: str(v.discount) })),
    main_features: main.map(str), sub_features: sub.map(str), headline: str(p.headline), rating: { count: str(p.rating?.count), average: str(p.rating?.average) }, reviews: { count: str(p.reviews?.count) }, created_at: str(p.created_at), updated_at: str(p.updated_at),
  };
}

function formToProduct(f: ProductForm) {
  const num = (v: string) => v === '' ? null : Number(v);
  const variant_size = f.variant_size.filter(v => v.size || v.price || v.sale_price).map(v => {
    const price = num(v.price); const salePrice = num(v.sale_price); const discount = v.discount === '' ? null : Number(v.discount);
    if (price != null && salePrice != null && !(price > salePrice)) throw new Error(`Variant size ${v.size || '(unnamed)'}: Price must be greater than Sale Price`);
    if (v.discount_is_active && (discount == null || discount < 0 || discount > 100)) throw new Error(`Variant size ${v.size || '(unnamed)'}: Discount must be between 0 and 100%`);
    return { size: v.size, price, sale_price: salePrice, discount_is_active: v.discount_is_active, discount };
  });
  return {
    item_group_id: f.item_group_id.trim(), title: f.title.trim(), description: f.description, availability: f.availability.trim(), condition: f.condition.trim(), brand: f.brand.trim(), link: f.link.trim(), google_product_category: f.google_product_category.trim(), product_type: f.product_type.trim(), quantity_to_sell_on_facebook: num(f.quantity_to_sell_on_facebook),
    custom_label_0: f.custom_label_0, custom_label_1: f.custom_label_1, custom_label_2: f.custom_label_2, custom_label_3: f.custom_label_3, custom_label_4: f.custom_label_4, custom_label_5: f.custom_label_5,
    variant_color: f.variant_color.filter(v => v.color || v.image_link || v.additional_image_link), variant_size,
    main_features: f.main_features.map(v => v.trim()).filter(Boolean), sub_features: f.sub_features.map(v => v.trim()).filter(Boolean), headline: f.headline, rating: { count: num(f.rating.count), average: num(f.rating.average) }, reviews: { count: num(f.reviews.count) },
  };
}

function ProductForm({ form, setForm }: { form: ProductForm; setForm: React.Dispatch<React.SetStateAction<ProductForm>> }) {
  const set = (key: keyof ProductForm, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));
  const labels = Array.from({ length: 6 }, (_, i) => `custom_label_${i}` as keyof ProductForm);
  const updateColor = (i: number, key: keyof ProductForm['variant_color'][number], value: string) => set('variant_color', form.variant_color.map((v, n) => n === i ? { ...v, [key]: value } : v));
  const updateSize = (i: number, key: keyof ProductForm['variant_size'][number], value: string | boolean) => set('variant_size', form.variant_size.map((v, n) => n === i ? { ...v, [key]: value } : v));
  const updateSizeDiscount = (i: number, value: string) => set('variant_size', form.variant_size.map((v, n) => { if (n !== i) return v; const price = Number(v.price); const discount = Number(value); const salePrice = Number.isFinite(price) && Number.isFinite(discount) ? Math.round((price - (price * discount / 100)) * 100) / 100 : v.sale_price; return { ...v, discount: value, sale_price: value === '' ? v.sale_price : String(salePrice) }; }));
  const toggleSizeDiscount = (i: number, active: boolean) => set('variant_size', form.variant_size.map((v, n) => { if (n !== i) return v; if (!active) return { ...v, discount_is_active: false, discount: '' }; const discount = v.discount === '' ? '10' : v.discount; const price = Number(v.price); const salePrice = Number.isFinite(price) ? Math.round((price - (price * Number(discount) / 100)) * 100) / 100 : v.sale_price; return { ...v, discount_is_active: true, discount, sale_price: String(salePrice) }; }));
  const updateSizePrice = (i: number, value: string) => set('variant_size', form.variant_size.map((v, n) => { if (n !== i) return v; if (!v.discount_is_active || v.discount === '') return { ...v, price: value }; const price = Number(value); const discount = Number(v.discount); const salePrice = Number.isFinite(price) && Number.isFinite(discount) ? Math.round((price - (price * discount / 100)) * 100) / 100 : ''; return { ...v, price: value, sale_price: String(salePrice) }; }));
  const remove = (key: 'variant_color' | 'variant_size' | 'main_features' | 'sub_features', i: number) => set(key, form[key].filter((_, n) => n !== i));

  return <>
    <Section title="Basic Information">
      <List inset strong>
        <Field label="Item Group ID" value={form.item_group_id} onChange={v => set('item_group_id', v)} />
        <Field label="Title" value={form.title} onChange={v => set('title', v)} />
        <Field label="Description" type="textarea" value={form.description} onChange={v => set('description', v)} inputClassName="!min-h-24" />
        <Field label="Availability" value={form.availability} onChange={v => set('availability', v)} />
        <Field label="Condition" value={form.condition} onChange={v => set('condition', v)} />
        <Field label="Brand" value={form.brand} onChange={v => set('brand', v)} />
        <Field label="Product Type" value={form.product_type} onChange={v => set('product_type', v)} />
        <Field label="Product Link" type="url" value={form.link} onChange={v => set('link', v)} />
        <Field label="Google Product Category" value={form.google_product_category} onChange={v => set('google_product_category', v)} />
        <Field label="Quantity to Sell on Facebook" type="number" value={form.quantity_to_sell_on_facebook} onChange={v => set('quantity_to_sell_on_facebook', v)} />
      </List>
    </Section>
    <Section title="Custom Labels"><List inset strong>{labels.map(k => <Field key={String(k)} label={`Custom Label ${String(k).slice(-1)}`} value={String(form[k])} onChange={v => set(k, v)} />)}</List></Section>
    <Section title="Color Variants">
      {form.variant_color.map((v, i) => <List key={i} inset strong>
        <Field label="Color" value={v.color} onChange={x => updateColor(i, 'color', x)} />
        <Field label="Image Link" type="url" value={v.image_link} onChange={x => updateColor(i, 'image_link', x)} />
        <Field label="Additional Image Link" type="url" value={v.additional_image_link} onChange={x => updateColor(i, 'additional_image_link', x)} />
        <ListItem title="Remove variant" after={<Button clear disabled={form.variant_color.length === 1} onClick={() => remove('variant_color', i)}>Remove</Button>} />
      </List>)}
      <Button outline rounded onClick={() => set('variant_color', [...form.variant_color, { color: '', image_link: '', additional_image_link: '' }])}>Add Color Variant</Button>
    </Section>
    <Section title="Size & Price Variants">
      {form.variant_size.map((v, i) => <List key={i} inset strong>
        <Field label="Size" value={v.size} onChange={x => updateSize(i, 'size', x)} />
        <Field label="Price" type="number" value={v.price} onChange={x => updateSizePrice(i, x)} />
        <Field label="Sale Price" type="number" value={v.sale_price} onChange={x => updateSize(i, 'sale_price', x)} readOnly={v.discount_is_active} />
        <ListItem title="Discount Active" after={<Toggle checked={v.discount_is_active} onChange={() => toggleSizeDiscount(i, !v.discount_is_active)} />} />
        {v.discount_is_active && <Field label="Discount (%)" type="number" value={v.discount} min="0" max="100" step="0.01" onChange={x => updateSizeDiscount(i, x)} />}
        <ListItem title="Remove variant" after={<Button clear disabled={form.variant_size.length === 1} onClick={() => remove('variant_size', i)}>Remove</Button>} />
      </List>)}
      <Button outline rounded onClick={() => set('variant_size', [...form.variant_size, emptySize()])}>Add Size Variant</Button>
    </Section>
    <Section title="Features">
      <BlockTitle>Main Features</BlockTitle>
      <List inset strong>{form.main_features.map((v, i) => <React.Fragment key={`main-${i}`}><Field label={`Feature ${i + 1}`} value={v} onChange={value => set('main_features', form.main_features.map((x, n) => n === i ? value : x))} /><ListItem title="Remove" after={<Button clear disabled={form.main_features.length === 1} onClick={() => remove('main_features', i)}>Remove</Button>} /></React.Fragment>)}</List>
      <Button clear onClick={() => set('main_features', [...form.main_features, ''])}>Add Main Feature</Button>
      <BlockTitle>Sub Features</BlockTitle>
      <List inset strong>{form.sub_features.map((v, i) => <React.Fragment key={`sub-${i}`}><Field label={`Feature ${i + 1}`} value={v} onChange={value => set('sub_features', form.sub_features.map((x, n) => n === i ? value : x))} /><ListItem title="Remove" after={<Button clear disabled={form.sub_features.length === 1} onClick={() => remove('sub_features', i)}>Remove</Button>} /></React.Fragment>)}</List>
      <Button clear onClick={() => set('sub_features', [...form.sub_features, ''])}>Add Sub Feature</Button>
    </Section>
    <Section title="Marketing"><List inset strong><Field label="Headline" value={form.headline} onChange={v => set('headline', v)} /></List></Section>
    <Section title="Rating"><List inset strong><Field label="Rating Count" type="number" value={form.rating.count} onChange={v => set('rating', { ...form.rating, count: v })} /><Field label="Rating Average" type="number" value={form.rating.average} onChange={v => set('rating', { ...form.rating, average: v })} /></List></Section>
    <Section title="Reviews"><List inset strong><Field label="Reviews Count" type="number" value={form.reviews.count} onChange={v => set('reviews', { count: v })} /></List></Section>
    <Section title="System"><List inset strong><Field label="Created At" type="datetime-local" value={form.created_at} readOnly /><Field label="Updated At" type="datetime-local" value={form.updated_at} readOnly /></List></Section>
  </>;
}

function OrdersView({ orders, selectedOrder, onSelectOrder, onStatusChange, onPaymentChange }: { orders: any[]; selectedOrder: any | null; onSelectOrder: (order: any | null) => void; onStatusChange: (id: number | string, status: string) => Promise<void>; onPaymentChange: (id: number | string, payment: any) => Promise<void> }) {
  if (selectedOrder) {
    const o = selectedOrder; const address = jsonObject(o.address); const store = jsonObject(o.store); const shipping = jsonObject(o.shipping); const voucher = jsonObject(o.voucher); const payment = jsonObject(o.payment); const items = jsonArray(o.items);
    const deliveryType = str(shipping.delivery_type || shipping.type || (Object.keys(store).length ? 'store_pickup' : ''));
    const destination = deliveryType === 'store_pickup' ? (store.address || store.name || 'Store pickup') : (address.address || [address.city, address.state, address.postcode].filter(Boolean).join(', ') || 'Address not provided');
    return <>
      <Navbar title={`Order #${o.id}`} left={<Button clear onClick={() => onSelectOrder(null)}>Back</Button>} />
      <Section title="Order"><List inset strong><ListItem title="Created At" after={o.created_at ? new Date(o.created_at).toLocaleString() : 'Date unavailable'} /><ListItem title="Customer" after={o.phone || 'Guest'} /><SelectField label="Status" value={o.status || 'pending'} options={ORDER_STATUSES} onChange={v => void onStatusChange(o.id, v)} /></List></Section>
      <Section title="Items"><List inset strong>{items.length ? items.map((item: any, index: number) => { const product = jsonObject(item.product); const title = item.title || product.title || item.name || item.item_group_id || `Item ${index + 1}`; const color = item.selectedColor || item.color || ''; const size = item.selectedSize || item.size || ''; const quantity = Number(item.quantity || 1); const price = item.sale_price ?? item.price ?? product.sale_price ?? product.price ?? 0; return <ListItem key={`${String(o.id)}-${index}`} title={title} subtitle={[color, size].filter(Boolean).join(' · ') || 'Variant unavailable'} after={`${money(Number(price) * quantity)} · Qty ${quantity}`} />; }) : <ListItem title="No item details." />}</List></Section>
      <Section title="Fulfillment"><List inset strong><ListItem title={deliveryType === 'store_pickup' ? 'Store Pickup' : 'Delivery'} subtitle={shipping.shipping_method || shipping.method || '—'} /><ListItem title="Destination" subtitle={destination} /></List></Section>
      <Section title="Payment"><List inset strong>
        <SelectField label="Method" value={payment.method || ''} options={PAYMENT_METHODS} onChange={value => void onPaymentChange(o.id, { ...payment, method: value })} />
        <SelectField label="Status" value={payment.status || ''} options={PAYMENT_STATUSES} onChange={value => void onPaymentChange(o.id, { ...payment, status: value })} />
        <ListItem title="DuitNow QR" after={<Toggle checked={payment.duitnow_qr?.is_active === true} onChange={() => void onPaymentChange(o.id, { ...payment, duitnow_qr: { ...jsonObject(payment.duitnow_qr), is_active: payment.duitnow_qr?.is_active !== true } })} />} />
        <Field label="DuitNow QR Image" type="url" value={str(payment.duitnow_qr?.img)} onChange={value => void onPaymentChange(o.id, { ...payment, duitnow_qr: { ...jsonObject(payment.duitnow_qr), img: value } })} />
        <ListItem title="Bank Transfer" after={<Toggle checked={payment.transferbank?.is_active === true} onChange={() => void onPaymentChange(o.id, { ...payment, transferbank: { ...jsonObject(payment.transferbank), is_active: payment.transferbank?.is_active !== true } })} />} />
        <Field label="Bank Name" value={str(payment.transferbank?.name)} onChange={value => void onPaymentChange(o.id, { ...payment, transferbank: { ...jsonObject(payment.transferbank), name: value } })} />
        <Field label="Bank Number" value={str(payment.transferbank?.number)} onChange={value => void onPaymentChange(o.id, { ...payment, transferbank: { ...jsonObject(payment.transferbank), number: value } })} />
      </List></Section>
      <Section title="Summary"><List inset strong><ListItem title="Subtotal" after={money(o.subtotal)} /><ListItem title="Shipping" after={money(o.shipping_fee || shipping.fee)} /><ListItem title="Discount" after={`- ${money(o.discount || voucher.discount)}`} /><ListItem title="Total" after={money(o.total)} /></List></Section>
      {(voucher.code || Number(o.discount || voucher.discount || 0) > 0) && <Section title="Voucher"><List inset strong><ListItem title={voucher.code || '—'} after={`Discount ${money(o.discount || voucher.discount)}`} /></List></Section>}
    </>;
  }
  return <Section title="Orders"><List inset strong><ListItem title="Order Count" after={<Badge>{orders.length}</Badge>} />{orders.length === 0 ? <ListItem title="No orders." /> : orders.map(o => { const shipping = jsonObject(o.shipping); const payment = jsonObject(o.payment); const store = jsonObject(o.store); const deliveryType = str(shipping.delivery_type || shipping.type || (Object.keys(store).length ? 'store_pickup' : '')); return <ListItem key={String(o.id)} title={`Order #${o.id}`} subtitle={`${o.phone || 'Guest'} · ${o.created_at ? new Date(o.created_at).toLocaleString() : 'Date unavailable'}`} text={`${deliveryType === 'store_pickup' ? 'Store Pickup' : 'Delivery'} · ${payment.method || 'Payment not set'}`} after={`${o.status || 'pending'} · ${money(o.total)}`} link onClick={() => onSelectOrder(o)} />; })}</List></Section>;
}

export function AdminPage() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<AdminView>('dashboard'); const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]); const [orders, setOrders] = useState<any[]>([]); const [users, setUsers] = useState<any[]>([]); const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm()); const [editing, setEditing] = useState(false); const [productCrudOpen, setProductCrudOpen] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [deleteId, setDeleteId] = useState<string | null>(null);
  const load = useCallback(async () => { setBusy(true); setError(''); try { const [p, o, u, r] = await Promise.all([adminApi.products(), adminApi.orders(), adminApi.users(), adminApi.reviews()]); setProducts(Array.isArray(p.data) ? p.data : []); setOrders(Array.isArray(o.data) ? o.data : []); setUsers(Array.isArray(u.data) ? u.data : []); setReviews(Array.isArray(r.data) ? r.data : []); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load admin data'); } finally { setBusy(false); } }, []);
  useEffect(() => { if (user?.role === 'admin') void load(); }, [user?.role, load]);
  const stats = useMemo(() => ({ products: products.length, orders: orders.length, users: users.length, reviews: reviews.length }), [products, orders, users, reviews]);
  if (loading) return null; if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  const createProduct = async () => { try { const value = formToProduct(form); if (!value.item_group_id) throw new Error('Item Group ID is required'); await adminApi.createProduct(value); setForm(emptyForm()); setEditing(false); setProductCrudOpen(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Create failed'); } };
  const updateProduct = async () => { try { const value = formToProduct(form); if (!value.item_group_id) throw new Error('Item Group ID is required'); await adminApi.updateProduct(value.item_group_id, value); setEditing(false); setProductCrudOpen(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Update failed'); } };
  const editProduct = (p: any) => { setForm(productToForm(p)); setEditing(true); setProductCrudOpen(true); setView('products'); };
  const deleteProduct = async (id: string) => { try { await adminApi.deleteProduct(id); if (form.item_group_id === id) { setForm(emptyForm()); setEditing(false); } setDeleteId(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); setDeleteId(null); } };
  const updateOrderStatus = async (id: number | string, status: string) => { try { await adminApi.updateOrderStatus(id, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Status update failed'); } };
  const updateOrderPayment = async (id: number | string, payment: any) => { try { await adminApi.updateOrderPayment(id, payment); setOrders(prev => prev.map(order => String(order.id) === String(id) ? { ...order, payment } : order)); setSelectedOrder(prev => prev && String(prev.id) === String(id) ? { ...prev, payment } : prev); } catch (e) { setError(e instanceof Error ? e.message : 'Payment update failed'); } };
  const productCrudMode = view === 'products' && productCrudOpen;
  const closeProductCrud = () => { setProductCrudOpen(false); setForm(emptyForm()); setEditing(false); };

  return <KonstaProvider theme="ios"><App theme="ios" className="w-full max-w-[500px] mx-auto"><Page className="w-full min-h-full flex flex-col">
    {!selectedOrder && <Navbar title={productCrudMode ? 'Product CRUD' : 'Admin'} subtitle={!productCrudMode ? 'Apple Store Malaysia' : undefined} right={!productCrudMode ? <><Button clear disabled={busy} onClick={() => void load()}>{busy ? 'Loading…' : 'Refresh'}</Button><Button clear onClick={logout}>Logout</Button></> : <Button clear onClick={closeProductCrud}>Close</Button>} />}
    {error && <Block strong inset outline><p>{error}</p></Block>}
    <main className="w-full flex-1 min-h-0 overflow-y-auto">
      {view === 'dashboard' && !selectedOrder && <><BlockTitle>Dashboard</BlockTitle><List strong inset outline><ListItem title="Products" after={<Badge>{stats.products}</Badge>} /><ListItem title="Orders" after={<Badge>{stats.orders}</Badge>} /><ListItem title="Users" after={<Badge>{stats.users}</Badge>} /><ListItem title="Reviews" after={<Badge>{stats.reviews}</Badge>} /></List><Block strong inset><p>Manage products, orders, users and reviews from the admin views.</p></Block></>}
      {view === 'products' && !productCrudOpen && <><BlockTitle>Products</BlockTitle><Block strong inset><Button rounded onClick={() => { setForm(emptyForm()); setEditing(false); setProductCrudOpen(true); }}>New Product</Button></Block><List strong inset outline>{products.length === 0 ? <ListItem title="No products." /> : products.map(p => <ListItem key={p.item_group_id} title={p.title || p.item_group_id} subtitle={p.item_group_id} text={p.variant_color?.[0]?.image_link ? 'Image available' : 'No image'} after={<><Button clear onClick={() => editProduct(p)}>Edit</Button><Button clear onClick={() => setDeleteId(p.item_group_id)}>Delete</Button></>} />)}</List></>}
      {view === 'products' && productCrudOpen && <ProductForm form={form} setForm={setForm} />}
      {view === 'orders' && <OrdersView orders={orders} selectedOrder={selectedOrder} onSelectOrder={setSelectedOrder} onStatusChange={updateOrderStatus} onPaymentChange={updateOrderPayment} />}
      {view === 'users' && <Section title="Users"><List strong inset outline>{users.length === 0 ? <ListItem title="No users." /> : users.map(u => <React.Fragment key={u.phone}><ListItem title={u.name || u.phone} subtitle={u.phone} /><SelectField label="Role" value={u.role || 'customer'} options={['customer', 'admin']} onChange={async value => { try { await adminApi.updateUserRole(u.phone, value); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Role update failed'); } }} /></React.Fragment>)}</List></Section>}
      {view === 'reviews' && <Section title="Reviews"><List strong inset outline>{reviews.length === 0 ? <ListItem title="No reviews." /> : reviews.map(r => <ListItem key={r.id} title={`${r.name || r.phone || 'Guest'} · ${r.rating}/5`} subtitle={r.comment} text={`${r.item_group_id || ''}${r.phone ? ` · ${r.phone}` : ''}`} after={<Button clear onClick={async () => { try { await adminApi.deleteReview(r.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } }}>Delete</Button>} />)}</List></Section>}
    </main>
    {productCrudMode && <Toolbar><ToolbarPane><Button rounded style={{ flex: 1 }} onClick={() => void createProduct()} disabled={busy}>{editing ? 'Create New' : 'Create'}</Button><Button rounded outline style={{ flex: 1 }} onClick={() => void updateProduct()} disabled={busy || !editing}>Update</Button></ToolbarPane></Toolbar>}
    {!productCrudMode && !selectedOrder && <AdminBottomNav activeView={view} onViewChange={setView} />}
  </Page><Dialog opened={deleteId !== null} onBackdropClick={() => setDeleteId(null)} title="Delete Product" content={deleteId ? `Delete ${deleteId}?` : ''} buttons={<><DialogButton onClick={() => setDeleteId(null)}>Cancel</DialogButton><DialogButton strong onClick={() => deleteId && void deleteProduct(deleteId)}>Delete</DialogButton></>} /></App></KonstaProvider>;
}
