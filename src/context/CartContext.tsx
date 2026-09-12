import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Order } from '../types/cart.ts';
import { Product, ProductColor, ProductSize } from '../types/product.ts';
import { appleApi } from '../services/appleApi.ts';

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
  addOrder: (order: Order) => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const USER_KEY = 'apple_auth_user';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => { try { const saved = localStorage.getItem('apple_my_cart'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [orders, setOrders] = useState<Order[]>(() => { try { const saved = localStorage.getItem('apple_my_orders'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => { try { localStorage.setItem('apple_my_cart', JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { try { localStorage.setItem('apple_my_orders', JSON.stringify(orders)); } catch {} }, [orders]);

  const refreshOrders = async () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const user = raw ? JSON.parse(raw) : null;
      if (!user?.phone) return;
      const result = await appleApi.getOrders(user.phone);
      setOrders(result.data || []);
    } catch {}
  };

  useEffect(() => { void refreshOrders(); }, []);

  const addToCart = (product: Product, color: ProductColor, size: ProductSize, quantity = 1) => setCart((prev) => {
    const itemId = `${product.item_group_id}-${color.color}-${size.size}`;
    const existing = prev.find((item) => item.id === itemId);
    return existing ? prev.map((item) => item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item) : [...prev, { id: itemId, product, selectedColor: color, selectedSize: size, quantity }];
  });
  const updateQuantity = (id: string, quantity: number) => { if (quantity <= 0) return removeFromCart(id); setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity } : item)); };
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => { const sale = item.selectedSize.sale_price; const price = sale !== undefined && sale !== null && !isNaN(Number(sale)) && Number(sale) > 0 ? Number(sale) : Number(item.selectedSize.price) || 0; return sum + price * item.quantity; }, 0);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addOrder = async (order: Order) => {
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    if (!user?.phone) throw new Error('Please login before placing an order');
    const payload = { phone: user.phone, items: order.items, address: order.shippingAddress, store: order.storeLocation ? { location: order.storeLocation } : null, shipping: { method: order.deliveryType, estimated_delivery: order.estimatedDelivery }, voucher: null, payment: { method: order.paymentMethod }, subtotal: order.subtotal, shipping_fee: order.shippingFee, discount: order.discount, total: order.total, status: order.status };
    const result = await appleApi.createOrder(payload);
    const created = result.data;
    setOrders((prev) => [created, ...prev]);
  };

  const getOrderById = (id: string) => orders.find((o) => o.id === id);
  return <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal, isCartOpen, openCart, closeCart, orders, addOrder, getOrderById, refreshOrders }}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used within a CartProvider'); return context; }
