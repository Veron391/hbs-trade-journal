"use client";

import { AdminProvider } from '../context/AdminContext';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { RiskProvider } from '../context/RiskContext';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import { usePathname } from 'next/navigation';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  
  // Don't show sidebar and topbar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-[#111114] text-neutral-200">
      {/* Admin Topbar */}
      <AdminTopbar />

      <div className="flex">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main className={`flex-1 pt-16 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <SidebarProvider>
        <RiskProvider>
          <AdminContent>{children}</AdminContent>
        </RiskProvider>
      </SidebarProvider>
    </AdminProvider>
  );
}