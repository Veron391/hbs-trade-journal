"use client";

import Link from "next/link";
import NavMenu from "../components/layout/NavMenu";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header
        className="text-white shadow-md sticky top-0 z-50 backdrop-blur-2xl border-b border-white/5"
        style={{ backgroundColor: 'rgba(20, 16, 17, 0.70)' }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <img
              src="https://online.hbsakademiya.uz/images/svg/logo.svg"
              alt="HBS Academy"
              className="h-8 w-auto logo-partial-white"
            />
          </Link>
          <NavMenu />
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8" style={{ backgroundColor: '#110D0F' }}>
        {children}
      </main>
    </>
  );
}
