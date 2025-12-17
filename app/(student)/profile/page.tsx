"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';


export default function ProfilePage() {
  const { user, updateUser, changePassword } = useAuth();
  const router = useRouter();
  
  // All hooks must be called before any conditional returns
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Initialize state when user loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name);
      setEmail(user.email);
      setUsername(user.username || '');
      setPhoneNumber(user.phone_number || '');
    }
  }, [user]);


  // Show loading or nothing while redirecting
  if (!user) {
    return null;
  }
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!fullName.trim()) {
      setError('Full name is required');
      setMessage('');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      setMessage('');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setMessage('');
      return;
    }
    
    try {
      // Update the user using the AuthContext method
      await updateUser({ full_name: fullName.trim(), email: email.trim(), username: username.trim(), phone_number: phoneNumber.trim() });
      setMessage('Profile updated successfully');
      setError('');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setMessage('');
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentPassword) {
      setError('Current password is required');
      setMessage('');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      setMessage('');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setMessage('');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setMessage('');
      return;
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      setMessage('');
      return;
    }
    
    try {
      // Change password using the AuthContext method
      await changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setMessage('');
    }
  };
  
  
  
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Your Profile</h1>
      
      {message && (
        <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded-md mb-6">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-[#1C1719] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate}>
            <FormInput
              id="fullName"
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FormInput
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <FormInput
              id="phoneNumber"
              label="Phone Number"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            
            <FormInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div className="mt-6">
              <Button type="submit">
                Update Profile
              </Button>
            </div>
          </form>
        </div>
        
        {/* Change Password */}
        <div className="bg-[#1C1719] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange}>
            <FormInput
              id="currentPassword"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            
            <FormInput
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            
            <FormInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <div className="mt-6">
              <Button type="submit">
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      
    </div>
  );
} 