"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const { register, user, loading: authLoading } = useAuth();
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
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match. Please enter the same password.';
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
      await register(fullName, email, username, phoneNumber, password, confirmPassword);
      router.push('/');
    } catch (err: any) {
      setErrors({
        form: err.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation for password confirmation
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Clear confirm password error if passwords match
    if (value && password && value === password) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#110D0F] px-4">
      <div className="max-w-md w-full p-6 bg-[#1C1719] rounded-lg shadow-lg">
             <div className="flex items-center justify-center mb-6">
                    <img 
              src="https://online.hbsakademiya.uz/images/svg/logo.svg" 
              alt="HBS Academy" 
              className="h-8 w-auto logo-partial-white"
            />
       </div>
       <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h1>
      
      {errors.form && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-md mb-4">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <FormInput
          id="fullName"
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="John Doe"
          error={errors.fullName}
        />
        <FormInput
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="johndoe"
          error={errors.username}
        />

        <FormInput
          id="phone"
          label="Phone Number"
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          placeholder="+1 555 555 5555"
          error={errors.phoneNumber}
        />
        
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="john@example.com"
          error={errors.email}
        />
        
        <FormInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={errors.password}
        />
        
        <FormInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
          error={errors.confirmPassword}
        />
        
        <div className="mt-6">
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="success"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </div>
      </form>
      
        <div className="mt-6 text-center text-gray-400">
          <span>Already have an account? </span>
          <Link href="/auth/login" className="text-green-500 hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
} 