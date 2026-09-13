import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CartProvider } from './context/CartContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppShell } from './layouts/AppShell.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProductPage } from './pages/ProductPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { DetailProductPage } from './pages/DetailProductPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { DeliveryAddressPage } from './pages/DeliveryAddressPage.tsx';
import { TrackingPage } from './pages/TrackingPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { CartOverlay } from './overlays/CartOverlay.tsx';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <CartOverlay />
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/product/:id" element={<DetailProductPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/delivery-address" element={<DeliveryAddressPage />} />
            <Route path="/tracking/:id" element={<TrackingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <SpeedInsights />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
