"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  lastActive: string;
  trades: any[];
}

interface AdminContextType {
  adminUser: AdminUser | null;
  users: UserData[];
  isAdminAuthenticated: boolean;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  getAllUsers: () => UserData[];
  getUserById: (id: string) => UserData | null;
  refreshUserData: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Mock admin credentials - In production, this would be handled by a backend
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check for existing admin session on mount
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        setAdminUser(session);
        setIsAdminAuthenticated(true);
        refreshUserData();
      } catch (error) {
        console.error('Invalid admin session:', error);
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    // Simple authentication - in production, this would be a secure API call
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const adminUser: AdminUser = {
        id: 'admin-1',
        username: username,
        isAdmin: true
      };
      
      setAdminUser(adminUser);
      setIsAdminAuthenticated(true);
      localStorage.setItem('adminSession', JSON.stringify(adminUser));
      refreshUserData();
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminSession');
    setUsers([]);
  };

  const refreshUserData = () => {
    // Mock user data - in production, this would fetch from a backend
    const mockUsers: UserData[] = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        joinDate: '2024-01-15',
        totalTrades: 45,
        totalPnL: 2350.50,
        winRate: 68.9,
        lastActive: '2024-01-20',
        trades: []
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        joinDate: '2024-01-10',
        totalTrades: 32,
        totalPnL: -450.25,
        winRate: 43.8,
        lastActive: '2024-01-19',
        trades: []
      },
      {
        id: 'user-3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        joinDate: '2024-01-05',
        totalTrades: 78,
        totalPnL: 5240.75,
        winRate: 75.6,
        lastActive: '2024-01-20',
        trades: []
      },
      {
        id: 'user-4',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        joinDate: '2023-12-20',
        totalTrades: 156,
        totalPnL: 12850.30,
        winRate: 82.1,
        lastActive: '2024-01-20',
        trades: []
      }
    ];

    setUsers(mockUsers);
  };

  const getAllUsers = (): UserData[] => {
    return users;
  };

  const getUserById = (id: string): UserData | null => {
    return users.find(user => user.id === id) || null;
  };

  const value: AdminContextType = {
    adminUser,
    users,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    getAllUsers,
    getUserById,
    refreshUserData,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
