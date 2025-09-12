"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../context/AdminContext';
import {
  Search,
  LogOut
} from 'lucide-react';

interface AdminTopbarProps {}

export default function AdminTopbar({}: AdminTopbarProps) {
  const { adminUser, adminLogout } = useAdmin();
  const router = useRouter();

  const handleLogout = () => {
    adminLogout();
    router.push('/admin/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#1A1A1F] backdrop-blur border-b border-neutral-700/50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3">
              <img
                src="https://online.hbsakademiya.uz/images/svg/logo.svg"
                alt="HBS Academy"
                className="h-8 w-auto logo-partial-white"
              />
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users, trades, analytics..."
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1f] border-2 border-blue-500/40 rounded-lg text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 hover:bg-blue-900/30 hover:border-blue-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Right side - Welcome Text and Logout */}
          <div className="flex items-center gap-4">
            {/* Welcome Text */}
            <span className="text-neutral-300 text-sm">
              Welcome, {adminUser?.username || 'admin'}
            </span>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
