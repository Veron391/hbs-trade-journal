"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import { useI18n } from '../../context/I18nContext';
import { parseApiError, getErrorTranslationKey } from '@/lib/utils/errorUtils';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  if (authLoading || user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError('');
    setPasswordError('');
    setLoading(true);

    try {
      await login(identifier, password);
      router.push('/');
    } catch (err: any) {
      // Parse the error message from API response
      const rawError = err.message || '';
      const parsedError = parseApiError(rawError);
      
      // Get translation key based on error message
      const translationKey = getErrorTranslationKey(parsedError);
      
      // Get humanized error message in user's language
      const errorMessage = t(translationKey);
      
      setIdentifierError(errorMessage);
      setPasswordError(errorMessage);
    } finally {
      setLoading(false);
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
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Log In</h1>
      
      <form onSubmit={handleSubmit}>
        <FormInput
          id="identifier"
          label="Email or Username"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (identifierError) setIdentifierError('');
          }}
          required
          placeholder="email or username"
          error={identifierError}
        />
        
        <FormInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError('');
          }}
          required
          error={passwordError}
        />
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 text-blue-600 bg-[#342F31] border-[#534E50] rounded focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
              Remember me
            </label>
          </div>
          
          <Link href="/auth/forgot-password" className="text-sm text-blue-500 hover:underline">
            Forgot password?
          </Link>
        </div>
        
        <Button 
          type="submit" 
          fullWidth 
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
      
        <div className="mt-6 text-center text-gray-400">
          <span>Don't have an account? </span>
          <Link href="/auth/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
} 