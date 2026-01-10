// File: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  username: string;
  role: string;
  userId: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('jwt_token');
    
    if (!storedToken) {
      logout();
      return;
    }

    try {
      // ✅ CHANGE THIS - Update the URL to match your backend
      const response = await fetch('http://localhost:8080/api/auth/verify', {  // ✅ ADD YOUR BACKEND URL
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Token verification failed:', response.status);
        
        // ✅ Handle different error codes
        if (response.status === 403 || response.status === 401) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error('Authentication error. Please login again.');
        }
        
        logout();
      }
      // ✅ If response is OK, token is valid - do nothing
    } catch (error) {
      console.error('Auth verification failed:', error);
      toast.error('Unable to connect to server.');
      logout();
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // Verify token on mount
        checkAuthStatus();
      } catch (error) {
        console.error('Failed to parse user data:', error);
        logout();
      }
    }
  }, []); // ✅ Empty dependency array is fine here

  const login = (authToken: string, userData: User) => {
    localStorage.setItem('jwt_token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};