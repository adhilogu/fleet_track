import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'driver';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, User> = {
  'admin@fleet.com': {
    id: '1',
    name: 'Admin User',
    email: 'admin@fleet.com',
    role: 'admin',
  },
  'driver@fleet.com': {
    id: '2',
    name: 'John Driver',
    email: 'driver@fleet.com',
    role: 'driver',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('fleet_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = mockUsers[email];
    if (mockUser && mockUser.role === role && password === 'password') {
      setUser(mockUser);
      localStorage.setItem('fleet_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fleet_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
