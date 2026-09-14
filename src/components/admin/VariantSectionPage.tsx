import React, { useRef, useState } from 'react';
import { uploadProductImage } from '../../services/storage.ts';
import { Plus, Trash2, Upload, Image as ImageIcon, Sparkles, Tag, Check, X } from 'lucide-react';

type ProductForm = {
  item_group_id: string;
  variant_color: { color: string; image_link: string; additional_image_link: string }[];
  variant_size: { size: string; price: string; sale_price: string; discount_is_active: boolean; discount: string }[];
};

type Props = {
  form: ProductForm;
  setForm: React.Dispatch<React.SetStateAction<any>>;
};

const emptySize = () => ({ size: '', price: '', sale_price: '', discount_is_active: false, discount: '' });

function AdditionalImages({
  value,
  onChange,
  itemGroupId,
  color,
  index,
}: {
  value: string;
  onChange: (value: string) => void;
  itemGroupId: string;
  color: string;
  index: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const urls = value.split(',').map((v) => v.trim()).filter(Boolean);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadProductImage(file, itemGroupId, color || `color-${index + 1}`, 'additional'));
      }
      onChange([...urls, ...uploaded].join(','));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
          Gallery Photos ({urls.length})
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] flex items-center gap-1 disabled:opacity-50"
        >
          <Upload size={13} />
          {busy ? 'Uploading…' : '+ Add Photos'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />

      {urls.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
          {urls.map((url, n) => (
            <div key={`${url}-${n}`} className="relative group aspect-square rounded-xl border border-gray-200 bg-[#f5f5f7] overflow-hidden">
              <img src={url} alt="Gallery" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, i) => i !== n).join(','))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                title="Remove photo"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full border border-dashed border-gray-200 rounded-xl py-3 px-2 text-center text-gray-400 text-xs hover:border-[#0071e3] hover:text-[#0071e3] cursor-pointer transition-colors flex items-center justify-center gap-1.5"
        >
          <ImageIcon size={14} />
          <span>Upload gallery images for this color</span>
        </div>
      )}
    </div>
  );
}

