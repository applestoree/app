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
import { Plus, Trash2, Layers, Sparkles, Sliders, ChevronRight, Image as ImageIcon, Info, Tag, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { adminApi } from '../services/adminApi.ts';
import { AdminBottomNav } from '../components/AdminBottomNav.tsx';
import { VariantSectionPage } from '../components/admin/VariantSectionPage.tsx';
import { OrdersView } from '../components/admin/OrdersView.tsx';
import { UsersView, AdminUser } from '../components/admin/UsersView.tsx';
import { appleApi } from '../services/appleApi.ts';
import {
  AdminSelectBottomSheetProvider,
  AdminSelectField,
} from '../components/admin/AdminSelectBottomSheet.tsx';

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

function Field({ label, type = 'text', value, onChange, readOnly = false, min, max, step, inputClassName }: { key?: React.Key; label: string; type?: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; min?: string; max?: string; step?: string; inputClassName?: string }) {
  return <ListInput outline label={label} type={type} value={value} readOnly={readOnly} min={min} max={max} step={step} inputClassName={inputClassName} onChange={e => onChange?.(e.target.value)} />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <AdminSelectField
      variant="list-input"
      label={label}
      title={`Pilih ${label}`}
      value={value}
      options={options}
      onChange={onChange}
      placeholder="Select..."
    />
  );
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
    variant_size: sizes.map((v: any) => {
      const isActive = v.discount_is_active === true;
      return {
        size: str(v.size),
        price: str(v.price),
        sale_price: isActive && v.sale_price != null ? str(v.sale_price) : '',
        discount_is_active: isActive,
        discount: isActive && v.discount != null ? str(v.discount) : '',
      };
    }),
    main_features: main.map(str), sub_features: sub.map(str), headline: str(p.headline), rating: { count: str(p.rating?.count), average: str(p.rating?.average) }, reviews: { count: str(p.reviews?.count) }, created_at: str(p.created_at), updated_at: str(p.updated_at),
  };
}

function formToProduct(f: ProductForm) {
  const num = (v: string) => v === '' ? null : Number(v);
  const variant_size = f.variant_size.filter(v => v.size || v.price).map(v => {
    const price = num(v.price);
    const isDiscountActive = v.discount_is_active === true;
    const salePrice = isDiscountActive ? num(v.sale_price) : null;
    const discount = isDiscountActive && v.discount !== '' ? Number(v.discount) : null;

    if (isDiscountActive && price != null && salePrice != null && !(price > salePrice)) {
      throw new Error(`Variant size ${v.size || '(unnamed)'}: Price must be greater than Sale Price`);
    }
    if (isDiscountActive && (discount == null || discount < 0 || discount > 100)) {
      throw new Error(`Variant size ${v.size || '(unnamed)'}: Discount must be between 0 and 100%`);
    }

    return {
      size: v.size,
      price,
      sale_price: isDiscountActive ? salePrice : null,
      discount_is_active: isDiscountActive,
      discount: isDiscountActive ? discount : null,
    };
  });
  return {
    item_group_id: f.item_group_id.trim(), title: f.title.trim(), description: f.description, availability: f.availability.trim(), condition: f.condition.trim(), brand: f.brand.trim(), link: f.link.trim(), google_product_category: f.google_product_category.trim(), product_type: f.product_type.trim(), quantity_to_sell_on_facebook: num(f.quantity_to_sell_on_facebook),
    custom_label_0: f.custom_label_0, custom_label_1: f.custom_label_1, custom_label_2: f.custom_label_2, custom_label_3: f.custom_label_3, custom_label_4: f.custom_label_4, custom_label_5: f.custom_label_5,
    variant_color: f.variant_color.filter(v => v.color || v.image_link || v.additional_image_link), variant_size,
    main_features: f.main_features.map(v => v.trim()).filter(Boolean), sub_features: f.sub_features.map(v => v.trim()).filter(Boolean), headline: f.headline, rating: { count: num(f.rating.count), average: num(f.rating.average) }, reviews: { count: num(f.reviews.count) },
  };
}

