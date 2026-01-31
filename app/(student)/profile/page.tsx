"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import { User, Copy, Check, ChevronLeft } from 'lucide-react';

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Show loading or nothing while redirecting
  if (!user) {
    return null;
  }

  // Extract first and last name from full_name
  const fullNameParts = (user.full_name || user.name || '').split(' ');
  const firstName = fullNameParts[0] || '';
  const lastName = fullNameParts.slice(1).join(' ') || '';

  const handleCopyUID = () => {
    if (user.username) {
      navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      setError('Passwords do not match');
      setMessage('');
      return;
    }

    try {
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1
          onClick={() => router.back()}
          className="text-2xl font-bold text-white hover:text-[#D9FE43] transition-colors cursor-pointer"
        >
          Settings
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-lg font-medium transition-colors relative ${activeTab === 'profile' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
        >
          Profile
          {activeTab === 'profile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-lg font-medium transition-colors relative ${activeTab === 'security' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
        >
          Security
          {activeTab === 'security' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
      </div>

      {/* Messages */}
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* UID Card */}
          <div className="bg-[#171717] rounded-lg p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <User size={32} className="text-gray-300" />
            </div>
            <div className="flex-1">
              <div className="text-gray-400 text-sm mb-1">UID:</div>
              <div className="flex items-center gap-2">
                <span className="text-[#D9FE43] text-xl font-semibold">
                  {user.username || 'N/A'}
                </span>
                <button
                  onClick={handleCopyUID}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy UID"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-[#171717] rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-[#262626]">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{user.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Phone</span>
                <span className="text-white">{user.phone_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-[#171717] rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-[#262626]">
                <span className="text-gray-400">First name</span>
                <span className="text-white">{firstName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Last name</span>
                <span className="text-white">{lastName || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-[#171717] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>

          <form onSubmit={handlePasswordChange}>
            <FormInput
              id="currentPassword"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              backgroundColor="#202020"
            />

            <FormInput
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              backgroundColor="#202020"
            />

            <FormInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              backgroundColor="#202020"
            />

            <div className="mt-6">
              <Button type="submit" variant="neon">
                Change Password
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}