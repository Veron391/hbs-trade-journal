'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SectionCard from './SectionCard';
import AvatarBadge from './AvatarBadge';
import { Users, ExternalLink } from 'lucide-react';

interface RecentUsersProps {
  data: Array<{
    id: string;
    name?: string;
    fullName?: string;
    username?: string;
    email: string;
    joinDate?: string;
    createdAt?: string;
    totalTrades?: number;
    tradesCount?: number;
    totalPnL?: number;
    totalPnl?: number;
    winRate?: number;
    lastActive?: string;
    status?: 'active' | 'inactive';
  }>;
}

const RecentUsers = memo(({ data }: RecentUsersProps) => {
  const router = useRouter();
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleUserClick = (userId: string) => {
    // Extract numeric ID from user ID (e.g., "user_7101" -> "7101")
    const numericId = userId.replace('user_', '');
    // Navigate to users page with recent filter and scroll to the specific user
    router.push(`/admin/users?filter=recent&highlight=${numericId}`);
  };

  const getStatusColor = (user: any) => {
    if (user.status) {
      return user.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400';
    }
    
    const totalTrades = user.totalTrades || user.tradesCount || 0;
    const lastActive = user.lastActive;
    
    if (totalTrades === 0) return 'bg-red-900/30 text-red-400';
    if (!lastActive) return 'bg-red-900/30 text-red-400';
    
    const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActive <= 7) return 'bg-green-900/30 text-green-400';
    if (daysSinceActive <= 30) return 'bg-yellow-900/30 text-yellow-400';
    return 'bg-red-900/30 text-red-400';
  };

  const getStatusText = (user: any) => {
    if (user.status) {
      return user.status;
    }
    
    const totalTrades = user.totalTrades || user.tradesCount || 0;
    const lastActive = user.lastActive;
    
    if (totalTrades === 0) return 'new';
    if (!lastActive) return 'new';
    
    const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActive <= 7) return 'active';
    if (daysSinceActive <= 30) return 'recent';
    return 'inactive';
  };

  return (
    <SectionCard
      title="Recent Users"
      icon={Users}
      action={
        <Link 
          href="/admin/users" 
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      }
    >
      <div className="space-y-3">
        {data.map((user) => (
          <div
            key={user.id}
            onClick={() => handleUserClick(user.id)}
            className="flex items-center justify-between p-4 hover:bg-blue-900/30 rounded-xl transition-colors border border-transparent cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <AvatarBadge name={user.name || user.fullName || user.username || 'User'} size="sm" />
              <div>
                <p className="text-white font-medium">{user.name || user.fullName || user.username || 'User'}</p>
                <p className="text-neutral-400 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-neutral-400 text-sm">{formatDate(user.joinDate || user.createdAt || new Date().toISOString())}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neutral-500 text-xs">
                  {user.totalTrades || user.tradesCount || 0} trades
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                  {getStatusText(user)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
});

RecentUsers.displayName = 'RecentUsers';

export default RecentUsers;
