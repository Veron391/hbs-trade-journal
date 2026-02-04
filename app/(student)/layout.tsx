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
        style={{ backgroundColor: 'rgba(23, 23, 23, 0.70)' }}
      >
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <img
              src="/saraf-logo.png"
              alt="Saraf"
              className="h-6 sm:h-8 w-auto"
            />
          </Link>
          <NavMenu />
        </div>
      </header>
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8" style={{ backgroundColor: '#090909' }}>
        {children}
      </main>
    </>
  );
}
