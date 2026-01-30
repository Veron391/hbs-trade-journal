"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define user type
export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  full_name?: string;
  phone_number?: string | null;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    full_name: string,
    email: string,
    username: string,
    phone_number: string,
    password: string,
    password_confirm: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: { full_name?: string; email?: string; username?: string; phone_number?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
  resetPasswordConfirm: (email: string, code: string, new_password: string) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  changePassword: async () => false,
  forgotPassword: async () => {},
  resetPasswordConfirm: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load by calling profile endpoint
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/profile', {
          credentials: 'include',
          next: { revalidate: 60 } // Cache for 60 seconds (user profile doesn't change often)
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: User = {
            id: data.id,
            email: data.email,
            name: data.full_name || data.username || data.email,
            username: data.username,
            full_name: data.full_name,
            phone_number: data.phone_number,
          };
          setUser(mapped);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Real login using backend API
  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const errText = await res.text();
      // Parse and return the error message (will be humanized in the component)
      throw new Error(errText || 'Login failed');
    }
    const profile = await fetch('/api/users/profile', { credentials: 'include' });
    if (!profile.ok) {
      throw new Error('Failed to load user profile');
    }
    const data = await profile.json();
    const mapped: User = {
      id: data.id,
      email: data.email,
      name: data.full_name || data.username || data.email,
      username: data.username,
      full_name: data.full_name,
      phone_number: data.phone_number,
    };
    setUser(mapped);
    } finally {
      setLoading(false);
    }
  };

  // Real register using backend API
  const register = async (
    full_name: string,
    email: string,
    username: string,
    phone_number: string,
    password: string,
    password_confirm: string
  ) => {
    setLoading(true);
    try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ full_name, email, username, phone_number, password, password_confirm }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Registration failed');
    }
    // Try to load profile after registration (if backend establishes session)
    const profile = await fetch('/api/users/profile', { credentials: 'include' });
    if (profile.ok) {
      const data = await profile.json();
      const mapped: User = {
        id: data.id,
        email: data.email,
        name: data.full_name || data.username || data.email,
        username: data.username,
        full_name: data.full_name,
        phone_number: data.phone_number,
      };
      setUser(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Force a page reload to clear any cached data
      // Loading will be reset after page reload
      window.location.href = '/';
    }
  };

  // Update user function -> backend profile update
  const updateUser = async (userData: { full_name?: string; email?: string; username?: string; phone_number?: string }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const res = await fetch('/api/users/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to update profile');
    }
    const profile = await fetch('/api/users/profile', { credentials: 'include' });
    if (!profile.ok) {
      throw new Error('Failed to reload profile');
    }
    const data = await profile.json();
    const mapped: User = {
      id: data.id,
      email: data.email,
      name: data.full_name || data.username || data.email,
      username: data.username,
      full_name: data.full_name,
      phone_number: data.phone_number,
    };
    setUser(mapped);
  };

  // Change password function (not specified in provided backend endpoints)
  const changePassword = async () => {
    return false;
  };

  // Forgot password using backend endpoint
  const forgotPassword = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to request password reset');
    }
  };

  // Confirm password reset (OTP)
  const resetPasswordConfirm = async (email: string, code: string, new_password: string) => {
    const res = await fetch('/api/auth/forgot-password/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code, new_password }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to confirm password reset');
    }
  };

  // getAllUsers removed (not required)

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        updateUser,
        changePassword,
        forgotPassword, 
        resetPasswordConfirm
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 