"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Settings, LogOut, House, CalendarDays, PieChart, Newspaper, Menu, X } from "lucide-react";
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
  const activeLinkClass = "text-[#D9FE43] font-bold";
  const linkClass = "hover:text-[#D9FE43] transition-colors font-semibold";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Refs for menu items to calculate sliding indicator position
  const journalRef = useRef<HTMLLIElement | null>(null);
  const calendarRef = useRef<HTMLLIElement | null>(null);
  const statsRef = useRef<HTMLLIElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ width: number; left: number; opacity: number }>({
    width: 0,
    left: 0,
    opacity: 0,
  });

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

  const menuRef = useRef<HTMLUListElement | null>(null);

  // Update sliding indicator position based on active link
  useEffect(() => {
    const updateIndicator = () => {
      let activeRef: HTMLLIElement | null = null;

      if (isActive("/") && journalRef.current) {
        activeRef = journalRef.current;
      } else if (isActive("/calendar") && calendarRef.current) {
        activeRef = calendarRef.current;
      } else if (isActive("/stats") && statsRef.current) {
        activeRef = statsRef.current;
      }

      if (activeRef && menuRef.current) {
        const containerRect = menuRef.current.getBoundingClientRect();
        const activeRect = activeRef.getBoundingClientRect();
        const left = activeRect.left - containerRect.left;
        const width = activeRect.width;

        // Only update if metrics changed significantly to avoid loops
        setIndicatorStyle(prev => {
          if (Math.abs(prev.left - left) < 0.5 && Math.abs(prev.width - width) < 0.5 && prev.opacity === 1) {
            return prev;
          }
          return { width, left, opacity: 1 };
        });
      } else {
        setIndicatorStyle(prev => prev.opacity === 0 ? prev : { width: 0, left: 0, opacity: 0 });
      }
    };

    updateIndicator();

    // Robust resize observation
    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });

    if (menuRef.current) {
      resizeObserver.observe(menuRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [pathname, current, t, isTradeFormOpen, user]);

  // Don't show loading in nav - let ProtectedRoute handle it
  // This prevents duplicate loading animations
  // Also hide guest menu during loading to prevent flash of login/register buttons
  if (loading) {
    return (
      <nav className="flex items-center justify-between w-full" role="navigation" aria-label="Main navigation">
        <div className="flex-1"></div>
        <div className="flex-1"></div>
      </nav>
    );
  }

  // Guest menu (Login/Register) faqat auth sahifalarida — asosiy sahifalarda flash oldini olish
  const isAuthPage = current === '/auth/login' || current === '/auth/register' || current.startsWith('/auth/forgot-password') || current.startsWith('/auth/reset-password');
  const showGuestMenu = !user && isAuthPage;

  return (
    <nav className="flex items-center justify-between w-full" role="navigation" aria-label="Main navigation">
      {user ? (
        // Authenticated user menu
        <>
          <div className="flex-1"></div>
          {/* Desktop Menu */}
          <ul ref={menuRef} className="hidden md:flex items-center space-x-4 lg:space-x-8 relative" role="menubar">
            {/* Sliding indicator background - toggle switch style */}
            <div
              className="absolute h-10 bg-[rgba(217,254,67,0.15)] rounded-20 transition-all duration-300 ease-in-out pointer-events-none"
              style={{
                width: `${indicatorStyle.width}px`,
                left: `${indicatorStyle.left}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            <li role="none" className="relative z-10" ref={journalRef}>
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
                  prefetch={true}
                  className={`relative z-10 px-4 py-2 rounded-20 flex items-center gap-2 transition-all duration-300 ${isActive("/")
                    ? "text-[#D9FE43] font-semibold"
                    : `${linkClass} px-3 py-1`
                    }`}
                  role="menuitem"
                  aria-current={isActive("/") ? "page" : undefined}
                >
                  <House size={18} />
                  {t('journal')}
                </Link>
              )}
            </li>
            <li className="relative z-10" ref={calendarRef}>
              {isTradeFormOpen ? (
                <span
                  className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-2 opacity-50 cursor-not-allowed relative z-10`}
                  title="Complete or cancel the trade form first"
                >
                  <CalendarDays size={18} />
                  {t('calendar')}
                </span>
              ) : (
                <Link
                  href="/calendar"
                  prefetch={true}
                  className={`relative z-10 px-4 py-2 rounded-20 flex items-center gap-2 transition-all duration-300 ${isActive("/calendar")
                    ? "text-[#D9FE43] font-semibold"
                    : `${linkClass} px-3 py-1`
                    }`}
                >
                  <CalendarDays size={18} />
                  {t('calendar')}
                </Link>
              )}
            </li>
            <li className="relative z-10" ref={statsRef}>
              {isTradeFormOpen ? (
                <span
                  className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-2 opacity-50 cursor-not-allowed relative z-10`}
                  title="Complete or cancel the trade form first"
                >
                  <PieChart size={18} />
                  {t('stats')}
                </span>
              ) : (
                <Link
                  href="/stats"
                  prefetch={true}
                  className={`relative z-10 px-4 py-2 rounded-20 flex items-center gap-2 transition-all duration-300 ${isActive("/stats")
                    ? "text-[#D9FE43] font-semibold"
                    : `${linkClass} px-3 py-1`
                    }`}
                >
                  <PieChart size={18} />
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-2 bg-[#1C1719] border border-white/10 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${isActive("/") ? "text-[#D9FE43] font-semibold bg-[rgba(217,254,67,0.10)]" : "text-gray-300 hover:bg-white/5"
                    }`}
                >
                  <House size={18} />
                  {t('journal')}
                </Link>
                <Link
                  href="/calendar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${isActive("/calendar") ? "text-[#D9FE43] font-semibold bg-[rgba(217,254,67,0.10)]" : "text-gray-300 hover:bg-white/5"
                    }`}
                >
                  <CalendarDays size={18} />
                  {t('calendar')}
                </Link>
                <Link
                  href="/stats"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${isActive("/stats") ? "text-[#D9FE43] font-semibold bg-[rgba(217,254,67,0.10)]" : "text-gray-300 hover:bg-white/5"
                    }`}
                >
                  <PieChart size={18} />
                  {t('stats')}
                </Link>
                <a
                  href="https://www.investing.com/economic-calendar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Newspaper size={18} />
                  {t('macroNews')}
                </a>
                <div className="border-t border-white/10 my-2"></div>
                <Link
                  href="/profile?tab=settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Settings size={18} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}

          <div className="flex-1"></div>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />
            <div
              className="relative flex items-center isolation-auto"
              onMouseEnter={handleOpen}
              onMouseLeave={handleCloseWithDelay}
            >
              <button
                onClick={handleToggleClick}
                className="flex items-center space-x-2 text-gray-200 hover:text-white px-3 lg:px-4 py-2 rounded-20 bg-[rgba(217,254,67,0.15)] hover:bg-[rgba(217,254,67,0.23)] min-h-[44px]"
                ref={buttonRef}
              >
                <User size={16} />
                <span className="whitespace-nowrap text-sm lg:text-base font-bold">{user.name}</span>
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
          </div>
        </>
      ) : showGuestMenu ? (
        // Guest menu — faqat login/register sahifalarida, logo yonida flash bo‘lmasin
        <ul className="flex space-x-2 sm:space-x-4">
          <li>
            <Link
              href="/auth/login"
              className={`text-xs sm:text-sm ${isActive("/auth/login") ? activeLinkClass : linkClass
                }`}
            >
              Login
            </Link>
          </li>
          <li>
            <Link
              href="/auth/register"
              className={`text-xs sm:text-sm ${isActive("/auth/register")
                ? activeLinkClass
                : "bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded-md"
                }`}
            >
              Register
            </Link>
          </li>
        </ul>
      ) : (
        // Asosiy sahifalarda user yo‘q bo‘lsa bo‘sh nav (Login/Register flash yo‘q)
        <div className="flex-1" />
      )}
    </nav>
  );
} 