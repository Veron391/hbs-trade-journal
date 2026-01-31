"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
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
      const errorMessage = err.message || 'Kirish muvaffaqiyatsiz. Qayta urinib ko\'ring.';
      setIdentifierError(errorMessage);
      setPasswordError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090909] px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-md w-full p-4 sm:p-6 bg-[#131313] rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <img
            src="https://online.hbsakademiya.uz/images/svg/logo.svg"
            alt="HBS Academy"
            className="h-7 sm:h-8 w-auto logo-partial-white"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">Kirish</h1>

        <form onSubmit={handleSubmit}>
          <FormInput
            id="identifier"
            label="Email"
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (identifierError) setIdentifierError('');
            }}
            required
            error={identifierError}
            autoComplete="off"
            backgroundColor="#202020"
          />

          <FormInput
            id="password"
            label="Parol"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            required
            error={passwordError}
            autoComplete="current-password"
            backgroundColor="#202020"
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 bg-[#342F31] border-[#534E50] rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-xs sm:text-sm text-gray-400">
                Meni eslab qol
              </label>
            </div>

            <Link href="/auth/forgot-password" className="text-xs sm:text-sm text-blue-500 hover:underline">
              Parolni unutdingizmi?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="neon"
            disabled={loading}
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-gray-400 text-xs sm:text-sm">
          <span>Hisobingiz yo'qmi? </span>
          <Link href="/auth/register" className="text-blue-500 hover:underline">
            Ro'yxatdan o'tish
          </Link>
        </div>
      </div>
    </div>
  );
} 