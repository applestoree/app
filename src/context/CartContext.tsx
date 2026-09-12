import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Order } from '../types/cart.ts';
import { Product, ProductColor, ProductSize } from '../types/product.ts';
import { appleApi } from '../services/appleApi.ts';
import { useAuth } from './AuthContext.tsx';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color: ProductColor, size: ProductSize, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  orders: Order[];
  addOrder: (order: Order) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const mapOrder = (o: any): Order => ({
  id: o.id,
  items: o.items || [],
  subtotal: Number(o.subtotal || 0),
  shippingFee: Number(o.shipping_fee || 0),
  discount: Number(o.discount || 0),
  total: Number(o.total || 0),
  paymentMethod: o.payment?.method || 'bank_transfer',
  deliveryType: o.shipping?.method === 'store_pickup' ? 'pickup' : 'delivery',
  shippingMethod: o.shipping?.shipping_method || (o.shipping?.method === 'pickup' ? 'store_pickup' : o.shipping?.method || 'standard'),
  shippingAddress: o.address || { fullName: '', phone: '', street: '', city: '', state: '', postcode: '', country: 'Malaysia' },
  storeLocation: o.store?.location,
  status: o.status === 'pending' ? 'order_placed' : o.status,
  createdAt: o.created_at,
  estimatedDelivery: o.shipping?.estimated_delivery || '2 - 4 Business Days',
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => { try { const saved = localStorage.getItem('apple_my_cart'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [orders, setOrders] = useState<Order[]>(() => { try { const saved = localStorage.getItem('apple_my_orders'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [isCartOpen, setIsCartOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem('apple_my_cart', JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { try { localStorage.setItem('apple_my_orders', JSON.stringify(orders)); } catch {} }, [orders]);

  const refreshOrders = async () => {
    const phone = user?.phone;
    if (!phone) return;
    try {
      const result = await appleApi.getOrders(phone);
      setOrders((result.data || []).map(mapOrder));
    } catch {}
  };
  useEffect(() => { void refreshOrders(); }, [user?.phone]);

  const addToCart = (product: Product, color: ProductColor, size: ProductSize, quantity = 1) => setCart(prev => {
    const itemId = `${product.item_group_id}-${color.color}-${size.size}`; const existing = prev.find(item => item.id === itemId);
    return existing ? prev.map(item => item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item) : [...prev, { id: itemId, product, selectedColor: color, selectedSize: size, quantity }];
  });
  const updateQuantity = (id: string, quantity: number) => { if (quantity <= 0) return removeFromCart(id); setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item)); };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setCart([]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => { const sale = item.selectedSize.sale_price; const price = sale !== undefined && sale !== null && !isNaN(Number(sale)) && Number(sale) > 0 ? Number(sale) : Number(item.selectedSize.price) || 0; return sum + price * item.quantity; }, 0);

  const addOrder = async (order: Order): Promise<Order> => {
    const phone = user?.phone || order.shippingAddress.phone?.trim();
    if (!phone) throw new Error('Phone is required to place an order');
    const payload = {
      phone,
      items: order.items,
      address: { ...order.shippingAddress, phone },
      store: order.storeLocation ? { location: order.storeLocation } : null,
      shipping: { method: order.deliveryType, shipping_method: order.shippingMethod, estimated_delivery: order.estimatedDelivery },
      voucher: order.discount ? { discount: order.discount } : null,
      payment: { method: order.paymentMethod },
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      discount: order.discount,
      total: order.total,
      status: 'pending'
    };
    const result = await appleApi.createOrder(payload); const created = mapOrder(result.data); setOrders(prev => [created, ...prev]); return created;
  };

  return <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal, isCartOpen, openCart: () => setIsCartOpen(true), closeCart: () => setIsCartOpen(false), orders, addOrder, getOrderById: id => orders.find(o => o.id === id), refreshOrders }}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used within CartProvider'); return context; }
