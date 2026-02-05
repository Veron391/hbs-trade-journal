"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import FormInput from '../../../components/ui/FormInput';
import Button from '../../../components/ui/Button';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPasswordConfirm, user, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  if (authLoading || user) {
    return null;
  }

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
      await resetPasswordConfirm(email, code, password);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#110D0F] px-4">
      <div className="w-full max-w-md">
        <div className="p-6 bg-[#1C1719] rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
                      <img
                src="/saraf-logo.png"
                alt="Saraf"
                className="h-6 sm:h-7 w-auto"
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
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={errors.email}
          />

          <FormInput
            id="code"
            label="OTP Code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            error={errors.code}
          />
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
      </div>
    </div>
  );
} 