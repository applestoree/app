import React from 'react';
import { Tabbar, TabbarLink, ToolbarPane } from 'konsta/react';

type AdminView = 'dashboard' | 'products' | 'orders' | 'users' | 'reviews';

interface AdminBottomNavProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems: { id: AdminView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { id: 'products', label: 'Products', icon: '▣' },
    { id: 'orders', label: 'Orders', icon: '▤' },
    { id: 'users', label: 'Users', icon: '♙' },
    { id: 'reviews', label: 'Reviews', icon: '▢' },
  ];

  return (
    <Tabbar labels icons className="sticky bottom-0 z-30 w-full">
      <ToolbarPane>
        {navItems.map((item) => (
          <TabbarLink
            key={item.id}
            id={`admin-nav-${item.id}`}
            active={activeView === item.id}
            onClick={() => onViewChange(item.id)}
            icon={<span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>}
            label={item.label}
            component="button"
          />
        ))}
      </ToolbarPane>
    </Tabbar>
  );
};
