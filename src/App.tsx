import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppShell } from './layouts/AppShell.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProductPage } from './pages/ProductPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { DetailProductPage } from './pages/DetailProductPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { DeliveryAddressPage } from './pages/DeliveryAddressPage.tsx';
import { TrackingPage } from './pages/TrackingPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { CartOverlay } from './overlays/CartOverlay.tsx';

function AdminAccessRedirect() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || user?.role !== 'admin') return;
    if (location.pathname !== '/admin') navigate('/admin', { replace: true });
  }, [loading, user?.role, location.pathname, navigate]);

  return null;
}

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  return <AdminPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AdminAccessRedirect />
          <CartOverlay />
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/product/:id" element={<DetailProductPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/delivery-address" element={<DeliveryAddressPage />} />
            <Route path="/tracking/:id" element={<TrackingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
