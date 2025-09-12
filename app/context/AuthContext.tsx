"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  getAllUsers: () => User[];
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: async () => {},
  changePassword: async () => false,
  forgotPassword: async () => {},
  resetPassword: async () => {},
  getAllUsers: () => [],
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function - replace with real API call
  const login = async (email: string, password: string) => {
    try {
      // Check if user exists in localStorage
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingUser = existingUsers.find((u: any) => u.email === email);
      
      if (!existingUser) {
        throw new Error('Account does not exist. Please register first.');
      }
      
      // Simulate password check (in real app, this would be hashed)
      if (existingUser.password !== password) {
        throw new Error('Invalid password');
      }
      
      const mockUser: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      throw error;
    }
  };

  // Mock register function - replace with real API call
  const register = async (name: string, email: string, password: string) => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingUser = existingUsers.find((u: any) => u.email === email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password, // In real app, this would be hashed
      };
      
      // Save to registered users list
      existingUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      // Clear any existing trades for new user (clean slate)
      localStorage.removeItem('trades');
      localStorage.removeItem('hasAddedSamples');
      
      // Create user object for session
      const mockUser: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get registered users from localStorage
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const currentUserIndex = existingUsers.findIndex((u: any) => u.id === user.id);
      
      if (currentUserIndex === -1) {
        throw new Error('User not found in database');
      }

      // Check if email is being changed and if it already exists
      if (userData.email && userData.email !== user.email) {
        const emailExists = existingUsers.some((u: any) => u.email === userData.email && u.id !== user.id);
        if (emailExists) {
          throw new Error('Email already exists. Please choose a different email.');
        }
      }

      // Update user in registered users list
      existingUsers[currentUserIndex] = {
        ...existingUsers[currentUserIndex],
        ...userData
      };
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

      // Update current user session
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get registered users from localStorage
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const currentUserIndex = existingUsers.findIndex((u: any) => u.id === user.id);
      
      if (currentUserIndex === -1) {
        throw new Error('User not found in database');
      }

      // Verify current password
      if (existingUsers[currentUserIndex].password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      existingUsers[currentUserIndex].password = newPassword;
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Mock forgot password function - replace with real API call
  const forgotPassword = async (email: string) => {
    // Simulate API call to send password reset email
    console.log(`Password reset email sent to ${email}`);
  };

  // Mock reset password function - replace with real API call
  const resetPassword = async (token: string, newPassword: string) => {
    // Simulate API call to reset password
    console.log(`Password reset for token ${token}`);
  };

  // Get all registered users
  const getAllUsers = (): User[] => {
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        const users = JSON.parse(registeredUsers);
        return users.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  };

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
        resetPassword,
        getAllUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 