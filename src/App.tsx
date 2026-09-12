import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext.tsx';
import { AppShell } from './layouts/AppShell.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProductPage } from './pages/ProductPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { DetailProductPage } from './pages/DetailProductPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { TrackingPage } from './pages/TrackingPage.tsx';
import { CartOverlay } from './overlays/CartOverlay.tsx';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        {/* Global Cart Overlay Drawer */}
        <CartOverlay />

        {/* Routes configuration */}
        <Routes>
          {/* AppShell routes (with Header, Content, BottomNav) */}
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Standalone pages (no BottomNav) */}
          <Route path="/product/:id" element={<DetailProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/tracking/:id" element={<TrackingPage />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
