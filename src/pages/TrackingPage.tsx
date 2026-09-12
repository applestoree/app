import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StandalonePage } from '../layouts/StandalonePage.tsx';
import { useCart } from '../context/CartContext.tsx';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Building2,
  Store,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById } = useCart();

  const order = id ? getOrderById(id) : undefined;

  // Fallback info if order was navigated directly by ID
  const orderId = order?.id || id || 'MY-APL-882319';
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Today';

  const deliveryType = order?.deliveryType || 'delivery';
  const statusSteps = [
    { title: 'Order Placed', desc: 'Received & confirmed', completed: true, current: false },
    { title: 'Processing', desc: 'Preparing genuine Apple parcel', completed: true, current: true },
    { title: 'Dispatched', desc: 'Handed to Apple courier partner', completed: false, current: false },
    { title: 'Delivered', desc: 'Delivered to your address', completed: false, current: false },
  ];

  return (
    <StandalonePage
      title="Order Tracking"
      onBack={() => navigate('/')}
      rightAction={
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-[#0071e3] font-medium"
        >
          Home
        </button>
      }
    >
      <div className="flex-1 pb-16 space-y-4 p-4">
        {/* 1. Confirmation Banner */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-1">
            <PackageCheck size={24} />
          </div>
          <h2 className="text-base font-bold text-[#1d1d1f]">Thank You for Your Order</h2>
          <p className="text-xs text-[#86868b] max-w-[280px] mx-auto">
            Your Apple Store Malaysia order is confirmed and currently being prepared.
          </p>
          <div className="inline-block mt-2 px-3 py-1 bg-[#f5f5f7] rounded-full text-xs font-mono font-semibold text-[#1d1d1f]">
            Order #{orderId}
          </div>
        </div>

        {/* 2. Order Information */}
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
          <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
            Order Information
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-[#86868b]">Placed On</span>
              <span className="font-medium text-[#1d1d1f]">{orderDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-[#86868b]">Delivery Method</span>
              <span className="font-medium text-[#1d1d1f]">
                {deliveryType === 'delivery' ? 'Standard Delivery (Free)' : 'Store Pickup (TRX)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-[#86868b]">Payment</span>
              <span className="font-medium text-[#1d1d1f]">
                {order?.paymentMethod === 'duitnow_qr' ? 'DuitNow National QR' : 'Online Bank Transfer'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#86868b]">Estimated Delivery</span>
              <span className="font-bold text-emerald-600">
                {order?.estimatedDelivery || '2 - 4 Business Days'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Tracking Status (Step Timeline) */}
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-4">
          <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
            Tracking Status
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {statusSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-[#0071e3] text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.completed ? <CheckCircle2 size={12} /> : <Clock size={10} />}
                </div>

                {/* Step Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        step.completed ? 'text-[#1d1d1f]' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.current && (
                      <span className="text-[9px] bg-blue-100 text-[#0071e3] font-bold px-1.5 py-0.5 rounded-md uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Order Details (Items and destination) */}
        <section className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
          <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
            Order Details
          </h3>

          {/* Destination */}
          <div className="p-3 bg-[#f5f5f7] rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
              {deliveryType === 'delivery' ? <MapPin size={14} /> : <Store size={14} />}
              <span>{deliveryType === 'delivery' ? 'Ship To' : 'Pickup Location'}</span>
            </div>
            {deliveryType === 'delivery' ? (
              <div className="text-[11px] text-[#424245] leading-relaxed">
                {order?.shippingAddress?.fullName} • {order?.shippingAddress?.phone}
                <br />
                {order?.shippingAddress?.street}
                <br />
                {order?.shippingAddress?.city}, {order?.shippingAddress?.postcode} {order?.shippingAddress?.state}
              </div>
            ) : (
              <div className="text-[11px] text-[#424245]">
                Apple The Exchange TRX, L2-40, Persiaran TRX, 55188 Kuala Lumpur
              </div>
            )}
          </div>

          {/* Purchased Items List */}
          {order?.items && order.items.length > 0 && (
            <div className="divide-y divide-gray-100 pt-2 space-y-2">
              {order.items.map((item) => {
                const hasValidSale =
                  item.selectedSize.sale_price !== undefined &&
                  item.selectedSize.sale_price !== null &&
                  !isNaN(Number(item.selectedSize.sale_price)) &&
                  Number(item.selectedSize.sale_price) > 0;
                const price = hasValidSale
                  ? Number(item.selectedSize.sale_price)
                  : Number(item.selectedSize.price) || 0;
                return (
                  <div key={item.id} className="pt-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#fbfbfd] rounded-xl border border-black/5 p-1 flex items-center justify-center flex-shrink-0">
                      <img
                        src={item.selectedColor.image_link}
                        alt={item.product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <h5 className="font-semibold text-[#1d1d1f] truncate">
                        {item.product.title}
                      </h5>
                      <div className="text-[10px] text-[#86868b]">
                        {item.selectedColor.color} • {item.selectedSize.size} • Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#1d1d1f]">
                      RM{((price || 0) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total */}
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="font-semibold text-[#1d1d1f]">Amount Paid</span>
            <span className="font-bold text-sm text-[#1d1d1f]">
              {order?.total !== undefined && order?.total !== null
                ? `RM${Number(order.total).toLocaleString()}`
                : '---'}
            </span>
          </div>
        </section>

        {/* Back to Shopping Button */}
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="w-full py-3 bg-[#1d1d1f] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Continue Shopping</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </StandalonePage>
  );
};
