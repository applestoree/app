import React, { useRef, useState } from 'react';
import { Block, BlockTitle, Button, List, ListInput, ListItem, Toggle } from 'konsta/react';
import { uploadProductImage } from '../../services/storage.ts';

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

function ImagePreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  if (!src) return null;
  return <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
    <img src={src} alt="Product" className="aspect-square w-full object-cover" />
    <Button clear className="absolute right-1 top-1 bg-white/90" onClick={onRemove}>Remove</Button>
  </div>;
}

function AdditionalImages({ value, onChange, itemGroupId, color, index }: { value: string; onChange: (value: string) => void; itemGroupId: string; color: string; index: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const urls = value.split(',').map(v => v.trim()).filter(Boolean);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) uploaded.push(await uploadProductImage(file, itemGroupId, color || `color-${index + 1}`, 'additional'));
      onChange([...urls, ...uploaded].join(','));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return <>
    <BlockTitle>Additional Images</BlockTitle>
    <div className="grid grid-cols-3 gap-2">
      {urls.map((url, n) => <ImagePreview key={`${url}-${n}`} src={url} onRemove={() => onChange(urls.filter((_, i) => i !== n).join(','))} />)}
    </div>
    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => void upload(e.target.files)} />
    <Button outline rounded disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Uploading…' : 'Upload Images'}</Button>
  </>;
}

function ColorVariant({ form, setForm, index }: { form: ProductForm; setForm: Props['setForm']; index: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const variant = form.variant_color[index];

  const update = (key: keyof ProductForm['variant_color'][number], value: string) => {
    setForm((prev: ProductForm) => ({ ...prev, variant_color: prev.variant_color.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
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

  return <List strong inset outline>
    <ListInput outline label="Color" value={variant.color} onChange={e => update('color', e.target.value)} />
    <BlockTitle>Main Image</BlockTitle>
    {variant.image_link && <ImagePreview src={variant.image_link} onRemove={() => update('image_link', '')} />}
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => void uploadMain(e.target.files?.[0])} />
    <Button outline rounded disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Uploading…' : variant.image_link ? 'Replace Image' : 'Upload Image'}</Button>
    <AdditionalImages value={variant.additional_image_link} onChange={value => update('additional_image_link', value)} itemGroupId={form.item_group_id} color={variant.color} index={index} />
    <ListItem title="Remove color variant" after={<Button clear disabled={form.variant_color.length === 1} onClick={() => setForm((prev: ProductForm) => ({ ...prev, variant_color: prev.variant_color.filter((_, i) => i !== index) }))}>Remove</Button>} />
  </List>;
}

export function VariantSectionPage({ form, setForm }: Props) {
  const updateSize = (i: number, key: string, value: string | boolean) => setForm((prev: ProductForm) => ({ ...prev, variant_size: prev.variant_size.map((v, n) => n === i ? { ...v, [key]: value } : v) }));
  const updateDiscount = (i: number, value: string) => setForm((prev: ProductForm) => ({ ...prev, variant_size: prev.variant_size.map((v, n) => {
    if (n !== i) return v;
    const price = Number(v.price); const discount = Number(value);
    const sale = Number.isFinite(price) && Number.isFinite(discount) ? Math.round((price - price * discount / 100) * 100) / 100 : v.sale_price;
    return { ...v, discount: value, sale_price: value === '' ? v.sale_price : String(sale) };
  }) }));
  const toggleDiscount = (i: number, active: boolean) => setForm((prev: ProductForm) => ({ ...prev, variant_size: prev.variant_size.map((v, n) => {
    if (n !== i) return v;
    if (!active) return { ...v, discount_is_active: false, discount: '' };
    const discount = v.discount === '' ? '10' : v.discount; const price = Number(v.price); const sale = Number.isFinite(price) ? Math.round((price - price * Number(discount) / 100) * 100) / 100 : v.sale_price;
    return { ...v, discount_is_active: true, discount, sale_price: String(sale) };
  }) }));

  return <div className="w-full space-y-4 pb-6">
    <BlockTitle>Variant Color</BlockTitle>
    {form.variant_color.map((_, i) => <ColorVariant key={i} form={form} setForm={setForm} index={i} />)}
    <Button outline rounded onClick={() => setForm((prev: ProductForm) => ({ ...prev, variant_color: [...prev.variant_color, { color: '', image_link: '', additional_image_link: '' }] }))}>Add Color Variant</Button>

    <BlockTitle>Variant Size</BlockTitle>
    {form.variant_size.map((v, i) => <List key={i} strong inset outline>
      <ListInput outline label="Size" value={v.size} onChange={e => updateSize(i, 'size', e.target.value)} />
      <ListInput outline label="Price" type="number" value={v.price} onChange={e => {
        const price = e.target.value;
        if (v.discount_is_active && v.discount !== '') {
          const sale = Number.isFinite(Number(price)) ? Math.round((Number(price) - Number(price) * Number(v.discount) / 100) * 100) / 100 : '';
          setForm((prev: ProductForm) => ({ ...prev, variant_size: prev.variant_size.map((x, n) => n === i ? { ...x, price, sale_price: String(sale) } : x) }));
        } else updateSize(i, 'price', price);
      }} />
      <ListInput outline label="Sale Price" type="number" value={v.sale_price} readOnly={v.discount_is_active} onChange={e => updateSize(i, 'sale_price', e.target.value)} />
      <ListItem title="Discount Active" after={<Toggle checked={v.discount_is_active} onChange={() => toggleDiscount(i, !v.discount_is_active)} />} />
      {v.discount_is_active && <ListInput outline label="Discount (%)" type="number" min="0" max="100" step="0.01" value={v.discount} onChange={e => updateDiscount(i, e.target.value)} />}
      <ListItem title="Remove size variant" after={<Button clear disabled={form.variant_size.length === 1} onClick={() => setForm((prev: ProductForm) => ({ ...prev, variant_size: prev.variant_size.filter((_, n) => n !== i) }))}>Remove</Button>} />
    </List>)}
    <Button outline rounded onClick={() => setForm((prev: ProductForm) => ({ ...prev, variant_size: [...prev.variant_size, emptySize()] }))}>Add Size Variant</Button>
  </div>;
}
