"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Settings, LogOut, House, CalendarDays, TrendingUp, Newspaper } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useFormContext } from "../../context/FormContext";
import LanguageSelector from "./LanguageSelector";

export default function NavMenu() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();
  const { isTradeFormOpen } = useFormContext();

  // Locale-aware pathname normalization so active styles work with /uz /ru /en prefixes
  const normalizePath = (p: string) => {
    if (!p) return '/';
    const parts = p.split('/').filter(Boolean);
    if (parts.length === 0) return '/';
    const first = parts[0];
    if (first === 'uz' || first === 'ru' || first === 'en') {
      const rest = '/' + parts.slice(1).join('/');
      return rest === '/' ? '/' : rest;
    }
    return p;
  };
  const current = normalizePath(pathname || '/');

  // Check if a route is active
  const isActive = (path: string) => {
    const target = path;
    if (target === '/') {
      return current === '/';
    }
    return current === target || current.startsWith(`${target}/`);
  };

  // Active link style
  const activeLinkClass = "text-green-300 font-bold";
  const linkClass = "hover:text-green-400 transition-colors font-semibold";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    updateMenuPosition();
    setIsMenuOpen(true);
  };

  const handleCloseWithDelay = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 150);
  };

  const handleToggleClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    } else {
      updateMenuPosition();
      handleOpen();
    }
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const onResizeOrScroll = () => updateMenuPosition();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
    };
  }, [isMenuOpen]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <nav className="flex items-center justify-between w-full" role="navigation" aria-label="Main navigation">
        <div className="flex-1"></div>
        <div className="flex items-center space-x-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
        </div>
        <div className="flex-1"></div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between w-full" role="navigation" aria-label="Main navigation">
      {user ? (
        // Authenticated user menu
        <>
          <div className="flex-1"></div>
          <ul className="flex items-center space-x-8" role="menubar">
            <li role="none">
              {isTradeFormOpen ? (
                <span
                  className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-2 opacity-50 cursor-not-allowed`}
                  title="Complete or cancel the trade form first"
                >
                  <House size={18} />
                  {t('journal')}
                </span>
              ) : (
                <Link
                  href="/"
                  className={`${isActive("/") ? "text-green-300 bg-[rgba(34,197,94,0.15)] px-4 py-2" : `${linkClass} px-3 py-1`} rounded-20 flex items-center gap-2`}
                  role="menuitem"
                  aria-current={isActive("/") ? "page" : undefined}
                >
                  <House size={18} />
                  {t('journal')}
                </Link>
              )}
            </li>
            <li>
              {isTradeFormOpen ? (
                <span
                  className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-2 opacity-50 cursor-not-allowed`}
                  title="Complete or cancel the trade form first"
                >
                  <CalendarDays size={18} />
                  {t('calendar')}
                </span>
              ) : (
                <Link
                  href="/calendar"
                  className={`${isActive("/calendar") ? "text-green-300 bg-[rgba(34,197,94,0.15)] px-4 py-2" : `${linkClass} px-3 py-1`} rounded-20 flex items-center gap-2`}
                >
                  <CalendarDays size={18} />
                  {t('calendar')}
                </Link>
              )}
            </li>
            <li>
              {isTradeFormOpen ? (
                <span
                  className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-2 opacity-50 cursor-not-allowed`}
                  title="Complete or cancel the trade form first"
                >
                  <TrendingUp size={18} />
                  {t('stats')}
                </span>
              ) : (
                <Link
                  href="/stats"
                  className={`${isActive("/stats") ? "text-green-300 bg-[rgba(34,197,94,0.15)] px-4 py-2" : `${linkClass} px-3 py-1`} rounded-20 flex items-center gap-2`}
                >
                  <TrendingUp size={18} />
                  {t('stats')}
                </Link>
              )}
            </li>
            <li>
              <a
                href="https://www.investing.com/economic-calendar/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-2`}
              >
                <Newspaper size={18} />
                {t('macroNews')}
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                  />
                </svg>
              </a>
            </li>
          </ul>
          <div className="flex-1"></div>
          
          <LanguageSelector />
          <div
            className="relative flex items-center isolation-auto"
            onMouseEnter={handleOpen}
            onMouseLeave={handleCloseWithDelay}
          >
            <button
              onClick={handleToggleClick}
              className="flex items-center space-x-2 text-gray-200 hover:text-white px-4 py-2 rounded-20 bg-[rgba(34,197,94,0.15)] hover:bg-[rgba(34,197,94,0.23)]"
              ref={buttonRef}
            >
              <User size={16} />
              <span className="whitespace-nowrap">{user.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isMenuOpen && typeof document !== "undefined" &&
              createPortal(
                <div
                  className="fixed z-[9999] will-change-transform"
                  style={{ top: menuPos.top, left: menuPos.left, transform: "translateX(-50%)", minWidth: "200px" }}
                  onMouseEnter={handleOpen}
                  onMouseLeave={handleCloseWithDelay}
                >
                  <div className="relative rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22),0_8px_20px_rgba(0,0,0,0.18)]">
                    {/* Blur + translucent background (bottom layer) */}
                    <div className="absolute inset-0 rounded-2xl backdrop-blur-2xl bg-[rgba(30, 24, 27, 0.28)] z-0" />
                    {/* Subtle 3D depth with a single inner shadow */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_-1px_2px_rgba(0,0,0,0.35)] z-10" />
                    {/* 2px uniform outline */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_0.3px_rgba(255,255,255,0.5)] z-20" />
                    <div className="relative py-1 z-30">
                      <div className="px-4 py-2 text-sm text-gray-300/90 border-b border-white/5 whitespace-nowrap">
                        {user.email}
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 whitespace-nowrap"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User size={18} className="text-gray-300" />
                        Profile
                      </Link>
                      <Link
                        href="/profile?tab=settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/5 whitespace-nowrap border-t border-white/8"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings size={18} className="text-gray-300" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/5 whitespace-nowrap border-t border-white/8"
                      >
                        <LogOut size={18} className="text-red-400" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </div>
        </>
      ) : (
        // Guest menu
        <ul className="flex space-x-4">
          <li>
            <Link
              href="/auth/login"
              className={
                isActive("/auth/login") ? activeLinkClass : linkClass
              }
            >
              Login
            </Link>
          </li>
          <li>
            <Link
              href="/auth/register"
              className={
                isActive("/auth/register")
                  ? activeLinkClass
                  : "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
              }
            >
              Register
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
} 