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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'To\'liq ism majburiy';
    }
    if (!username.trim()) {
      newErrors.username = 'Foydalanuvchi nomi majburiy';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon raqami majburiy';
    }

    if (!email.trim()) {
      newErrors.email = 'Email majburiy';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email noto\'g\'ri';
    }

    if (!password) {
      newErrors.password = 'Parol majburiy';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Iltimos, parolni tasdiqlang';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi. Xuddi shu parolni kiriting.';
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
        form: err.message || 'Ro\'yxatdan o\'tish muvaffaqiyatsiz. Qayta urinib ko\'ring.'
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
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10 bg-[#050505] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(\"/auth-bg.png\")' }}
    >
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-white/15 bg-[rgba(10,10,10,0.2)] backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <img
            src="/saraf-logo.png"
            alt="Saraf"
            className="h-6 sm:h-7 w-auto"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">Hisob yaratish</h1>

        {errors.form && (
          <div className="bg-red-900/50 border border-red-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md mb-4 text-xs sm:text-sm">
            {errors.form}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          <FormInput
            id="fullName"
            label="To'liq ism-familiyangiz"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            error={errors.fullName}
            autoComplete="off"
            backgroundColor="#3E433E"
          />
          <FormInput
            id="username"
            label="Foydalanuvchi nomi"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            error={errors.username}
            autoComplete="off"
            backgroundColor="#3E433E"
          />

          <FormInput
            id="phone"
            label="Telefon raqami"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            error={errors.phoneNumber}
            autoComplete="off"
            backgroundColor="#3E433E"
          />

          <FormInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={errors.email}
            autoComplete="off"
            backgroundColor="#3E433E"
          />

          <FormInput
            id="password"
            label="Parol"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={errors.password}
            autoComplete="new-password"
            backgroundColor="#3E433E"
          />

          <FormInput
            id="confirmPassword"
            label="Parolni tasdiqlash"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            error={errors.confirmPassword}
            autoComplete="new-password"
            backgroundColor="#3E433E"
          />

          <div className="mt-4 sm:mt-6">
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              variant="neon"
            >
              {loading ? 'Hisob yaratilmoqda...' : 'Hisob yaratish'}
            </Button>
          </div>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-gray-400 text-xs sm:text-sm">
          <span>Allaqachon hisobingiz bormi? </span>
          <Link href="/auth/login" className="text-green-500 hover:underline">
            Kirish
          </Link>
        </div>
      </div>
    </div>
  );
} 