function ProductForm({
  form,
  setForm,
  initialTab = 'info',
}: {
  form: ProductForm;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  onOpenVariants?: () => void;
  initialTab?: 'info' | 'variants' | 'features' | 'advanced';
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'features' | 'advanced'>(initialTab);
  const set = (key: keyof ProductForm, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const labels = Array.from({ length: 6 }, (_, i) => `custom_label_${i}` as keyof ProductForm);
  const remove = (key: 'variant_size' | 'main_features' | 'sub_features', i: number) =>
    set(key, form[key].filter((_, n) => n !== i));

  const productTypes = ['iPhone', 'iPad', 'Mac', 'Watch', 'AirPods', 'TV & Home', 'Accessories'];
  const availabilities = ['in stock', 'out of stock', 'preorder', 'available for order'];
  const conditions = ['new', 'refurbished', 'used'];

  const colorCount = form.variant_color.length;
  const sizeCount = form.variant_size.length;

  return (
    <div className="w-full flex flex-col pb-6">
      {/* Top Segmented Navigation Tabs */}
      <div className="sticky top-0 z-10 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-2 border-b border-gray-200">
        <div className="bg-[#e5e5ea] p-0.5 rounded-xl grid grid-cols-4 gap-0.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'info' ? 'bg-white text-[#1d1d1f] shadow-2xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'variants' ? 'bg-white text-[#1d1d1f] shadow-2xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <span>Variants</span>
            <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0071e3] text-[9px] font-bold flex items-center justify-center">
              {colorCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'features' ? 'bg-white text-[#1d1d1f] shadow-2xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'advanced' ? 'bg-white text-[#1d1d1f] shadow-2xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-4 px-4 py-3">
          {/* Variants Quick Overview Banner */}
          <div
            onClick={() => setActiveTab('variants')}
            className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1d1d1f]">
                  {colorCount} Colors · {sizeCount} Capacities/Sizes
                </div>
                <div className="text-[11px] text-[#0071e3] font-medium">
                  Tap to manage color photos, pricing & discounts →
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#0071e3] shrink-0" />
          </div>

          {/* Basic Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3.5 shadow-2xs">
            <div className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider text-gray-400">
              Basic Information
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Item Group ID *
              </label>
              <input
                type="text"
                placeholder="e.g. iphone-16-pro-max"
                value={form.item_group_id}
                onChange={(e) => set('item_group_id', e.target.value)}
                className="w-full text-xs font-mono border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Unique slug identifier for URL and catalog</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                placeholder="e.g. iPhone 16 Pro Max"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Marketing Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Hello, Apple Intelligence."
                value={form.headline}
                onChange={(e) => set('headline', e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Product Type / Category
              </label>
              <input
                type="text"
                placeholder="e.g. iPhone"
                value={form.product_type}
                onChange={(e) => set('product_type', e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none mb-1.5"
              />
              <div className="flex flex-wrap gap-1">
                {productTypes.map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => set('product_type', pt)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                      form.product_type === pt ? 'bg-[#0071e3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AdminSelectField
                label="Availability"
                title="Pilih Ketersediaan (Availability)"
                subtitle="Status ketersediaan stok di etalase"
                value={form.availability}
                options={[
                  {
                    value: 'In Stock',
                    label: 'In Stock',
                    description: 'Tersedia untuk pengiriman segera',
                    badge: 'IN STOCK',
                    badgeClass: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    value: 'Limited Stock',
                    label: 'Limited Stock',
                    description: 'Stok terbatas / menipis',
                    badge: 'LIMITED',
                    badgeClass: 'bg-amber-50 text-amber-700',
                  },
                  {
                    value: 'Pre-Order',
                    label: 'Pre-Order',
                    description: 'Pesanan prapesan resmi',
                    badge: 'PRE-ORDER',
                    badgeClass: 'bg-blue-50 text-blue-700',
                  },
                  {
                    value: 'Out of Stock',
                    label: 'Out of Stock',
                    description: 'Stok produk saat ini habis',
                    badge: 'OUT OF STOCK',
                    badgeClass: 'bg-rose-50 text-rose-700',
                  },
                ]}
                onChange={(val) => set('availability', val)}
                placeholder="Pilih..."
              />

              <AdminSelectField
                label="Condition"
                title="Pilih Kondisi (Condition)"
                subtitle="Kondisi fisik dan kelayakan unit"
                value={form.condition}
                options={[
                  {
                    value: 'Brand New',
                    label: 'Brand New',
                    description: 'Baru & segel pabrik resmi 100%',
                    badge: 'NEW',
                    badgeClass: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    value: 'Refurbished',
                    label: 'Refurbished',
                    description: 'Rekondisi resmi teruji bersertifikat',
                    badge: 'REFURBISHED',
                    badgeClass: 'bg-purple-50 text-purple-700',
                  },
                  {
                    value: 'Like New',
                    label: 'Like New',
                    description: 'Kondisi fisik mulus tanpa cacat 99%',
                    badge: 'LIKE NEW',
                    badgeClass: 'bg-blue-50 text-blue-700',
                  },
                  {
                    value: 'Open Box',
                    label: 'Open Box',
                    description: 'Buka segel box / unit display pameran',
                    badge: 'OPEN BOX',
                    badgeClass: 'bg-gray-100 text-gray-700',
                  },
                ]}
                onChange={(val) => set('condition', val)}
                placeholder="Pilih..."
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Brand
              </label>
              <input
                type="text"
                placeholder="Apple"
                value={form.brand || 'Apple'}
                onChange={(e) => set('brand', e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                placeholder="Detailed product overview and marketing description..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:border-[#0071e3] focus:outline-none resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Variants */}
      {activeTab === 'variants' && (
        <VariantSectionPage form={form} setForm={setForm} />
      )}

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <div className="space-y-4 px-4 py-3">
          {/* Main Features */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1d1d1f]">Key Highlights & Features</div>
                <div className="text-[11px] text-[#86868b]">Prominently shown in bullet points</div>
              </div>
              <button
                type="button"
                onClick={() => set('main_features', [...form.main_features, ''])}
                className="px-2.5 py-1 bg-[#0071e3] text-white text-xs font-semibold rounded-lg hover:bg-[#0077ed] flex items-center gap-1 shadow-2xs"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {form.main_features.map((v, i) => (
                <div key={`main-${i}`} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Highlight #${i + 1} (e.g. A18 Pro chip with 6-core GPU)`}
                    value={v}
                    onChange={(e) =>
                      set('main_features', form.main_features.map((x, n) => (n === i ? e.target.value : x)))
                    }
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:border-[#0071e3] focus:outline-none"
                  />
                  {form.main_features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove('main_features', i)}
                      className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                      title="Remove feature"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sub Features */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1d1d1f]">Technical Specifications / Sub-features</div>
                <div className="text-[11px] text-[#86868b]">Additional specifications</div>
              </div>
              <button
                type="button"
                onClick={() => set('sub_features', [...form.sub_features, ''])}
                className="px-2.5 py-1 bg-[#0071e3] text-white text-xs font-semibold rounded-lg hover:bg-[#0077ed] flex items-center gap-1 shadow-2xs"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {form.sub_features.map((v, i) => (
                <div key={`sub-${i}`} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Spec #${i + 1} (e.g. Up to 33 hours video playback)`}
                    value={v}
                    onChange={(e) =>
                      set('sub_features', form.sub_features.map((x, n) => (n === i ? e.target.value : x)))
                    }
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:border-[#0071e3] focus:outline-none"
                  />
                  {form.sub_features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove('sub_features', i)}
                      className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                      title="Remove spec"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Advanced */}
      {activeTab === 'advanced' && (
        <div className="space-y-4 px-4 py-3">
          {/* Custom Labels Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs">
            <div className="text-xs font-bold text-[#1d1d1f]">Catalog Custom Labels (0-5)</div>
            <div className="grid grid-cols-2 gap-2.5">
              {labels.map((k) => (
                <div key={String(k)}>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Label {String(k).slice(-1)}
                  </label>
                  <input
                    type="text"
                    placeholder={`Custom Label ${String(k).slice(-1)}`}
                    value={String(form[k])}
                    onChange={(e) => set(k, e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Marketing & Feed Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs">
            <div className="text-xs font-bold text-[#1d1d1f]">Catalog & Shopping Feeds</div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Google Product Category
              </label>
              <input
                type="text"
                placeholder="Electronics > Communications > Telephony > Mobile Phones"
                value={form.google_product_category}
                onChange={(e) => set('google_product_category', e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Product Link / Slug
              </label>
              <input
                type="text"
                placeholder="/product/iphone-16-pro"
                value={form.link}
                onChange={(e) => set('link', e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Quantity to Sell on Facebook
              </label>
              <input
                type="number"
                placeholder="100"
                value={form.quantity_to_sell_on_facebook}
                onChange={(e) => set('quantity_to_sell_on_facebook', e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          </div>

          {/* Social Proof Overrides */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs">
            <div className="text-xs font-bold text-[#1d1d1f]">Rating & Reviews Counter</div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Rating Average
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="4.9"
                  value={form.rating.average}
                  onChange={(e) => set('rating', { ...form.rating, average: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Rating Count
                </label>
                <input
                  type="number"
                  placeholder="128"
                  value={form.rating.count}
                  onChange={(e) => set('rating', { ...form.rating, count: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Reviews Count
                </label>
                <input
                  type="number"
                  placeholder="85"
                  value={form.reviews.count}
                  onChange={(e) => set('reviews', { count: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* System metadata */}
          {(form.created_at || form.updated_at) && (
            <div className="text-[11px] text-gray-400 space-y-1 px-1">
              {form.created_at && <div>Created: {new Date(form.created_at).toLocaleString()}</div>}
              {form.updated_at && <div>Updated: {new Date(form.updated_at).toLocaleString()}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<AdminView>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<any[]>([]); const [orders, setOrders] = useState<any[]>([]); const [users, setUsers] = useState<any[]>([]); const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm()); const [editing, setEditing] = useState(false); const [productCrudOpen, setProductCrudOpen] = useState(false); const [variantSectionOpen, setVariantSectionOpen] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [deleteId, setDeleteId] = useState<string | null>(null);
  const load = useCallback(async () => { setBusy(true); setError(''); try { const [p, o, u, r] = await Promise.all([adminApi.products(), adminApi.orders(), adminApi.users(), adminApi.reviews()]); setProducts(Array.isArray(p.data) ? p.data : []); setOrders(Array.isArray(o.data) ? o.data : []); setUsers(Array.isArray(u.data) ? u.data : []); setReviews(Array.isArray(r.data) ? r.data : []); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load admin data'); } finally { setBusy(false); } }, []);
  useEffect(() => { if (user?.role === 'admin') void load(); }, [user?.role, load]);
  const stats = useMemo(() => ({ products: products.length, orders: orders.length, users: users.length, reviews: reviews.length }), [products, orders, users, reviews]);
  if (loading) return null; if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  const createProduct = async () => { try { const value = formToProduct(form); if (!value.item_group_id) throw new Error('Item Group ID is required'); await adminApi.createProduct(value); setForm(emptyForm()); setEditing(false); setProductCrudOpen(false); setVariantSectionOpen(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Create failed'); } };
  const updateProduct = async () => { try { const value = formToProduct(form); if (!value.item_group_id) throw new Error('Item Group ID is required'); await adminApi.updateProduct(value.item_group_id, value); setEditing(false); setProductCrudOpen(false); setVariantSectionOpen(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Update failed'); } };
  const editProduct = (p: any) => { setForm(productToForm(p)); setEditing(true); setProductCrudOpen(true); setVariantSectionOpen(false); setView('products'); };
  const deleteProduct = async (id: string) => { try { await adminApi.deleteProduct(id); if (form.item_group_id === id) { setForm(emptyForm()); setEditing(false); } setDeleteId(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); setDeleteId(null); } };
  const updateOrderStatus = async (id: number | string, status: string) => {
    try {
      setOrders(prev => prev.map(order => String(order.id) === String(id) ? { ...order, status } : order));
      setSelectedOrder(prev => prev && String(prev.id) === String(id) ? { ...prev, status } : prev);
      await adminApi.updateOrderStatus(id, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
      await load();
    }
  };
  const updateOrderPayment = async (id: number | string, payment: any) => { try { await adminApi.updateOrderPayment(id, payment); setOrders(prev => prev.map(order => String(order.id) === String(id) ? { ...order, payment } : order)); setSelectedOrder(prev => prev && String(prev.id) === String(id) ? { ...prev, payment } : prev); } catch (e) { setError(e instanceof Error ? e.message : 'Payment update failed'); } };
  const updateUserRole = async (phone: string, role: string) => {
    try {
      await adminApi.updateUserRole(phone, role);
      setUsers(prev => prev.map(u => u.phone === phone ? { ...u, role } : u));
      if (selectedUser && selectedUser.phone === phone) {
        setSelectedUser(prev => prev ? { ...prev, role } : null);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role update failed');
      throw e;
    }
  };
  const saveUser = async (phone: string, updates: Partial<AdminUser>) => {
    try {
      await appleApi.updateUser(phone, updates);
      setUsers(prev => prev.map(u => u.phone === phone ? { ...u, ...updates } : u));
      if (selectedUser && selectedUser.phone === phone) {
        setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update user failed');
      throw e;
    }
  };
  const createUser = async (data: { name: string; phone: string; password: string; role?: string; email?: string; avatar_url?: string; address?: any }) => {
    try {
      await appleApi.register(data.name, data.phone, data.password, data.avatar_url);
      if (data.role && data.role === 'admin') {
        await adminApi.updateUserRole(data.phone, 'admin');
      }
      if (data.email || data.address) {
        await appleApi.updateUser(data.phone, {
          ...(data.email ? { email: data.email } : {}),
          ...(data.address ? { address: data.address } : {}),
        });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create user failed');
      throw e;
    }
  };
  const productCrudMode = view === 'products' && productCrudOpen;
  const closeProductCrud = () => { setProductCrudOpen(false); setVariantSectionOpen(false); setForm(emptyForm()); setEditing(false); };

  return (
    <KonstaProvider theme="ios">
      <App theme="ios" className="w-full max-w-[500px] mx-auto">
        <AdminSelectBottomSheetProvider>
          <Page className="w-full min-h-full flex flex-col">
    {!selectedOrder && !selectedUser && (
      <Navbar
        title={productCrudMode ? (editing ? 'Edit Product' : 'New Product') : 'Admin'}
        subtitle={
          productCrudMode
            ? form.title || form.item_group_id || 'Product Editor'
            : 'Apple Store Malaysia'
        }
        left={
          productCrudMode ? (
            <Button clear className="text-gray-500 font-medium" onClick={closeProductCrud}>
              Cancel
            </Button>
          ) : undefined
        }
        right={
          productCrudMode ? (
            <Button
              clear
              className="text-[#0071e3] font-bold"
              onClick={() => (editing ? void updateProduct() : void createProduct())}
              disabled={busy}
            >
              {busy ? 'Saving…' : editing ? 'Save' : 'Create'}
            </Button>
          ) : undefined
        }
      />
    )}
    {error && <Block strong inset outline><p>{error}</p></Block>}
    <main className="w-full flex-1 min-h-0 overflow-y-auto">
      {view === 'dashboard' && !selectedOrder && <><BlockTitle>Dashboard</BlockTitle><List strong inset outline><ListItem title="Products" after={<Badge>{stats.products}</Badge>} /><ListItem title="Orders" after={<Badge>{stats.orders}</Badge>} /><ListItem title="Users" after={<Badge>{stats.users}</Badge>} /><ListItem title="Reviews" after={<Badge>{stats.reviews}</Badge>} /></List><Block strong inset><p>Manage products, orders, users and reviews from the admin views.</p></Block></>}
      {view === 'products' && !productCrudOpen && (
        <>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <div className="text-base font-bold text-[#1d1d1f]">Products</div>
              <div className="text-xs text-gray-500">{products.length} items</div>
            </div>
            <Button
              rounded
              className="!w-auto px-4 !py-1 text-xs"
              onClick={() => {
                setForm(emptyForm());
                setEditing(false);
                setVariantSectionOpen(false);
                setProductCrudOpen(true);
              }}
            >
              + New Product
            </Button>
          </div>

          {products.length === 0 ? (
            <Block strong inset outline>
              <p className="text-center text-gray-500 py-4">No products found.</p>
            </Block>
          ) : (
            <div id="admin-product-grid" className="grid grid-cols-2 gap-3 px-4 pb-8 pt-2">
              {products.map((p) => {
                const img = p.variant_color?.[0]?.image_link;
                const firstSize = Array.isArray(p.variant_size) && p.variant_size[0];
                const price = firstSize ? (Number(firstSize.sale_price || firstSize.price) || 0) : null;
                const colorsCount = Array.isArray(p.variant_color) ? p.variant_color.filter((c: any) => c.color || c.image_link).length : 0;

                return (
                  <div
                    key={p.item_group_id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col justify-between p-3 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <div className="aspect-square w-full rounded-xl bg-[#f5f5f7] flex items-center justify-center overflow-hidden mb-2.5 relative border border-gray-100">
                        {img ? (
                          <img
                            src={img}
                            alt={p.title || p.item_group_id}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">No Image</span>
                        )}
                        {colorsCount > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white backdrop-blur-xs font-medium">
                            {colorsCount} colors
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-[#1d1d1f] line-clamp-2 leading-snug mb-1" title={p.title || p.item_group_id}>
                        {p.title || p.item_group_id}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono truncate mb-1">
                        {p.item_group_id}
                      </div>
                      {price !== null && (
                        <div className="text-xs font-bold text-[#1d1d1f] mb-2">
                          RM {price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-100 mt-2">
                      <Button
                        small
                        rounded
                        outline
                        className="!text-xs !py-1"
                        onClick={() => editProduct(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        small
                        rounded
                        clear
                        className="!text-xs !py-1 text-red-500"
                        onClick={() => setDeleteId(p.item_group_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {view === 'products' && productCrudOpen && (
        <ProductForm
          form={form}
          setForm={setForm}
          initialTab={variantSectionOpen ? 'variants' : 'info'}
          onOpenVariants={() => setVariantSectionOpen(true)}
        />
      )}
      {view === 'orders' && <OrdersView orders={orders} selectedOrder={selectedOrder} onSelectOrder={setSelectedOrder} onStatusChange={updateOrderStatus} onPaymentChange={updateOrderPayment} />}
      {view === 'users' && (
        <UsersView
          users={users}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          onReload={load}
          onRoleChange={updateUserRole}
          onSaveUser={saveUser}
          onCreateUser={createUser}
        />
      )}
      {view === 'reviews' && <Section title="Reviews"><List strong inset outline>{reviews.length === 0 ? <ListItem title="No reviews." /> : reviews.map(r => <ListItem key={r.id} title={`${r.name || r.phone || 'Guest'} · ${r.rating}/5`} subtitle={r.comment} text={`${r.item_group_id || ''}${r.phone ? ` · ${r.phone}` : ''}`} after={<Button clear onClick={async () => { try { await adminApi.deleteReview(r.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } }}>Delete</Button>} />)}</List></Section>}
    </main>
    {productCrudMode && (
      <Toolbar
        tabbar
        className="sticky bottom-0 z-30 !w-full w-full min-w-full left-0 right-0 !px-0 bg-white/95 backdrop-blur-md border-t border-gray-200"
        innerClassName="!w-full w-full !max-w-full !px-3.5 !gap-2.5 flex items-center !h-auto !py-2.5"
      >
        <ToolbarPane className="!w-full w-full !max-w-full !rounded-none !bg-transparent flex-1 gap-2.5 flex items-center justify-between !p-0">
          <Button
            rounded
            outline
            className="flex-1 !flex-1 !w-full !py-2.5 text-xs sm:text-sm border-gray-300 text-gray-700 font-medium active:bg-gray-100"
            onClick={closeProductCrud}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            rounded
            className="flex-1 !flex-1 !w-full !py-2.5 text-xs sm:text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-2xs"
            onClick={() => (editing ? void updateProduct() : void createProduct())}
            disabled={busy}
          >
            {busy ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
          </Button>
        </ToolbarPane>
      </Toolbar>
    )}
    {!productCrudMode && !selectedOrder && !selectedUser && (
      <AdminBottomNav
        activeView={view}
        onViewChange={(v) => {
          setView(v);
          setSelectedOrder(null);
          setSelectedUser(null);
        }}
      />
    )}
    </Page>
    <Dialog
      opened={deleteId !== null}
      onBackdropClick={() => setDeleteId(null)}
      title="Delete Product"
      content={deleteId ? `Delete ${deleteId}?` : ''}
      buttons={
        <>
          <DialogButton onClick={() => setDeleteId(null)}>Cancel</DialogButton>
          <DialogButton strong onClick={() => deleteId && void deleteProduct(deleteId)}>Delete</DialogButton>
        </>
      }
    />
  </AdminSelectBottomSheetProvider>
</App>
</KonstaProvider>
);
}
