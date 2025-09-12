"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import FormInput from '../../../components/ui/FormInput';
import Button from '../../../components/ui/Button';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const { resetPassword } = useAuth();
  const router = useRouter();
  const { token } = params;

  // Check if token is valid
  useEffect(() => {
    // In a real app, you would validate the token with your backend
    // This is a mock implementation
    if (!token || token.length < 10) {
      setTokenValid(false);
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setErrors({
        form: 'Password reset failed. Please try again or request a new reset link.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="max-w-md mx-auto p-6 bg-[#1C1719] rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
                      <img 
              src="https://online.hbsakademiya.uz/images/svg/logo.svg" 
              alt="HBS Academy" 
              className="h-8 w-auto logo-partial-white"
            />
        </div>
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Invalid Reset Link</h1>
        <p className="text-gray-400 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/auth/forgot-password">
          <Button fullWidth>Request New Reset Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-[#1C1719] rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-6">
                    <img 
              src="https://online.hbsakademiya.uz/images/svg/logo.svg" 
              alt="HBS Academy" 
              className="h-8 w-auto logo-partial-white"
            />
      </div>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Reset Your Password</h1>
      
      {errors.form && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-md mb-4">
          {errors.form}
        </div>
      )}
      
      {success ? (
        <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded-md mb-4">
          <p>Your password has been reset successfully!</p>
          <p className="mt-2">Redirecting to login page...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormInput
            id="password"
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={errors.password}
          />
          
          <FormInput
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={errors.confirmPassword}
          />
          
          <div className="mt-6">
            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      )}
      
      <div className="mt-6 text-center text-gray-400">
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
} 