import React from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare } from 'lucide-react';

type AdminView = 'dashboard' | 'products' | 'orders' | 'users' | 'reviews';

interface AdminBottomNavProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare },
  ];

  return (
    <nav
      id="admin-bottom-nav"
      className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-black/5 py-2 px-1 flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            id={`admin-nav-${item.id}`}
            onClick={() => onViewChange(item.id)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 transition-all duration-150 active:scale-95 ${
              isActive ? 'text-[#0071e3]' : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
            <span className={`truncate text-[10px] font-medium tracking-tight ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
