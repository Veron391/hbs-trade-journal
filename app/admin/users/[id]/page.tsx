"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target, Calendar, BarChart3, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { mockData, formatCurrency, formatPercent } from '../../../../lib/mock';
import { useFilters } from '../../../../lib/filters';
import { getUserDetail, getUserTrades, type UserDetailResponse, type UserTradesResponse, type UserTrade } from '../../../../lib/services/admin';
import StatCard from '../../../components/ui/StatCard';
import SectionCard from '../../../components/ui/SectionCard';
import DataTable from '../../../components/ui/DataTable';
import PeriodAndCategoryBar from '../../../components/dashboard/PeriodAndCategoryBar';
import RiskAlerts from '../../../components/admin/RiskAlerts';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { period, category, tradeType, range } = useFilters();
  const [user, setUser] = useState<any>(null);
  const [userTrades, setUserTrades] = useState<any[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUserDetail, setApiUserDetail] = useState<UserDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [apiUserTrades, setApiUserTrades] = useState<UserTradesResponse | null>(null);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [riskSettings, setRiskSettings] = useState({
    assetType: 'stock', // 'stock' or 'crypto'
    capitalAmount: '',
    maxTotalLoss: '',
    maxSingleTradeLoss: ''
  });
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [userRiskAlerts, setUserRiskAlerts] = useState<any[]>([]);

  // Load user detail from API
  useEffect(() => {
    const loadUserDetail = async () => {
      const userId = params.id as string;
      if (!userId) return;

      try {
        setDetailLoading(true);
        console.log('UserDetailPage: Loading user detail for ID:', userId);
        
        const userDetail = await getUserDetail({ 
          userId,
          period, 
          category,
          tradeType: tradeType
        });
        
        console.log('UserDetailPage: Received user detail:', userDetail);
        setApiUserDetail(userDetail);
        
        if (userDetail) {
          // Transform API data to match component format
          const transformedUser = {
            id: userId,
            name: userDetail.user_detail_info.full_name,
            email: userDetail.user_detail_info.email,
            status: userDetail.user_detail_info.status,
            joinedDate: userDetail.user_detail_info.joined_at
          };
          setUser(transformedUser);
        }
      } catch (error) {
        console.error('UserDetailPage: Error loading user detail:', error);
        setApiUserDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };
    
    loadUserDetail();
  }, [params.id, period, category, tradeType]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load user trades from API
  useEffect(() => {
    const loadUserTrades = async () => {
      const userId = params.id as string;
      if (!userId) return;

      try {
        setTradesLoading(true);
        console.log('UserDetailPage: Loading user trades for ID:', userId);
        
        const userTrades = await getUserTrades({ 
          userId,
          period, 
          category,
          tradeType: tradeType,
          search: debouncedSearchQuery || undefined,
          limit: 20,
          offset: 0
        });
        
        console.log('UserDetailPage: Received user trades:', userTrades);
        setApiUserTrades(userTrades);
      } catch (error) {
        console.error('UserDetailPage: Error loading user trades:', error);
        setApiUserTrades(null);
      } finally {
        setTradesLoading(false);
      }
    };
    
    loadUserTrades();
  }, [params.id, period, category, tradeType, debouncedSearchQuery]);

  // Fallback to mock data if API fails
  useEffect(() => {
    if (!apiUserDetail && !detailLoading) {
      const userId = params.id as string;
      const userData = mockData.getDetailedUsers().find(u => u.id === parseInt(userId));
      
      if (userData) {
        setUser(userData);
        // Get user's trades from mock data (simulating real student panel data)
        const mockTrades = mockData.getTradesLog().filter(trade => trade.userId === `user_${userId.padStart(3, '0')}`);
        setUserTrades(mockTrades);
        
        // Generate mock risk alerts for this user
        const mockUserRiskAlerts = [
          {
            id: 1,
            studentName: userData.name,
            message: 'Total loss exceeded maximum limit',
            severity: 'red' as const,
            value: 85.5,
            threshold: 80,
            timestamp: new Date().toISOString(),
            type: 'total_loss'
          },
          {
            id: 2,
            studentName: userData.name,
            message: 'Single trade loss approaching limit',
            severity: 'amber' as const,
            value: 15.2,
            threshold: 20,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'single_trade_loss'
          }
        ];
        setUserRiskAlerts(mockUserRiskAlerts);
      }
      setLoading(false);
    }
  }, [apiUserDetail, detailLoading, params.id]);

  // Update filtered trades when API data changes
  useEffect(() => {
    if (apiUserTrades) {
      // Transform API trades to match the expected format
      const transformedTrades = apiUserTrades.items.map((trade: UserTrade) => ({
        id: trade.id,
        symbol: trade.symbol,
        assetClass: trade.trade_type.toLowerCase(),
        type: trade.direction === 'long' ? 'BUY' : 'SELL',
        entryDate: trade.entry_date,
        exitDate: trade.exit_date,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        quantity: trade.quantity,
        pnl: trade.pnl,
        date: trade.entry_date, // For compatibility with existing logic
        link: trade.trade_link,
        setupNotes: trade.trade_setup_notes,
        mlNotes: trade.ml_notes,
        tags: trade.tags,
        holdTimeDays: trade.hold_time_days
      }));
      
      setFilteredTrades(transformedTrades);
    } else {
      // Fallback to mock data logic
      if (!userTrades.length) return;

      let filtered = userTrades;

      // Apply period filter using the same logic as student panel
      const periodMapping = {
        '1week': { days: 7 },
        '1month': { days: 30 },
        '3months': { days: 90 },
        '6months': { days: 180 },
        '1year': { days: 365 },
        'all': { days: 3650 } // 10 years
      };

      const periodConfig = periodMapping[period as keyof typeof periodMapping] || periodMapping['all'];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodConfig.days);

      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= cutoffDate;
      });

      // Apply category filter
      if (category !== 'total') {
        filtered = filtered.filter(trade => {
          if (category === 'stock') return trade.assetClass === 'stock';
          if (category === 'crypto') return trade.assetClass === 'crypto';
          return true;
        });
      }

      setFilteredTrades(filtered);
    }
  }, [apiUserTrades, userTrades, period, category, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">User not found</div>
      </div>
    );
  }

  const tradeColumns = [
    {
      key: 'symbol',
      label: 'SYMBOL',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-white">{value}</span>
      )
    },
    {
      key: 'assetClass',
      label: 'TYPE',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'crypto' 
            ? 'bg-orange-900/30 text-orange-400' 
            : 'bg-blue-900/30 text-blue-400'
        }`}>
          {value === 'crypto' ? 'Crypto' : 'Stock'}
        </span>
      )
    },
    {
      key: 'type',
      label: 'DIRECTION',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'BUY' 
            ? 'bg-green-200/20 text-green-300' 
            : 'bg-red-200/20 text-red-300'
        }`}>
          {value === 'BUY' ? 'Long' : 'Short'}
        </span>
      )
    },
    {
      key: 'entryDate',
      label: 'ENTRY DATE',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
      })
    },
    {
      key: 'exitDate',
      label: 'EXIT DATE',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
      })
    },
    {
      key: 'entryPrice',
      label: 'ENTRY PRICE',
      sortable: true,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'exitPrice',
      label: 'EXIT PRICE',
      sortable: true,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'quantity',
      label: 'QUANTITY',
      sortable: true,
      render: (value: number) => value.toLocaleString()
    },
    {
      key: 'pnl',
      label: 'P/L',
      sortable: true,
      render: (value: number, row: any) => {
        // Calculate percentage based on entry price
        const percentage = row.entryPrice > 0 ? ((value / (row.entryPrice * row.quantity)) * 100).toFixed(2) : '0.00';
        return (
          <div className="text-right">
            <div className={value >= 0 ? 'text-green-400' : 'text-red-400'}>
              {value >= 0 ? '+' : ''}{formatCurrency(value)}
            </div>
            <div className={`text-xs ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {value >= 0 ? '+' : ''}{percentage}%
            </div>
          </div>
        );
      }
    },
    {
      key: 'link',
      label: 'LINK',
      sortable: false,
      render: (value: string) => (
        value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">↗</span>
            </div>
          </a>
        ) : (
          <span className="text-neutral-500">-</span>
        )
      )
    }
  ];

  const handleRowClick = (row: any) => {
    // Could navigate to individual trade detail if needed
    console.log('Trade clicked:', row);
  };

  // Calculate statistics based on API data or filtered trades
  const calculateStats = () => {
    // If we have API data, use it
    if (apiUserDetail) {
      const profitability = apiUserDetail.stats.profitability;
      const tradeAnalysis = apiUserDetail.stats.trade_analysis;
      
      return {
        totalPnL: profitability.total_profit_loss,
        totalTrades: tradeAnalysis.total_trades,
        winRate: profitability.win_rate,
        bestTrade: profitability.largest_profit,
        worstTrade: profitability.largest_loss,
        avgTrade: profitability.average_profit_loss
      };
    }
    
    // Fallback to mock calculation
    if (!filteredTrades.length) {
      return {
        totalPnL: 0,
        totalTrades: 0,
        winRate: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgTrade: 0
      };
    }

    const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalTrades = filteredTrades.length;
    const winTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
    const bestTrade = Math.max(...filteredTrades.map(t => t.pnl));
    const worstTrade = Math.min(...filteredTrades.map(t => t.pnl));
    const avgTrade = totalTrades > 0 ? totalPnL / totalTrades : 0;

    return {
      totalPnL,
      totalTrades,
      winRate,
      bestTrade,
      worstTrade,
      avgTrade
    };
  };

  const stats = calculateStats();

  // Risk monitoring functions
  const checkRiskLimits = () => {
    if (!riskSettings.capitalAmount || !riskSettings.maxTotalLoss || !riskSettings.maxSingleTradeLoss) {
      return;
    }

    const capitalAmount = parseFloat(riskSettings.capitalAmount);
    const maxTotalLoss = parseFloat(riskSettings.maxTotalLoss);
    const maxSingleTradeLoss = parseFloat(riskSettings.maxSingleTradeLoss);
    
    const currentTotalLoss = Math.abs(Math.min(0, stats.totalPnL));
    const worstSingleLoss = Math.abs(Math.min(0, stats.worstTrade));

    const newAlerts = [];

    // Check total loss limit
    if (currentTotalLoss > maxTotalLoss) {
      newAlerts.push({
        id: Date.now(),
        type: 'total_loss',
        severity: 'high',
        title: 'Total Loss Limit Exceeded',
        message: `${user.name} has exceeded the total loss limit of ${formatCurrency(maxTotalLoss)}. Current total loss: ${formatCurrency(currentTotalLoss)}.`,
        details: {
          limit: maxTotalLoss,
          current: currentTotalLoss,
          excess: currentTotalLoss - maxTotalLoss,
          assetType: riskSettings.assetType,
          capitalAmount: capitalAmount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check single trade loss limit
    if (worstSingleLoss > maxSingleTradeLoss) {
      newAlerts.push({
        id: Date.now() + 1,
        type: 'single_trade_loss',
        severity: 'critical',
        title: 'Single Trade Loss Limit Exceeded',
        message: `${user.name} has a single trade loss of ${formatCurrency(worstSingleLoss)}, exceeding the limit of ${formatCurrency(maxSingleTradeLoss)}.`,
        details: {
          limit: maxSingleTradeLoss,
          current: worstSingleLoss,
          excess: worstSingleLoss - maxSingleTradeLoss,
          assetType: riskSettings.assetType,
          capitalAmount: capitalAmount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check capital depletion (if total loss is more than 50% of capital)
    const lossPercentage = (currentTotalLoss / capitalAmount) * 100;
    if (lossPercentage > 50) {
      newAlerts.push({
        id: Date.now() + 2,
        type: 'capital_depletion',
        severity: 'high',
        title: 'High Capital Depletion',
        message: `${user.name} has lost ${lossPercentage.toFixed(1)}% of their capital (${formatCurrency(currentTotalLoss)} out of ${formatCurrency(capitalAmount)}).`,
        details: {
          capitalAmount: capitalAmount,
          currentLoss: currentTotalLoss,
          lossPercentage: lossPercentage,
          assetType: riskSettings.assetType
        },
        timestamp: new Date().toISOString()
      });
    }

    if (newAlerts.length > 0) {
      setRiskAlerts(prev => [...prev, ...newAlerts]);
    }
  };

  const handleSetRiskSettings = () => {
    if (!riskSettings.capitalAmount || !riskSettings.maxTotalLoss || !riskSettings.maxSingleTradeLoss) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    // Clear previous alerts
    setRiskAlerts([]);
    
    // Check risk limits
    setTimeout(() => {
      checkRiskLimits();
    }, 1000);

    alert('Risk monitoring sozlamalari saqlandi');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <p className="text-neutral-400 mt-1">{user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.status === 'active' 
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                    : 'bg-red-900/30 text-red-400 border border-red-500/30'
                }`}>
                  {user.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-sm">Last Activity:</span>
                <span className="text-white text-sm">
                  {filteredTrades.length > 0 
                    ? new Date(Math.max(...filteredTrades.map(t => new Date(t.date).getTime()))).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'No trades'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <PeriodAndCategoryBar />

      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total P&L"
          value={formatCurrency(stats.totalPnL)}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          trend={stats.totalPnL >= 0 ? 'up' : 'down'}
          change={`${formatPercent(Math.abs(stats.totalPnL) / 1000)}`}
          intent={stats.totalPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Total Trades"
          value={stats.totalTrades.toLocaleString()}
          icon={<BarChart3 className="h-6 w-6 text-white" />}
          trend="up"
          change="+12%"
          intent="blue"
        />
        <StatCard
          title="Win Rate"
          value={formatPercent(stats.winRate)}
          icon={<Target className="h-6 w-6 text-white" />}
          trend={stats.winRate >= 50 ? 'up' : 'down'}
          change={`${stats.winRate >= 50 ? '+' : ''}${(stats.winRate - 50).toFixed(1)}%`}
          intent={stats.winRate >= 50 ? 'green' : 'red'}
        />
        <StatCard
          title="Member Since"
          value={new Date(user.joinedDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          })}
          icon={<Calendar className="h-6 w-6 text-white" />}
          trend="stable"
          intent="blue"
        />
      </div>

      {/* Trade Journal */}
      <SectionCard
        title="Trade Journal"
        icon={TrendingUp}
      >
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search trades by symbol, setup notes, or ML notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Trade Count */}
        <div className="mb-4 text-sm text-neutral-400">
          {apiUserTrades ? `${apiUserTrades.items.length} of ${apiUserTrades.total} trades` : `${filteredTrades.length} trades`}
        </div>

        {/* Data Table */}
        {tradesLoading ? (
          <div className="bg-[#1A1A1F] border border-neutral-700/50 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="text-white text-lg">Loading trades...</div>
            </div>
          </div>
        ) : (
          <DataTable
            data={filteredTrades}
            columns={tradeColumns}
            searchable={false} // We handle search via API
            exportable={true}
            exportFilename={`${user.name.replace(/\s+/g, '_')}_trades`}
            onRowClick={handleRowClick}
            periodInfo={{
              period,
              category,
              range
            }}
            paginated={false} // We handle pagination via API
          />
        )}
      </SectionCard>

      {/* Detailed Statistics */}
      {detailLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1A1A1F] border border-neutral-700/50 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="text-white text-lg">Loading profitability data...</div>
            </div>
          </div>
          <div className="bg-[#1A1A1F] border border-neutral-700/50 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="text-white text-lg">Loading trade analysis data...</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Section */}
        <SectionCard
          title="Profitability"
          icon={DollarSign}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Total Profit/Loss</span>
              <span className={`font-semibold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stats.totalPnL)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Average Profit/Loss</span>
              <span className={`font-semibold ${stats.avgTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stats.avgTrade)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Average Winning Trade</span>
              <span className="text-green-400 font-semibold">
                {apiUserDetail ? formatCurrency(apiUserDetail.stats.profitability.average_winning_trade) : formatCurrency((() => {
                  const winningTrades = filteredTrades.filter(t => t.pnl > 0);
                  return winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
                })())}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Average Losing Trade</span>
              <span className="text-red-400 font-semibold">
                {apiUserDetail ? formatCurrency(apiUserDetail.stats.profitability.average_losing_trade) : formatCurrency((() => {
                  const losingTrades = filteredTrades.filter(t => t.pnl < 0);
                  return losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;
                })())}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Largest Profit</span>
              <span className="text-green-400 font-semibold">
                {formatCurrency(stats.bestTrade)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Largest Loss</span>
              <span className="text-red-400 font-semibold">
                {formatCurrency(stats.worstTrade)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Risk/Reward Ratio</span>
              <span className="text-white font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.profitability.risk_reward_ratio?.toFixed(2) || 'N/A') : (() => {
                  const wins = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
                  const losses = Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
                  return losses > 0 ? (wins / losses).toFixed(2) : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Win Rate</span>
              <span className="text-white font-semibold">
                {formatPercent(stats.winRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Sortino Ratio</span>
              <span className="text-white font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.profitability.sortino_ratio?.toFixed(2) || 'N/A') : (() => {
                  const returns = filteredTrades.map(t => t.pnl);
                  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                  const downsideReturns = returns.filter(r => r < 0);
                  const downsideDev = Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / downsideReturns.length);
                  return downsideDev > 0 ? (avgReturn / downsideDev).toFixed(2) : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Sharpe Ratio</span>
              <span className="text-white font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.profitability.sharpe_ratio?.toFixed(2) || 'N/A') : (() => {
                  const returns = filteredTrades.map(t => t.pnl);
                  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
                  const stdDev = Math.sqrt(variance);
                  return stdDev > 0 ? (avgReturn / stdDev).toFixed(2) : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Avg Risk/Reward Ratio</span>
              <span className="text-white font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.profitability.avg_risk_reward_ratio?.toFixed(2) || 'N/A') : (() => {
                  const riskRewardRatios = filteredTrades.map(t => {
                    const entryValue = t.entryPrice * t.quantity;
                    const exitValue = t.exitPrice * t.quantity;
                    const risk = Math.abs(entryValue - exitValue);
                    const reward = Math.abs(t.pnl);
                    return risk > 0 ? (reward / risk).toFixed(2) : 0;
                  });
                  return riskRewardRatios.length > 0 ? (riskRewardRatios.reduce((a, b) => a + parseFloat(b), 0) / riskRewardRatios.length).toFixed(2) : 'N/A';
                })()}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Trade Analysis Section */}
        <SectionCard
          title="Trade Analysis"
          icon={BarChart3}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Total Trades</span>
              <span className="text-white font-semibold">
                {stats.totalTrades}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Winning Trades</span>
              <span className="text-green-400 font-semibold">
                {apiUserDetail ? apiUserDetail.stats.trade_analysis.winning_trades : filteredTrades.filter(t => t.pnl > 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Losing Trades</span>
              <span className="text-red-400 font-semibold">
                {apiUserDetail ? apiUserDetail.stats.trade_analysis.losing_trades : filteredTrades.filter(t => t.pnl < 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Break Even Trades</span>
              <span className="text-neutral-300 font-semibold">
                {apiUserDetail ? apiUserDetail.stats.trade_analysis.break_even_trades : filteredTrades.filter(t => Math.abs(t.pnl) < 0.01).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Max Consecutive Wins</span>
              <span className="text-green-400 font-semibold">
                {apiUserDetail ? apiUserDetail.stats.trade_analysis.max_consecutive_wins : (() => {
                  let maxWins = 0;
                  let currentWins = 0;
                  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  sortedTrades.forEach(trade => {
                    if (trade.pnl > 0) {
                      currentWins++;
                      maxWins = Math.max(maxWins, currentWins);
                    } else {
                      currentWins = 0;
                    }
                  });
                  return maxWins;
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Max Consecutive Losses</span>
              <span className="text-red-400 font-semibold">
                {apiUserDetail ? apiUserDetail.stats.trade_analysis.max_consecutive_losses : (() => {
                  let maxLosses = 0;
                  let currentLosses = 0;
                  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  sortedTrades.forEach(trade => {
                    if (trade.pnl < 0) {
                      currentLosses++;
                      maxLosses = Math.max(maxLosses, currentLosses);
                    } else {
                      currentLosses = 0;
                    }
                  });
                  return maxLosses;
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Avg Hold Time (All)</span>
              <span className="text-white font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.trade_analysis.avg_hold_time_all || 'N/A') : (() => {
                  const holdTimes = filteredTrades.map(t => {
                    const entry = new Date(t.entryDate);
                    const exit = new Date(t.exitDate);
                    return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
                  });
                  return holdTimes.length > 0 ? `${(holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length).toFixed(1)} days` : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Avg Hold Time (Winners)</span>
              <span className="text-green-400 font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.trade_analysis.avg_hold_time_winners || 'N/A') : (() => {
                  const winningTrades = filteredTrades.filter(t => t.pnl > 0);
                  const holdTimes = winningTrades.map(t => {
                    const entry = new Date(t.entryDate);
                    const exit = new Date(t.exitDate);
                    return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
                  });
                  return holdTimes.length > 0 ? `${(holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length).toFixed(1)} days` : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Avg Hold Time (Losers)</span>
              <span className="text-red-400 font-semibold">
                {apiUserDetail ? (apiUserDetail.stats.trade_analysis.avg_hold_time_losers || 'N/A') : (() => {
                  const losingTrades = filteredTrades.filter(t => t.pnl < 0);
                  const holdTimes = losingTrades.map(t => {
                    const entry = new Date(t.entryDate);
                    const exit = new Date(t.exitDate);
                    return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
                  });
                  return holdTimes.length > 0 ? `${(holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length).toFixed(1)} days` : 'N/A';
                })()}
              </span>
            </div>
          </div>
        </SectionCard>
        </div>
      )}

      {/* Risk Monitoring */}
      <div className="panel bg-[#1A1A1F] border-neutral-700/50 p-8 rounded-2xl">
        {/* Modern Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl shadow-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Risk Monitoring</h2>
            <p className="text-neutral-400 text-sm">Configure and monitor trading risk parameters</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Risk Settings Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Risk Settings</h3>
              <div className="space-y-6">
                {/* Asset Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Asset Type
                  </label>
                  <div className="relative">
                    <select 
                      value={riskSettings.assetType}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, assetType: e.target.value }))}
                      className="w-full px-4 py-3 pl-12 bg-neutral-800/50 border border-blue-500/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 hover:border-blue-500/30 transition-all duration-200 appearance-none"
                    >
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                    </select>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Capital Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Capital Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Enter capital amount"
                      value={riskSettings.capitalAmount}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, capitalAmount: e.target.value }))}
                      className="w-full px-4 py-3 pr-16 bg-neutral-800/50 border border-blue-500/10 rounded-xl text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 hover:border-blue-500/30 transition-all duration-200"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <button className="px-2 py-1 bg-neutral-700 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
                        <span className="font-bold text-sm">$</span>
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setRiskSettings(prev => ({ ...prev, capitalAmount: (parseFloat(prev.capitalAmount || '0') + 1000).toString() }))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded transition-all duration-200"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRiskSettings(prev => ({ ...prev, capitalAmount: Math.max(0, parseFloat(prev.capitalAmount || '0') - 1000).toString() }))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded transition-all duration-200"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Max Total Loss Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Max Total Loss
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Enter maximum total loss"
                      value={riskSettings.maxTotalLoss}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, maxTotalLoss: e.target.value }))}
                      className="w-full px-4 py-3 pr-16 bg-neutral-800/50 border border-blue-500/10 rounded-xl text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 hover:border-blue-500/30 transition-all duration-200"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <button className="px-2 py-1 bg-neutral-700 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
                        <span className="font-bold text-sm">$</span>
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setRiskSettings(prev => ({ ...prev, maxTotalLoss: (parseFloat(prev.maxTotalLoss || '0') + 100).toString() }))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded transition-all duration-200"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRiskSettings(prev => ({ ...prev, maxTotalLoss: Math.max(0, parseFloat(prev.maxTotalLoss || '0') - 100).toString() }))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded transition-all duration-200"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Max Single Trade Loss Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Max Single Trade Loss
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Enter maximum single trade loss"
                      value={riskSettings.maxSingleTradeLoss}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, maxSingleTradeLoss: e.target.value }))}
                      className="w-full px-4 py-3 pr-16 bg-neutral-800/50 border border-blue-500/10 rounded-xl text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 hover:border-blue-500/30 transition-all duration-200"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <button className="px-2 py-1 bg-neutral-700 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
                        <span className="font-bold text-sm">$</span>
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setRiskSettings(prev => ({ ...prev, maxSingleTradeLoss: (parseFloat(prev.maxSingleTradeLoss || '0') + 50).toString() }))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded transition-all duration-200"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRiskSettings(prev => ({ ...prev, maxSingleTradeLoss: Math.max(0, parseFloat(prev.maxSingleTradeLoss || '0') - 50).toString() }))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded transition-all duration-200"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  onClick={handleSetRiskSettings}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-orange-500/25 hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Set Risk Monitoring
                </button>
              </div>
            </div>

            {/* Current Risk Status */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Current Risk Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[#202028] rounded-xl hover:border-blue-500/30 border border-transparent transition-all duration-200">
                  <span className="text-neutral-400">Total Loss</span>
                  <span className={`font-bold font-mono ${stats.totalPnL < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(stats.totalPnL)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#202028] rounded-xl hover:border-blue-500/30 border border-transparent transition-all duration-200">
                  <span className="text-neutral-400">Worst Single Trade Loss</span>
                  <span className="text-red-400 font-bold font-mono">
                    {formatCurrency(stats.worstTrade)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#202028] rounded-xl hover:border-blue-500/30 border border-transparent transition-all duration-200">
                  <span className="text-neutral-400">Asset Type</span>
                  <span className={`font-bold ${
                    riskSettings.assetType === 'crypto' ? 'text-orange-400' : 'text-blue-400'
                  }`}>
                    {riskSettings.assetType === 'crypto' ? 'Crypto' : 'Stock'}
                  </span>
                </div>
                {riskSettings.capitalAmount && (
                  <div className="flex justify-between items-center p-4 bg-[#202028] rounded-xl hover:border-blue-500/30 border border-transparent transition-all duration-200">
                    <span className="text-neutral-400">Capital Amount</span>
                    <span className="text-white font-bold font-mono">
                      {formatCurrency(parseFloat(riskSettings.capitalAmount))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          {riskAlerts.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Risk Alerts</h3>
              <div className="space-y-4">
                {riskAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-6 rounded-xl border-l-4 ${
                      alert.severity === 'critical' 
                        ? 'bg-red-900/20 border-red-500' 
                        : 'bg-orange-900/20 border-orange-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-bold ${
                          alert.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                        }`}>
                          {alert.title}
                        </h4>
                        <p className="text-neutral-300 mt-2">{alert.message}</p>
                        <div className="mt-3 text-sm text-neutral-400 space-y-1">
                          <p>Limit: {formatCurrency(alert.details.limit)}</p>
                          <p>Current: {formatCurrency(alert.details.current)}</p>
                          <p>Excess: {formatCurrency(alert.details.excess)}</p>
                          <p>Asset Type: {alert.details.assetType}</p>
                          <p>Time: {new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setRiskAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        className="text-neutral-400 hover:text-white ml-4 p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Alerts Section */}
      {userRiskAlerts.length > 0 && (
        <div className="mt-6">
          <RiskAlerts alerts={userRiskAlerts} />
        </div>
      )}
    </div>
  );
}