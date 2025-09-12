"use client";

import { usePathname } from 'next/navigation';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer for admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  return (
    <footer 
      className="text-white shadow-md backdrop-blur-2xl border-t border-white/5"
      style={{ backgroundColor: 'rgba(20, 16, 17, 0.70)' }}
      role="contentinfo"
      aria-label="Footer"
    >
      <div className="container mx-auto px-4 py-4 text-center">
        <p className="text-xl font-bold">HBS treyder jurnali</p>
      </div>
    </footer>
  );
}