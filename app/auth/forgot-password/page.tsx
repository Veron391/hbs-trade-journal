"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword, user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user) {
      // Already authenticated; redirect to home
      window.location.href = '/';
    }
  }, [authLoading, user]);

  if (authLoading || user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-[#1C1719] rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-6">
                    <img 
              src="https://online.hbsakademiya.uz/images/svg/logo.svg" 
              alt="HBS Academy" 
              className="h-8 w-auto logo-partial-white"
            />
      </div>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Reset Password</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded-md mb-4">
          <p>Password reset instructions have been sent to your email.</p>
          <p className="mt-4">
            <Link href="/auth/reset-password/confirm" className="text-blue-500 hover:underline">
              Enter OTP to reset password
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          
          <form onSubmit={handleSubmit}>
            <FormInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="john@example.com"
            />
            
            <div className="mt-6">
              <Button
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-gray-400">
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Back to login
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 