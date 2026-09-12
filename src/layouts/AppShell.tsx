import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header.tsx';
import { BottomNav } from '../components/BottomNav.tsx';

export const AppShell: React.FC = () => {
  return (
    <div
      id="app-shell"
      className="w-full max-w-[500px] h-full min-h-full flex flex-col bg-[#f5f5f7] shadow-xl border-x border-black/5 relative overflow-hidden"
    >
      <Header />
      <main id="app-content" className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
