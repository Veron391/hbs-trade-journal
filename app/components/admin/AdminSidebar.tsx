"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Settings,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useRisk } from '../../context/RiskContext';

interface AdminSidebarProps {}

export default function AdminSidebar({}: AdminSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { isAllRead } = useRisk();
  
  // Mock risk alerts count - in real app this would come from context/API
  const riskAlertsCount = (pathname.startsWith('/admin/risk') || isAllRead) ? 0 : 4; // Hide badge when on risk page or all read

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: BarChart3,
      current: pathname === '/admin/dashboard' || pathname === '/admin'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Risk',
      href: '/admin/risk',
      icon: AlertTriangle,
      current: pathname.startsWith('/admin/risk')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname.startsWith('/admin/settings')
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-[#1A1A1F] z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full border-r border-neutral-700/50 relative">
          {/* Top Bar Spacer */}
          <div className="h-24"></div>

          {/* Collapse Button - Positioned in middle of sidebar outline */}
          <div className="absolute right-0 top-1/3 transform translate-x-1/2 -translate-y-1/2 z-50">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-8 h-8 bg-[#1A1A1F] border-2 border-blue-400/60 rounded-lg text-blue-300 hover:text-blue-200 hover:border-blue-400 transition-all duration-200 shadow-lg"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'} rounded-xl transition-colors ${
                    item.current
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-blue-900/20'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.name === 'Risk' && riskAlertsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center font-bold text-[10px]">
                        {riskAlertsCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-neutral-700/50">
              <div className="text-xs text-neutral-500">
                <p>Admin Panel v1.0</p>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
