"use client";

import { AdminProvider, useAdmin } from '../context/AdminContext';
import { RiskProvider } from '../context/RiskContext';
import { SidebarProvider } from '../context/SidebarContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated, isAuthChecking } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  
  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Don't do anything while auth is still being checked
      if (isAuthChecking) {
        return;
      }
      
      console.log('Admin layout - checking auth for pathname:', pathname, 'isAdminAuthenticated:', isAdminAuthenticated);
      
      // Don't redirect if already on login page
      if (pathname.endsWith('/admin/login')) {
        console.log('Admin layout - on login page, not redirecting');
        return;
      }
      
      // If not authenticated and not on login page, redirect to login
      if (!isAdminAuthenticated) {
        console.log('Admin layout - not authenticated, redirecting to login');
        router.push('/admin/login');
        return;
      }
      
      // If authenticated, allow access
      console.log('Admin layout - authenticated, allowing access to:', pathname);
    };
    
    checkAuthAndRedirect();
  }, [isAdminAuthenticated, isAuthChecking, pathname, router]);
  
  // Show loading while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#111114] flex items-center justify-center">
        <div className="text-white text-lg">Checking authentication...</div>
      </div>
    );
  }
  
  // Don't show sidebar and topbar on login page
  if (pathname.endsWith('/admin/login')) {
    return (
      <div className="min-h-screen bg-[#111114] text-neutral-200">
        {children}
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#111114] text-neutral-200">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Topbar */}
        <AdminTopbar />
        
        {/* Main Content Area */}
        <main className="ml-16 lg:ml-64 pt-24">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <RiskProvider>
        <AdminContent>{children}</AdminContent>
      </RiskProvider>
    </AdminProvider>
  );
}