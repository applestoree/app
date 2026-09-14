import React, { useState, useMemo, useRef } from 'react';
import {
  Package,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  XCircle,
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building2,
  QrCode,
  Tag,
  Phone,
  Receipt,
  RotateCcw,
  Upload,
  Loader2,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Navbar, Button } from 'konsta/react';
import { uploadDuitNowQrImage } from '../../services/storage.ts';
import { AdminSelectField } from './AdminSelectBottomSheet.tsx';

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'] as const;
export const PAYMENT_METHODS = ['duitnow_qr', 'transferbank'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'cancelled'] as const;

const str = (v: unknown) => (v == null ? '' : String(v));
const money = (v: unknown) => `RM ${Number(v || 0).toFixed(2)}`;
const jsonObject = (v: unknown): Record<string, any> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {};
const jsonArray = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export function parseItemColor(item: any): string {
  if (!item) return '';
  if (typeof item.selectedColor === 'string') return item.selectedColor;
  if (typeof item.selectedColor === 'object' && item.selectedColor !== null) {
    return String(item.selectedColor.color || '');
  }
  if (typeof item.color === 'string') return item.color;
  if (typeof item.color === 'object' && item.color !== null) {
    return String(item.color.color || '');
  }
  return '';
}

export function parseItemSize(item: any): string {
  if (!item) return '';
  if (typeof item.selectedSize === 'string') return item.selectedSize;
  if (typeof item.selectedSize === 'object' && item.selectedSize !== null) {
    return String(item.selectedSize.size || '');
  }
  if (typeof item.size === 'string') return item.size;
  if (typeof item.size === 'object' && item.size !== null) {
    return String(item.size.size || '');
  }
  return '';
}

export function parseItemImage(item: any): string {
  if (!item) return '';
  if (typeof item.image_link === 'string' && item.image_link) return item.image_link;
  if (typeof item.selectedColor === 'object' && item.selectedColor !== null && item.selectedColor.image_link) {
    return String(item.selectedColor.image_link);
  }
  if (typeof item.color === 'object' && item.color !== null && item.color.image_link) {
    return String(item.color.image_link);
  }
  const product = jsonObject(item.product);
  if (Array.isArray(product.variant_color) && product.variant_color[0]?.image_link) {
    return String(product.variant_color[0].image_link);
  }
  return '';
}

export function getOrderStatusBadge(status: string) {
  const s = status?.toLowerCase() || 'pending';
  switch (s) {
    case 'completed':
      return {
        label: 'Completed',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
      };
    case 'shipped':
      return {
        label: 'Shipped',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Truck,
      };
    case 'processing':
      return {
        label: 'Processing',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: RotateCcw,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: XCircle,
      };
    case 'pending':
    default:
      return {
        label: 'Pending',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      };
  }
}

export function getPaymentStatusBadge(status: string) {
  const s = status?.toLowerCase() || 'pending';
  switch (s) {
    case 'paid':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'failed':
      return {
        label: 'Failed',
        bg: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-gray-100 text-gray-700 border-gray-200',
      };
    case 'pending':
    default:
      return {
        label: 'Unpaid',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
      };
  }
}

interface OrderDetailViewProps {
  order: any;
  onBack: () => void;
  onStatusChange: (id: number | string, status: string) => Promise<void>;
  onPaymentChange: (id: number | string, payment: any) => Promise<void>;
}

