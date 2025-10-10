"use client";

import { useState, useEffect } from 'react';
import StatCard from '../../components/ui/StatCard';
import PLLineCard from '@/app/components/dashboard/PLLineCard';
import TopAssetsDonutCard from '../../components/dashboard/TopAssetsDonutCard';
import TopPerformers from '../../components/ui/TopPerformers';
import RecentUsers from '../../components/ui/RecentUsers';
import PeriodAndCategoryBar from '../../components/dashboard/PeriodAndCategoryBar';
import { formatCurrency, formatPercent, formatCompactNumber } from '../../../lib/mock';
import { useFilters } from '../../../lib/filters';
import { getAdminStats, UserStats } from '../../../lib/services/userStats';
import { getAdminAggregates, getTopPerformers, getRecentUsers, type Aggregates, type Performer, type RecentUser } from '../../../lib/services/admin';
import { 
  Users, 
  DollarSign, 
  Activity,
  UserCheck,
  Target
} from 'lucide-react';
import UILock from '../../components/ui/UILock';

export default function AdminDashboard() {
  const { period, category, range } = useFilters();
  
  // Real user data
  const [adminStats, setAdminStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<UserStats[]>([]);
  const [topPerformers, setTopPerformers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New API data
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [apiTopPerformers, setApiTopPerformers] = useState<Performer[]>([]);
  const [apiRecentUsers, setApiRecentUsers] = useState<RecentUser[]>([]);

  // Load admin data from new API endpoints
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        console.log('Loading admin data...');
        
        // Load data from new API endpoints
        const [aggregatesData, topPerformersData, recentUsersData] = await Promise.all([
          getAdminAggregates({ period, category }),
          getTopPerformers({ period, category, limit: 10 }),
          getRecentUsers({ period, category, limit: 10 })
        ]);
        
        console.log('Aggregates loaded:', aggregatesData);
        console.log('Top performers loaded:', topPerformersData);
        console.log('Recent users loaded:', recentUsersData);
        
        setAggregates(aggregatesData);
        setApiTopPerformers(topPerformersData);
        setApiRecentUsers(recentUsersData);
        
        // Also load legacy data for backward compatibility
        const registeredUsers = localStorage.getItem('registeredUsers');
        const trades = localStorage.getItem('trades');
        console.log('Registered users:', registeredUsers ? JSON.parse(registeredUsers) : 'None');
        console.log('Trades:', trades ? JSON.parse(trades) : 'None');
        
        const stats = await getAdminStats();
        console.log('Legacy admin stats loaded:', stats);
        
        setAdminStats(stats);
        setRecentUsers(stats.recentUsers);
        setTopPerformers(stats.topPerformers);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [period, category]);

  // Refresh data when period/category changes
  useEffect(() => {
    if (adminStats) {
      // For now, we'll use the same data but in a real app, you'd filter by period
      setRecentUsers(adminStats.recentUsers);
      setTopPerformers(adminStats.topPerformers);
    }
  }, [period, category, range, adminStats]);

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

  // Get data from new API or fallback to legacy
  const totalUsersCount = aggregates?.totalUsers || adminStats?.totalUsers || 0;

  // KPI Cards data - using new API data with fallback
  const kpiCards = [
    {
      title: 'Total Users',
      value: formatCompactNumber(aggregates?.totalUsers || adminStats?.totalUsers || 0),
      sublabel: 'Registered users',
      change: '+2.5%',
      trend: 'up' as const,
      icon: <Users className="h-6 w-6 text-white" />,
      intent: 'blue' as const
    },
    {
      title: `Active Users (${periodLabels.shortLabel})`,
      value: formatCompactNumber(aggregates?.activeUsersMTD || adminStats?.activeUsers || 0),
      sublabel: periodLabels.sublabel,
      change: '+14.7%',
      trend: 'up' as const,
      icon: <UserCheck className="h-6 w-6 text-white" />,
      intent: 'green' as const
    },
    {
      title: `Total Trades (${periodLabels.shortLabel})`,
      value: formatCompactNumber(aggregates?.totalTradesMTD || adminStats?.totalTrades || 0),
      sublabel: periodLabels.sublabel,
      change: '+1.1%',
      trend: 'up' as const,
      icon: <Activity className="h-6 w-6 text-white" />,
      intent: 'purple' as const
    },
    {
      title: `Total P&L (${periodLabels.shortLabel})`,
      value: formatCurrency(aggregates?.totalPLMTD || adminStats?.totalPnL || 0),
      sublabel: periodLabels.sublabel,
      change: (aggregates?.totalPLMTD || adminStats?.totalPnL || 0) >= 0 ? '+12.4%' : '-12.4%',
      trend: (aggregates?.totalPLMTD || adminStats?.totalPnL || 0) >= 0 ? 'up' as const : 'down' as const,
      icon: <DollarSign className="h-6 w-6 text-white" />,
      intent: (aggregates?.totalPLMTD || adminStats?.totalPnL || 0) >= 0 ? 'green' as const : 'red' as const
    },
    {
      title: `Avg Win Rate (${periodLabels.shortLabel})`,
      value: formatPercent(aggregates?.avgWinRateMTD || adminStats?.avgWinRate || 0),
      sublabel: periodLabels.sublabel,
      change: '+9.8%',
      trend: 'up' as const,
      icon: <Target className="h-6 w-6 text-white" />,
      intent: 'orange' as const
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <UILock isAdmin={true} />
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UI Lock Component */}
      <UILock isAdmin={true} />
      
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
        <TopPerformers data={apiTopPerformers.length > 0 ? apiTopPerformers : topPerformers} />
        <RecentUsers data={apiRecentUsers.length > 0 ? apiRecentUsers : recentUsers} />
      </div>

    </div>
  );
}