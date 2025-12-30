import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="relative">
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>
      <main 
        className={cn(
          'flex-1 overflow-auto transition-all duration-300',
          'bg-gradient-to-br from-background via-background to-secondary/20'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};
