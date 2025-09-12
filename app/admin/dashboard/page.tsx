"use client";

import { useState, useEffect } from 'react';
import StatCard from '../../components/ui/StatCard';
import PLLineCard from '../../components/dashboard/PLLineCard';
import TopAssetsDonutCard from '../../components/dashboard/TopAssetsDonutCard';
import TopPerformers from '../../components/ui/TopPerformers';
import RecentUsers from '../../components/ui/RecentUsers';
import PeriodAndCategoryBar from '../../components/dashboard/PeriodAndCategoryBar';
import { mockData, formatCurrency, formatPercent, formatCompactNumber } from '../../../lib/mock';
import { useFilters } from '../../../lib/filters';
import { 
  useTotals, 
  useWinRate,
  useActiveTotals,
  useActiveWinRate
} from '../../../lib/dataService';
import { 
  Users, 
  DollarSign, 
  Activity,
  UserCheck,
  Target
} from 'lucide-react';

export default function AdminDashboard() {
  const { period, category, range } = useFilters();
  
  // Use new data service hooks
  const totals = useTotals();
  const winRate = useWinRate();
  const activeTotals = useActiveTotals();
  const activeWinRate = useActiveWinRate();
  
  // Keep some legacy data for components that haven't been updated yet
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    // Load legacy data that hasn't been migrated to new service yet
    const users = mockData.getRecentUsersFiltered(period, category, range);
    const performers = mockData.getTopPerformersFiltered(period, category, range);
    
    setRecentUsers(users);
    setTopPerformers(performers);
  }, [period, category, range]);

  // Helper function to get period labels
  const getPeriodLabels = (period: string) => {
    switch (period) {
      case 'thisMonth':
        return {
          title: 'This Month',
          sublabel: 'Current month',
          shortLabel: 'MTD'
        };
      case 'oneWeek':
        return {
          title: '1 Week',
          sublabel: 'Last 7 days',
          shortLabel: '7d'
        };
      case 'lastMonth':
        return {
          title: 'Last Month',
          sublabel: 'Previous month',
          shortLabel: 'LMT'
        };
      case 'last90Days':
        return {
          title: '90 Days',
          sublabel: 'Last 90 days',
          shortLabel: '90d'
        };
      case 'yearToDate':
        return {
          title: 'Year to Date',
          sublabel: 'Since Jan 1st',
          shortLabel: 'YTD'
        };
      case 'allStats':
        return {
          title: 'All Stats',
          sublabel: 'All time',
          shortLabel: 'ALL'
        };
      default:
        return {
          title: 'This Month',
          sublabel: 'Current month',
          shortLabel: 'MTD'
        };
    }
  };

  const periodLabels = getPeriodLabels(period);

  // Get real user count
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  
  useEffect(() => {
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        const users = JSON.parse(registeredUsers);
        setTotalUsersCount(users.length);
      }
    } catch (error) {
      console.error('Error getting total users count:', error);
    }
  }, []);

  // KPI Cards data - using real data
  const kpiCards = [
    {
      title: 'Total Users',
      value: formatCompactNumber(totalUsersCount),
      sublabel: 'Registered users',
      change: '+2.5%',
      trend: 'up' as const,
      icon: <Users className="h-6 w-6 text-white" />,
      intent: 'blue' as const
    },
    {
      title: `Active Users (${periodLabels.shortLabel})`,
      value: formatCompactNumber(activeTotals.activeUsersCount),
      sublabel: periodLabels.sublabel,
      change: '+14.7%',
      trend: 'up' as const,
      icon: <UserCheck className="h-6 w-6 text-white" />,
      intent: 'green' as const
    },
    {
      title: `Total Trades (${periodLabels.shortLabel})`,
      value: formatCompactNumber(activeTotals.tradesCount),
      sublabel: periodLabels.sublabel,
      change: '+1.1%',
      trend: 'up' as const,
      icon: <Activity className="h-6 w-6 text-white" />,
      intent: 'purple' as const
    },
    {
      title: `Total P&L (${periodLabels.shortLabel})`,
      value: formatCurrency(activeTotals.totalPL),
      sublabel: periodLabels.sublabel,
      change: activeTotals.totalPL >= 0 ? '+12.4%' : '-12.4%',
      trend: activeTotals.totalPL >= 0 ? 'up' as const : 'down' as const,
      icon: <DollarSign className="h-6 w-6 text-white" />,
      intent: activeTotals.totalPL >= 0 ? 'green' as const : 'red' as const
    },
    {
      title: `Avg Win Rate (${periodLabels.shortLabel})`,
      value: formatPercent(activeWinRate),
      sublabel: periodLabels.sublabel,
      change: '+9.8%',
      trend: 'up' as const,
      icon: <Target className="h-6 w-6 text-white" />,
      intent: 'orange' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-neutral-400 mt-1">Overview of trading journal platform</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {kpiCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            sublabel={card.sublabel}
            change={card.change}
            trend={card.trend}
            icon={card.icon}
            intent={card.intent}
          />
        ))}
      </div>

      {/* Period and Category Bar */}
      <PeriodAndCategoryBar />

      {/* Main Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <PLLineCard />
        <TopAssetsDonutCard />
      </div>

      {/* Top Performers and Recent Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPerformers data={topPerformers} />
        <RecentUsers data={recentUsers} />
      </div>

    </div>
  );
}