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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MapPin, label: 'Track', path: '/track' },
  { icon: Calendar, label: 'Assignments', path: '/assignments' },
  { icon: Wrench, label: 'Service', path: '/service' },
  { icon: Users, label: 'Profiles', path: '/profiles' },
];

const driverNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'My Assignments', path: '/assignments' },
  { icon: Users, label: 'Profile', path: '/profiles' },
  { icon: Truck, label: 'Vehicle Status', path: '/service' },
];

export const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = user?.role === 'ADMIN' ? adminNavItems : driverNavItems;

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg gradient-text">FleetTrack</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-card border border-border hover:bg-secondary"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const linkContent = (
            <Link
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent group',
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 flex-shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              )} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.path}>{linkContent}</div>;
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                collapsed ? 'justify-center px-2' : 'justify-start'
              )}
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="bg-card border-border">
              Logout
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
};
