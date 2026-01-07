import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Wrench,
  Users,
  LogOut,
  Truck,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/* ================= ADMIN NAV ================= */
const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MapPin, label: 'Track', path: '/track' },
  { icon: Calendar, label: 'Assignments', path: '/assignments' },
  { icon: Wrench, label: 'Service', path: '/service' },
  { icon: Users, label: 'Profiles', path: '/profiles' },
];

/* ================= DRIVER NAV ================= */
const driverNavItems = [
  { icon: UserCircle, label: 'My Profile', path: '/profile' },
  { icon: Calendar, label: 'My Assignments', path: '/assignments' },
  { icon: Truck, label: 'Vehicle Status', path: '/service' },
];

export const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems =
    user?.role === 'ADMIN' ? adminNavItems : driverNavItems;

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ================= LOGO ================= */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg gradient-text">
              FleetTrack
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* ================= COLLAPSE BUTTON ================= */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-card border border-border"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>

      {/* ================= NAV ITEMS ================= */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const link = (
            <Link
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.path}>{link}</div>
          );
        })}
      </nav>

      {/* ================= USER + LOGOUT ================= */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        )}

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={logout}
              className={cn(
                'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                collapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Logout</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
};