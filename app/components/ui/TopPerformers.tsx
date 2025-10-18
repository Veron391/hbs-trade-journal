'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import SectionCard from './SectionCard';
import AvatarBadge from './AvatarBadge';
import { formatCurrency, formatPercent } from '../../../lib/mock';
import { Trophy, TrendingUp } from 'lucide-react';

interface TopPerformersProps {
  data: Array<{
    id: string;
    name?: string;
    fullName?: string;
    username?: string;
    email: string;
    totalTrades?: number;
    tradesCount?: number;
    totalPnL?: number;
    totalPnl?: number;
    winRate: number;
    avgPnL?: number;
    bestTrade?: number;
    worstTrade?: number;
    lastActive?: string;
    joinDate?: string;
  }>;
}

const TopPerformers = memo(({ data }: TopPerformersProps) => {
  const router = useRouter();

  console.log('TopPerformers data:', data);

  const getRankIcon = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
    return <span className="text-neutral-400 text-sm font-medium">#{rank}</span>;
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const handleUserClick = (userId: string) => {
    // Use the full user ID for navigation
    router.push(`/admin/users/${userId}`);
  };

  return (
    <SectionCard
      title="Top Performers"
      icon={TrendingUp}
    >
      <div className="space-y-3">
        {data.map((performer, index) => (
          <div
            key={performer.id}
            onClick={() => handleUserClick(performer.id)}
            className="flex items-center justify-between p-4 hover:bg-blue-900/30 rounded-xl transition-colors border border-transparent cursor-pointer hover:border-blue-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index)}
              </div>
              <AvatarBadge name={performer.name || performer.fullName || performer.username || 'User'} size="sm" />
              <div>
                <p className="text-white font-medium">{performer.name || performer.fullName || performer.username || 'User'}</p>
                <p className="text-neutral-400 text-sm">{performer.email}</p>
                <p className="text-neutral-500 text-xs">{performer.totalTrades || performer.tradesCount || 0} trades</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${getPnLColor(performer.totalPnL || performer.totalPnl || 0)}`}>
                {formatCurrency(performer.totalPnL || performer.totalPnl || 0)}
              </p>
              <p className="text-neutral-400 text-sm">
                {formatPercent(performer.winRate)} win rate
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
});

TopPerformers.displayName = 'TopPerformers';

export default TopPerformers;