function OrderDetailView({
  order: o,
  onBack,
  onStatusChange,
  onPaymentChange,
}: OrderDetailViewProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrUploadError, setQrUploadError] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const address = jsonObject(o.address);
  const store = jsonObject(o.store);
  const shipping = jsonObject(o.shipping);
  const voucher = jsonObject(o.voucher);
  const payment = jsonObject(o.payment);
  const items = jsonArray(o.items);

  const deliveryType = str(shipping.delivery_type || shipping.type || (Object.keys(store).length ? 'store_pickup' : 'delivery'));
  const isPickup = deliveryType === 'store_pickup';
  const destination = isPickup
    ? store.address || store.name || 'Store Pickup location'
    : address.address || [address.city, address.state, address.postcode].filter(Boolean).join(', ') || 'Address not provided';

  const statusBadge = getOrderStatusBadge(o.status);
  const StatusIcon = statusBadge.icon;
  const paymentBadge = getPaymentStatusBadge(payment.status);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await onStatusChange(o.id, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentUpdate = async (patch: Record<string, any>) => {
    setUpdatingPayment(true);
    try {
      await onPaymentChange(o.id, { ...payment, ...patch });
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    setQrUploadError(null);
    try {
      const publicUrl = await uploadDuitNowQrImage(file, o.id);
      await handlePaymentUpdate({
        duitnow_qr: { ...jsonObject(payment.duitnow_qr), img: publicUrl, is_active: true },
      });
    } catch (err) {
      setQrUploadError(err instanceof Error ? err.message : 'Gagal upload gambar QR ke Supabase.');
    } finally {
      setUploadingQr(false);
      if (qrFileInputRef.current) qrFileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col pb-8">
      <Navbar
        title={`Order #${o.id}`}
        subtitle={o.created_at ? new Date(o.created_at).toLocaleString('en-MY') : 'Recent Order'}
        left={
          <Button clear className="text-[#0071e3] font-medium flex items-center gap-1" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
        }
      />

      <div className="p-4 space-y-4 max-w-xl mx-auto w-full">
        {/* Status & Quick Action Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Order Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
            >
              <StatusIcon size={13} />
              {statusBadge.label}
            </span>
          </div>

          <div>
            <AdminSelectField
              label="Change Status"
              title="Pilih Status Pesanan"
              subtitle={`Pesanan #${o.id}`}
              value={o.status || 'pending'}
              disabled={updatingStatus}
              options={ORDER_STATUSES.map((status) => {
                const badge = getOrderStatusBadge(status);
                return {
                  value: status,
                  label: status.toUpperCase(),
                  description:
                    status === 'pending'
                      ? 'Pesanan baru, menunggu verifikasi / pembayaran'
                      : status === 'processing'
                      ? 'Pesanan sedang dipersiapkan dan dikemas'
                      : status === 'shipped'
                      ? 'Pesanan dalam pengiriman kurir ke alamat pembeli'
                      : status === 'completed'
                      ? 'Pesanan telah selesai dan berhasil diterima'
                      : 'Pesanan telah dibatalkan',
                  badge: status.toUpperCase(),
                  badgeClass: badge.bg,
                };
              })}
              onChange={(newVal) => void handleStatusUpdate(newVal)}
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updatingStatus || (o.status || 'pending') === s}
                onClick={() => void handleStatusUpdate(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  (o.status || 'pending') === s
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Customer & Fulfillment Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Customer & Delivery
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0071e3] flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-400 font-medium">Customer Phone</div>
                <div className="font-semibold text-[#1d1d1f] flex items-center gap-1">
                  <span>{o.phone || 'Guest Customer'}</span>
                  {o.phone && (
                    <a
                      href={`tel:${o.phone}`}
                      className="text-[10px] text-[#0071e3] hover:underline flex items-center gap-0.5 ml-2 font-medium"
                    >
                      <Phone size={10} /> Call
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                {isPickup ? <Building2 size={14} /> : <Truck size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <span>{isPickup ? 'Store Pickup' : 'Standard Delivery'}</span>
                  {shipping.shipping_method && <span>· {shipping.shipping_method}</span>}
                </div>
                <div className="font-semibold text-[#1d1d1f] mt-0.5 leading-relaxed break-words">
                  {destination}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Order Items ({items.length})
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Total Qty: {items.reduce((acc: number, item: any) => acc + Number(item.quantity || 1), 0)}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="py-3 text-xs text-gray-400 text-center">No item details recorded.</div>
            ) : (
              items.map((item: any, idx: number) => {
                const product = jsonObject(item.product);
                const title = item.title || product.title || item.name || item.item_group_id || `Item ${idx + 1}`;
                const color = parseItemColor(item);
                const size = parseItemSize(item);
                const quantity = Number(item.quantity || 1);
                const price = item.sale_price ?? item.price ?? product.sale_price ?? product.price ?? 0;
                const itemTotal = Number(price) * quantity;
                const img = parseItemImage(item);

                return (
                  <div key={`${String(o.id)}-${idx}`} className="py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {img ? (
                        <img src={img} alt={title} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Package size={18} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1d1d1f] truncate" title={title}>
                        {title}
                      </div>
                      <div className="text-[11px] text-[#86868b] flex items-center gap-1.5 mt-0.5">
                        {color && <span>{color}</span>}
                        {color && size && <span>·</span>}
                        {size && <span>{size}</span>}
                        <span>· Qty: {quantity}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#1d1d1f]">{money(itemTotal)}</div>
                      {quantity > 1 && (
                        <div className="text-[10px] text-gray-400">{money(price)} / unit</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Details & Settings Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Payment Information
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${paymentBadge.bg}`}>
              {paymentBadge.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <AdminSelectField
              label="Payment Method"
              title="Pilih Metode Pembayaran"
              subtitle={`Pesanan #${o.id}`}
              value={payment.method || ''}
              disabled={updatingPayment}
              allowEmpty
              emptyLabel="None / Not set"
              options={[
                {
                  value: 'duitnow_qr',
                  label: 'DuitNow QR',
                  description: 'Pembayaran instan via QR code DuitNow',
                  badge: 'QR',
                  badgeClass: 'bg-pink-50 text-pink-700',
                },
                {
                  value: 'transferbank',
                  label: 'Bank Transfer',
                  description: 'Transfer manual rekening bank resmi',
                  badge: 'BANK',
                  badgeClass: 'bg-blue-50 text-blue-700',
                },
              ]}
              onChange={(val) => void handlePaymentUpdate({ method: val })}
              placeholder="Pilih metode..."
            />

            <AdminSelectField
              label="Payment Status"
              title="Pilih Status Pembayaran"
              subtitle={`Pesanan #${o.id}`}
              value={payment.status || 'pending'}
              disabled={updatingPayment}
              options={[
                {
                  value: 'pending',
                  label: 'PENDING',
                  description: 'Menunggu konfirmasi / bukti pembayaran',
                  badge: 'PENDING',
                  badgeClass: 'bg-amber-50 text-amber-700',
                },
                {
                  value: 'paid',
                  label: 'PAID',
                  description: 'Pembayaran telah sukses diverifikasi',
                  badge: 'PAID',
                  badgeClass: 'bg-emerald-50 text-emerald-700',
                },
                {
                  value: 'failed',
                  label: 'FAILED',
                  description: 'Pembayaran gagal, ditolak, atau kedaluwarsa',
                  badge: 'FAILED',
                  badgeClass: 'bg-red-50 text-red-700',
                },
                {
                  value: 'cancelled',
                  label: 'CANCELLED',
                  description: 'Transaksi pembayaran dibatalkan',
                  badge: 'CANCELLED',
                  badgeClass: 'bg-gray-100 text-gray-700',
                },
              ]}
              onChange={(val) => void handlePaymentUpdate({ status: val })}
              placeholder="Pilih status..."
            />
          </div>

          {/* DuitNow QR config */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-pink-600" />
                <span className="text-xs font-bold text-[#1d1d1f]">DuitNow QR</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={payment.duitnow_qr?.is_active === true}
                  onChange={(e) =>
                    void handlePaymentUpdate({
                      duitnow_qr: { ...jsonObject(payment.duitnow_qr), is_active: e.target.checked },
                    })
                  }
                />
                <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#0071e3]"></div>
              </label>
            </div>

            {payment.duitnow_qr?.is_active && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    QR Image (Supabase: apple)
                  </label>
                  <button
                    type="button"
                    disabled={uploadingQr || updatingPayment}
                    onClick={() => qrFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    {uploadingQr ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={12} />
                        <span>Upload Gambar QR</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={qrFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => void handleQrFileUpload(e)}
                  />
                </div>

                {/* QR Image Preview */}
                {str(payment.duitnow_qr?.img) && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={str(payment.duitnow_qr?.img)}
                        alt="DuitNow QR Code"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1">
                        <span>DuitNow QR Code</span>
                        <a
                          href={str(payment.duitnow_qr?.img)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0071e3] hover:underline flex items-center gap-0.5 text-[10px]"
                          title="Buka gambar penuh"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5 font-mono">
                        {str(payment.duitnow_qr?.img)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={updatingPayment || uploadingQr}
                      onClick={() =>
                        void handlePaymentUpdate({
                          duitnow_qr: { ...jsonObject(payment.duitnow_qr), img: '' },
                        })
                      }
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      title="Hapus gambar QR"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Direct URL input */}
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">
                    URL Gambar QR:
                  </label>
                  <input
                    type="url"
                    placeholder="https://...supabase.co/storage/v1/object/public/apple/..."
                    value={str(payment.duitnow_qr?.img)}
                    disabled={uploadingQr || updatingPayment}
                    onChange={(e) =>
                      void handlePaymentUpdate({
                        duitnow_qr: { ...jsonObject(payment.duitnow_qr), img: e.target.value },
                      })
                    }
                    className="w-full text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none font-mono"
                  />
                </div>

                {qrUploadError && (
                  <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{qrUploadError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank Transfer config */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-[#1d1d1f]">Bank Transfer</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={payment.transferbank?.is_active === true}
                  onChange={(e) =>
                    void handlePaymentUpdate({
                      transferbank: { ...jsonObject(payment.transferbank), is_active: e.target.checked },
                    })
                  }
                />
                <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#0071e3]"></div>
              </label>
            </div>
            {payment.transferbank?.is_active && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maybank"
                    value={str(payment.transferbank?.name)}
                    onChange={(e) =>
                      void handlePaymentUpdate({
                        transferbank: { ...jsonObject(payment.transferbank), name: e.target.value },
                      })
                    }
                    className="w-full text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="514..."
                    value={str(payment.transferbank?.number)}
                    onChange={(e) =>
                      void handlePaymentUpdate({
                        transferbank: { ...jsonObject(payment.transferbank), number: e.target.value },
                      })
                    }
                    className="w-full text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#0071e3] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Payment Summary
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{money(o.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span>{money(o.shipping_fee || shipping.fee || 0)}</span>
            </div>
            {(voucher.code || Number(o.discount || voucher.discount || 0) > 0) && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  <span>Discount {voucher.code ? `(${voucher.code})` : ''}</span>
                </span>
                <span>- {money(o.discount || voucher.discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-[#1d1d1f]">
              <span>Total Amount</span>
              <span className="text-[#0071e3] text-base">{money(o.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OrdersViewProps {
  orders: any[];
  selectedOrder: any | null;
  onSelectOrder: (order: any | null) => void;
  onStatusChange: (id: number | string, status: string) => Promise<void>;
  onPaymentChange: (id: number | string, payment: any) => Promise<void>;
}

export function OrdersView({
  orders,
  selectedOrder,
  onSelectOrder,
  onStatusChange,
  onPaymentChange,
}: OrdersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach((s) => {
      counts[s] = orders.filter((o) => (o.status || 'pending').toLowerCase() === s).length;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = (o.status || 'pending').toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const idMatch = String(o.id || '').toLowerCase().includes(query);
      const phoneMatch = String(o.phone || '').toLowerCase().includes(query);
      const items = jsonArray(o.items);
      const itemsMatch = items.some((item: any) => {
        const title = String(item.title || item.name || item.product?.title || '').toLowerCase();
        const color = parseItemColor(item).toLowerCase();
        const size = parseItemSize(item).toLowerCase();
        return title.includes(query) || color.includes(query) || size.includes(query);
      });
      return idMatch || phoneMatch || itemsMatch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Order Detail View
  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => onSelectOrder(null)}
        onStatusChange={onStatusChange}
        onPaymentChange={onPaymentChange}
      />
    );
  }

  // Orders List View
  return (
    <div className="w-full space-y-3 pb-8">
      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-10 bg-[#f5f5f7]/95 backdrop-blur-md px-4 py-2.5 border-b border-gray-200 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order #, customer phone, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:border-[#0071e3] focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full shrink-0 transition-all ${
              statusFilter === 'all'
                ? 'bg-[#1d1d1f] text-white shadow-2xs font-bold'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All ({statusCounts.all || 0})
          </button>
          {ORDER_STATUSES.map((s) => {
            const count = statusCounts[s] || 0;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full shrink-0 capitalize transition-all ${
                  active
                    ? 'bg-[#0071e3] text-white shadow-2xs font-bold'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="px-4 space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2.5 shadow-2xs my-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Package size={24} />
            </div>
            <div className="text-sm font-bold text-[#1d1d1f]">No orders found</div>
            <div className="text-xs text-gray-500 max-w-xs mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try changing your search term or status filter.'
                : 'Customer orders will appear here once placed.'}
            </div>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs font-semibold text-[#0071e3] hover:underline pt-1 block mx-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((o) => {
            const shipping = jsonObject(o.shipping);
            const payment = jsonObject(o.payment);
            const store = jsonObject(o.store);
            const items = jsonArray(o.items);
            const deliveryType = str(
              shipping.delivery_type || shipping.type || (Object.keys(store).length ? 'store_pickup' : 'delivery')
            );
            const isPickup = deliveryType === 'store_pickup';
            const statusBadge = getOrderStatusBadge(o.status);
            const StatusIcon = statusBadge.icon;
            const paymentBadge = getPaymentStatusBadge(payment.status);

            const totalItemsQty = items.reduce((acc: number, item: any) => acc + Number(item.quantity || 1), 0);
            const firstItem = items[0];
            const firstItemTitle = firstItem
              ? firstItem.title || firstItem.name || firstItem.product?.title || firstItem.item_group_id || 'Item'
              : 'Product';

            return (
              <div
                key={String(o.id)}
                onClick={() => onSelectOrder(o)}
                className="bg-white rounded-2xl border border-gray-200 p-3.5 space-y-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99]"
              >
                {/* Order Top Bar: ID, Date, Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1d1d1f] font-mono">
                      #{o.id}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.bg}`}
                  >
                    <StatusIcon size={11} />
                    {statusBadge.label}
                  </span>
                </div>

                {/* Middle info: Customer & Items */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <User size={13} className="text-gray-400" />
                    <span>{o.phone || 'Guest'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${paymentBadge.bg}`}>
                      {payment.method === 'duitnow_qr' ? 'DuitNow' : payment.method === 'transferbank' ? 'Bank Transfer' : 'Payment'} · {paymentBadge.label}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="bg-[#f5f5f7] rounded-xl p-2 flex items-center justify-between text-[11px] text-gray-600">
                  <div className="truncate pr-2 font-medium">
                    {firstItemTitle}
                    {items.length > 1 && <span className="text-gray-400"> +{items.length - 1} more</span>}
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-gray-500 font-semibold">
                    <span>{totalItemsQty} item{totalItemsQty > 1 ? 's' : ''}</span>
                    {isPickup ? <Building2 size={12} className="text-purple-600 ml-1" /> : <Truck size={12} className="text-blue-600 ml-1" />}
                  </div>
                </div>

                {/* Bottom Bar: Total & Chevron */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400">
                    Total Amount
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#0071e3]">{money(o.total)}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
