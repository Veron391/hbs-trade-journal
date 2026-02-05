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
      setError('Email majburiy');
      setLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Xatolik yuz berdi. Keyinroq qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10 bg-[#050505] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/auth-bg.png")' }}
    >
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-white/15 bg-[rgba(10,10,10,0.2)] backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <img
            src="/saraf-logo.png"
            alt="Saraf"
            className="h-6 sm:h-7 w-auto"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
          Parolni unutdingizmi?
        </h1>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md mb-4 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-900/50 border border-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md mb-4 text-xs sm:text-sm">
            <p>Parolni tiklash bo‘yicha ko‘rsatmalar emailingizga yuborildi.</p>
            <p className="mt-4">
              <Link href="/auth/reset-password/confirm" className="text-blue-500 hover:underline">
                Parolni tiklash uchun OTP kiriting
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base text-center">
              Email manzilingizni kiriting, parolni tiklash bo‘yicha ko‘rsatmalarni yuboramiz.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <FormInput
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                backgroundColor="#3E433E"
              />

              <Button
                type="submit"
                fullWidth
                variant="neon"
                disabled={loading}
              >
                {loading ? 'Yuborilmoqda...' : 'Ko‘rsatmalarni yuborish'}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center text-gray-400 text-xs sm:text-sm">
              <Link href="/auth/login" className="text-blue-500 hover:underline">
                Kirish sahifasiga qaytish
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
