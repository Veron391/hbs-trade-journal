"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Settings, LogOut } from "lucide-react";

export default function NavMenu() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Check if a route is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Active link style
  const activeLinkClass = "text-green-300 font-medium";
  const linkClass = "hover:text-green-400 transition-colors";

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

  return (
    <nav className="flex items-center" role="navigation" aria-label="Main navigation">
      {user ? (
        // Authenticated user menu
        <>
          <ul className="flex items-center space-x-2 mr-60" role="menubar">
            <li role="none">
              <Link
                href="/"
                className={`${isActive("/") ? "text-green-300 bg-[rgba(34,197,94,0.15)] px-4 py-2" : `${linkClass} px-3 py-1`} rounded-20`}
                role="menuitem"
                aria-current={isActive("/") ? "page" : undefined}
              >
                Journal
              </Link>
            </li>
            <li>
              <Link
                href="/calendar"
                className={`${isActive("/calendar") ? "text-green-300 bg-[rgba(34,197,94,0.15)] px-4 py-2" : `${linkClass} px-3 py-1`} rounded-20`}
              >
                Calendar
              </Link>
            </li>
            <li>
              <Link
                href="/stats"
                className={`${isActive("/stats") ? "text-green-300 bg-[rgba(34,197,94,0.15)] px-4 py-2" : `${linkClass} px-3 py-1`} rounded-20`}
              >
                Stats
              </Link>
            </li>
            <li>
              <a
                href="https://www.investing.com/economic-calendar/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} px-3 py-1 rounded-20 flex items-center gap-1`}
              >
                Macro News
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
          
          <div
            className="relative flex items-center isolation-auto"
            onMouseEnter={handleOpen}
            onMouseLeave={handleCloseWithDelay}
          >
            <button
              onClick={handleToggleClick}
              className="flex items-center space-x-1 text-gray-200 hover:text-white px-4 py-2 rounded-20 bg-[rgba(34,197,94,0.15)] hover:bg-[rgba(34,197,94,0.23)]"
              ref={buttonRef}
            >
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