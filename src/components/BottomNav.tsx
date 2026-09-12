import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'nav-home',
      label: 'Home',
      path: '/',
      icon: Home,
      isActive: location.pathname === '/',
    },
    {
      id: 'nav-products',
      label: 'Products',
      path: '/products',
      icon: Layers,
      isActive: location.pathname === '/products',
    },
    {
      id: 'nav-profile',
      label: 'Profile',
      path: '/profile',
      icon: User,
      isActive: location.pathname === '/profile',
    },
  ];

  return (
    <nav
      id="bottom-nav"
      className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-black/5 py-2 px-6 flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            id={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 ${
              item.isActive ? 'text-[#0071e3]' : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <Icon size={20} strokeWidth={item.isActive ? 2.3 : 1.8} />
            <span
              className={`text-[11px] font-medium tracking-tight ${
                item.isActive ? 'font-semibold' : ''
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
