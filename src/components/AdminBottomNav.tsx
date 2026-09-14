import React from 'react';
import { Tabbar, TabbarLink, ToolbarPane } from 'konsta/react';
import { LayoutDashboard, Layers, ShoppingBag, Users, Star } from 'lucide-react';

type AdminView = 'dashboard' | 'products' | 'orders' | 'users' | 'reviews';

interface AdminBottomNavProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard' as AdminView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as AdminView, label: 'Products', icon: Layers },
    { id: 'orders' as AdminView, label: 'Orders', icon: ShoppingBag },
    { id: 'users' as AdminView, label: 'Users', icon: Users },
    { id: 'reviews' as AdminView, label: 'Reviews', icon: Star },
  ];

  return (
    <Tabbar labels icons className="sticky bottom-0 z-30 w-full !w-full left-0 right-0">
      <ToolbarPane className="w-full !w-full flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <TabbarLink
              key={item.id}
              id={`admin-nav-${item.id}`}
              active={isActive}
              onClick={() => onViewChange(item.id)}
              className="flex-1 !flex-1 text-center"
              icon={
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={`transition-transform duration-150 ${isActive ? 'text-[#0071e3] scale-105' : 'text-gray-400'}`}
                />
              }
              label={item.label}
              component="button"
            />
          );
        })}
      </ToolbarPane>
    </Tabbar>
  );
};
