import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TrackPage from "./pages/TrackPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import ServicePage from "./pages/ServicePage";
import ProfilesPage from "./pages/ProfilesPage";
import DriverProfilePage from "./pages/DriverProfilePage";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (isAuthenticated) {
        try {
          await checkAuthStatus();
        } catch (error) {
          console.error('Auth check failed:', error);
        } finally {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, checkAuthStatus, location.pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  // Redirect based on role
  const getDefaultRoute = () => {
    if (!isAuthenticated) return "/login";
    return user?.role === 'ADMIN' ? "/dashboard" : "/profile";
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={getDefaultRoute()} replace />} 
      />
      
      {/* Protected Routes with Dashboard Layout */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Admin-only routes */}
        <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/track" element={<AdminRoute><TrackPage /></AdminRoute>} />
        <Route path="/profiles" element={<AdminRoute><ProfilesPage /></AdminRoute>} />
        
        {/* Shared routes */}
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/service" element={<ServicePage />} />
        
        {/* Driver profile route */}
        <Route path="/profile" element={<DriverProfilePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;