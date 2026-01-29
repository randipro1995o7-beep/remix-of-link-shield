import { Home, Shield, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  labelKey: 'home' | 'safety' | 'settings';
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', labelKey: 'home', icon: Home },
  { path: '/protection', labelKey: 'safety', icon: Shield },
  { path: '/settings', labelKey: 'settings', icon: Settings },
];

export function BottomNav() {
  const { t } = useApp();
  const location = useLocation();
  
  return (
    <nav className="bottom-nav z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-nav-active"
                  : "text-nav-foreground hover:text-foreground"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  "w-6 h-6 mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {t.nav[item.labelKey]}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