function ColorVariantCard({
  form,
  setForm,
  index,
}: {
  key?: React.Key;
  form: ProductForm;
  setForm: Props['setForm'];
  index: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const variant = form.variant_color[index];

  const update = (key: keyof ProductForm['variant_color'][number], value: string) => {
    setForm((prev: ProductForm) => ({
      ...prev,
      variant_color: prev.variant_color.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  const uploadMain = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      update('image_link', await uploadProductImage(file, form.item_group_id, variant.color || `color-${index + 1}`, 'main'));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3.5 space-y-3 shadow-2xs">
      {/* Header with color label & delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0071e3] text-[10px] font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <input
            type="text"
            placeholder="Color Name (e.g. Natural Titanium, Desert Titanium)"
            value={variant.color}
            onChange={(e) => update('color', e.target.value)}
            className="flex-1 text-xs font-semibold text-[#1d1d1f] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
          />
        </div>
        {form.variant_color.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setForm((prev: ProductForm) => ({
                ...prev,
                variant_color: prev.variant_color.filter((_, i) => i !== index),
              }))
            }
            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete this color variant"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Main Image Section */}
      <div className="flex gap-3 items-start pt-1">
        <div className="w-20 h-20 rounded-xl border border-gray-200 bg-[#f5f5f7] shrink-0 flex items-center justify-center overflow-hidden relative">
          {variant.image_link ? (
            <>
              <img
                src={variant.image_link}
                alt={variant.color || 'Variant'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-1.5"
              />
              <button
                type="button"
                onClick={() => update('image_link', '')}
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                title="Remove image"
              >
                <X size={10} />
              </button>
            </>
          ) : (
            <ImageIcon size={22} className="text-gray-300" />
          )}
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="text-[11px] font-medium text-[#1d1d1f]">Main Color Photo</div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void uploadMain(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Upload size={12} />
              {busy ? 'Uploading…' : variant.image_link ? 'Replace Photo' : 'Upload Photo'}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput((v) => !v)}
              className="text-[11px] text-gray-500 hover:text-gray-700 underline"
            >
              {showUrlInput ? 'Hide URL' : 'Paste URL'}
            </button>
          </div>
          {showUrlInput && (
            <input
              type="url"
              placeholder="https://... image link"
              value={variant.image_link}
              onChange={(e) => update('image_link', e.target.value)}
              className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1 focus:border-[#0071e3] focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Gallery Photos */}
      <AdditionalImages
        value={variant.additional_image_link}
        onChange={(val) => update('additional_image_link', val)}
        itemGroupId={form.item_group_id}
        color={variant.color}
        index={index}
      />
    </div>
  );
}

function SizeVariantCard({
  v,
  i,
  total,
  updateSize,
  updateDiscount,
  toggleDiscount,
  onRemove,
}: {
  key?: React.Key;
  v: ProductForm['variant_size'][number];
  i: number;
  total: number;
  updateSize: (i: number, key: string, value: string | boolean) => void;
  updateDiscount: (i: number, value: string) => void;
  toggleDiscount: (i: number, active: boolean) => void;
  onRemove: () => void;
}) {
  const priceNum = Number(v.price) || 0;
  const saleNum = Number(v.sale_price) || 0;
  const savings = v.discount_is_active && priceNum > saleNum ? priceNum - saleNum : 0;

  const quickSizes = ['128GB', '256GB', '512GB', '1TB', '42mm', '46mm', 'Standard'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3.5 space-y-3 shadow-2xs">
      {/* Header with size label & quick chips */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          <input
            type="text"
            placeholder="Size / Capacity (e.g. 256GB, 46mm)"
            value={v.size}
            onChange={(e) => updateSize(i, 'size', e.target.value)}
            className="flex-1 text-xs font-semibold text-[#1d1d1f] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
          />
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete this size variant"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Quick size preset suggestions if size empty */}
      {!v.size && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] text-gray-400 self-center shrink-0">Presets:</span>
          {quickSizes.map((qs) => (
            <button
              key={qs}
              type="button"
              onClick={() => updateSize(i, 'size', qs)}
              className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-medium text-gray-600 shrink-0"
            >
              {qs}
            </button>
          ))}
        </div>
      )}

      {/* Pricing Inputs Grid */}
      <div className={v.discount_is_active ? 'grid grid-cols-2 gap-2.5 pt-1' : 'pt-1'}>
        <div>
          <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
            {v.discount_is_active ? 'Normal Price (RM)' : 'Price (RM)'}
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
              RM
            </span>
            <input
              type="number"
              placeholder="0"
              value={v.price}
              onChange={(e) => updateSize(i, 'price', e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-2.5 py-1.5 border border-gray-200 rounded-lg focus:border-[#0071e3] focus:outline-none"
            />
          </div>
        </div>

        {v.discount_is_active && (
          <div>
            <label className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
              Sale / Promo Price (RM)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                RM
              </span>
              <input
                type="number"
                placeholder="0"
                readOnly
                value={v.sale_price}
                className="w-full text-xs font-semibold pl-9 pr-2.5 py-1.5 border border-gray-200 rounded-lg focus:border-[#0071e3] focus:outline-none bg-gray-50 text-red-600 font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Discount / Promo toggle & percentage */}
      <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag size={15} className={v.discount_is_active ? 'text-red-500' : 'text-gray-400'} />
          <div>
            <div className="text-xs font-semibold text-[#1d1d1f]">Promo Discount</div>
            <div className="text-[10px] text-gray-500">
              {v.discount_is_active ? 'Active · Auto-calculates sale price' : 'Inactive · Normal price only'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {v.discount_is_active && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="99"
                placeholder="10"
                value={v.discount}
                onChange={(e) => updateDiscount(i, e.target.value)}
                className="w-14 text-xs font-bold text-center border border-gray-200 bg-white rounded-lg py-1 px-1 focus:border-[#0071e3] focus:outline-none"
              />
              <span className="text-xs font-bold text-gray-600">%</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => toggleDiscount(i, !v.discount_is_active)}
            className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
              v.discount_is_active ? 'bg-[#0071e3]' : 'bg-gray-300'
            }`}
            title={v.discount_is_active ? 'Disable discount' : 'Enable discount'}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                v.discount_is_active ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Savings Summary Callout if active */}
      {v.discount_is_active && savings > 0 && (
        <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-2.5 py-1 flex items-center justify-between">
          <span>Customer Saves:</span>
          <span>
            RM {savings.toLocaleString()} ({v.discount}%)
          </span>
        </div>
      )}
    </div>
  );
}

export function VariantSectionPage({ form, setForm }: Props) {
  const [activeTab, setActiveTab] = useState<'colors' | 'sizes'>('colors');

  const updateSize = (i: number, key: string, value: string | boolean) => {
    setForm((prev: ProductForm) => ({
      ...prev,
      variant_size: prev.variant_size.map((v, n) => {
        if (n !== i) return v;
        if (key === 'price') {
          if (v.discount_is_active && v.discount !== '') {
            const price = Number(value);
            const discount = Number(v.discount);
            const sale = Number.isFinite(price) && Number.isFinite(discount) && price > 0
              ? Math.round((price - (price * discount) / 100) * 100) / 100
              : '';
            return { ...v, price: String(value), sale_price: String(sale) };
          }
          return { ...v, price: String(value), sale_price: '' };
        }
        return { ...v, [key]: value };
      }),
    }));
  };

  const updateDiscount = (i: number, value: string) => {
    setForm((prev: ProductForm) => ({
      ...prev,
      variant_size: prev.variant_size.map((v, n) => {
        if (n !== i) return v;
        const price = Number(v.price);
        const discount = Number(value);
        const sale = Number.isFinite(price) && Number.isFinite(discount) && price > 0 && discount > 0
          ? Math.round((price - (price * discount) / 100) * 100) / 100
          : '';
        return { ...v, discount: value, sale_price: String(sale) };
      }),
    }));
  };

  const toggleDiscount = (i: number, active: boolean) => {
    setForm((prev: ProductForm) => ({
      ...prev,
      variant_size: prev.variant_size.map((v, n) => {
        if (n !== i) return v;
        if (!active) {
          return {
            ...v,
            discount_is_active: false,
            discount: '',
            sale_price: '',
          };
        }
        const discount = v.discount === '' ? '10' : v.discount;
        const price = Number(v.price);
        const sale = Number.isFinite(price) && price > 0
          ? Math.round((price - (price * Number(discount)) / 100) * 100) / 100
          : '';
        return { ...v, discount_is_active: true, discount, sale_price: String(sale) };
      }),
    }));
  };

  return (
    <div className="w-full space-y-4 px-4 py-3 pb-8">
      {/* Sub-navigation tabs for Variants */}
      <div className="bg-[#e5e5ea] p-1 rounded-xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'colors'
              ? 'bg-white text-[#1d1d1f] shadow-xs'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <span>Colors & Photos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-gray-200 text-[10px] font-bold">
            {form.variant_color.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sizes')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sizes'
              ? 'bg-white text-[#1d1d1f] shadow-xs'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <span>Sizes & Pricing</span>
          <span className="px-1.5 py-0.2 rounded-full bg-gray-200 text-[10px] font-bold">
            {form.variant_size.length}
          </span>
        </button>
      </div>

      {activeTab === 'colors' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1d1d1f]">Color Variants</div>
              <div className="text-[11px] text-[#86868b]">Set colors and product photography</div>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev: ProductForm) => ({
                  ...prev,
                  variant_color: [...prev.variant_color, { color: '', image_link: '', additional_image_link: '' }],
                }))
              }
              className="px-3 py-1.5 bg-[#0071e3] text-white text-xs font-semibold rounded-xl hover:bg-[#0077ed] flex items-center gap-1 shadow-2xs"
            >
              <Plus size={13} />
              Add Color
            </button>
          </div>

          <div className="space-y-3">
            {form.variant_color.map((_, i) => (
              <ColorVariantCard key={i} form={form} setForm={setForm} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1d1d1f]">Size & Pricing Variants</div>
              <div className="text-[11px] text-[#86868b]">Manage capacities, dimensions & promos</div>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev: ProductForm) => ({
                  ...prev,
                  variant_size: [...prev.variant_size, emptySize()],
                }))
              }
              className="px-3 py-1.5 bg-[#0071e3] text-white text-xs font-semibold rounded-xl hover:bg-[#0077ed] flex items-center gap-1 shadow-2xs"
            >
              <Plus size={13} />
              Add Size
            </button>
          </div>

          <div className="space-y-3">
            {form.variant_size.map((v, i) => (
              <SizeVariantCard
                key={i}
                v={v}
                i={i}
                total={form.variant_size.length}
                updateSize={updateSize}
                updateDiscount={updateDiscount}
                toggleDiscount={toggleDiscount}
                onRemove={() =>
                  setForm((prev: ProductForm) => ({
                    ...prev,
                    variant_size: prev.variant_size.filter((_, n) => n !== i),
                  }))
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
