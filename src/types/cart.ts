import { Product, ProductColor, ProductSize } from './product.ts';

export interface CartItem {
  id: string; // unique cart item id (e.g. `${product.item_group_id}-${selectedColor.color}-${selectedSize.size}`)
  product: Product;
  selectedColor: ProductColor;
  selectedSize: ProductSize;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export type PaymentMethod = 'bank_transfer' | 'duitnow_qr';

export type DeliveryType = 'delivery' | 'pickup';

export type ShippingMethod = 'store_pickup' | 'same_day' | 'standard' | 'east_malaysia';

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  shippingMethod: ShippingMethod;
  shippingAddress: ShippingAddress;
  storeLocation?: string;
  status: 'order_placed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  createdAt: string;
  estimatedDelivery: string;
}
