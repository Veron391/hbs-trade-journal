"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/admin/FilterBar';
import { mockData, formatCurrency, formatPercent, MOCK_TRADES } from '../../../lib/mock';
import { useFilters } from '../../../lib/filters';
import { Eye, Users, TrendingUp, TrendingDown, UserCheck, UserX, Calendar, DollarSign, Target, BarChart3 } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { period, category, range } = useFilters();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'recent'>('all');
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [highlightUserId, setHighlightUserId] = useState<number | null>(null);
  const [recentUsersCount, setRecentUsersCount] = useState<number>(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Load recent users data once
  useEffect(() => {
    const recentUsersData = mockData.getRecentUsers();
    setRecentUsers(recentUsersData);
  }, []);

  // Calculate recent users count (only inactive users)
  useEffect(() => {
    const inactiveRecentUsers = recentUsers.filter(user => user.status === 'inactive');
    setRecentUsersCount(inactiveRecentUsers.length);
  }, [recentUsers]);

  // Handle URL parameters for filtering and highlighting
  useEffect(() => {
    const filter = searchParams.get('filter');
    const highlight = searchParams.get('highlight');
    
    if (filter === 'recent') {
      setStatusFilter('recent');
    }
    
    if (highlight) {
      const userId = parseInt(highlight);
      if (!isNaN(userId)) {
        setHighlightUserId(userId);
        // Clear highlight after 5 seconds
        setTimeout(() => setHighlightUserId(null), 5000);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const allUsers = mockData.getDetailedUsers();
    
    const filteredUsers = allUsers.map(user => {
      // Get user trades for the selected period and category
      const userTrades = MOCK_TRADES.filter(trade => trade.userId === `user_${user.id.toString().padStart(3, '0')}`);
      const tradesInPeriod = userTrades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= range.start && tradeDate <= range.end;
      });
      
      // Apply category filter
      let tradesInCategory = tradesInPeriod;
      if (category !== 'total') {
        tradesInCategory = tradesInPeriod.filter(trade => {
          if (category === 'stock') return trade.assetClass === 'stock';
          if (category === 'crypto') return trade.assetClass === 'crypto';
          return true;
        });
      }
      
      // Check if user has recent activity (last 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const recentTrades = userTrades.filter(trade => new Date(trade.date) >= twoWeeksAgo);
      const hasRecentActivity = recentTrades.length > 0;
      
      // For new users (26-30), they should always be inactive regardless of trades
      const isNewUser = user.id >= 26;
      const finalStatus = isNewUser ? 'inactive' : (hasRecentActivity ? 'active' : 'inactive');
      
      // Calculate statistics - for new users (inactive), always return 0
      let totalTrades, pnl, winRate;
      if (isNewUser) {
        totalTrades = 0;
        pnl = 0;
        winRate = 0;
      } else {
        totalTrades = tradesInCategory.length;
        pnl = tradesInCategory.reduce((sum, trade) => sum + trade.pnl, 0);
        const winTrades = tradesInCategory.filter(trade => trade.pnl > 0).length;
        winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
      }
      
      return {
        ...user,
        totalTrades,
        pnl: Math.round(pnl * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        status: finalStatus,
        lastActive: hasRecentActivity 
          ? recentTrades[recentTrades.length - 1].date
          : userTrades.length > 0 
            ? userTrades[userTrades.length - 1].date
            : user.lastActive
      };
    }).filter(user => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!user.name.toLowerCase().includes(query) && !user.email.toLowerCase().includes(query)) return false;
      }
      
      // Apply status filter
      if (statusFilter === 'recent') {
        // Check if user is in recent users list
        const isRecentUser = recentUsers.some(recentUser => recentUser.id === user.id);
        if (!isRecentUser) return false;
      } else if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
    
    // Calculate pagination
    const total = filteredUsers.length;
    const totalPagesCount = Math.ceil(total / itemsPerPage);
    
    setTotalUsers(total);
    setTotalPages(totalPagesCount);
    
    // Reset to first page if current page is greater than total pages
    if (currentPage > totalPagesCount) {
      setCurrentPage(1);
    }
    
    // Get paginated users
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    setUsers(paginatedUsers);
  }, [period, category, range, searchQuery, statusFilter, currentPage, itemsPerPage]);

  // Calculate statistics for ALL users, not just current page
  const stats = useMemo(() => {
    // Get all users data (not just current page)
    const allUsers = mockData.getDetailedUsers();
    
    const processedUsers = allUsers.map(user => {
      // Get user trades for the selected period and category
      const userTrades = MOCK_TRADES.filter(trade => trade.userId === `user_${user.id.toString().padStart(3, '0')}`);
      const tradesInPeriod = userTrades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= range.start && tradeDate <= range.end;
      });
      
      // Apply category filter
      let tradesInCategory = tradesInPeriod;
      if (category !== 'total') {
        tradesInCategory = tradesInPeriod.filter(trade => {
          if (category === 'stock') return trade.assetClass === 'stock';
          if (category === 'crypto') return trade.assetClass === 'crypto';
          return true;
        });
      }
      
      // Check if user has recent activity (last 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const recentTrades = userTrades.filter(trade => new Date(trade.date) >= twoWeeksAgo);
      const hasRecentActivity = recentTrades.length > 0;
      
      // For new users (26-30), they should always be inactive regardless of trades
      const isNewUser = user.id >= 26;
      const finalStatus = isNewUser ? 'inactive' : (hasRecentActivity ? 'active' : 'inactive');
      
      // Calculate statistics - for new users (inactive), always return 0
      let totalTrades, pnl, winRate;
      if (isNewUser) {
        totalTrades = 0;
        pnl = 0;
        winRate = 0;
      } else {
        totalTrades = tradesInCategory.length;
        pnl = tradesInCategory.reduce((sum, trade) => sum + trade.pnl, 0);
        const winTrades = tradesInCategory.filter(trade => trade.pnl > 0).length;
        winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
      }
      
      return {
        ...user,
        totalTrades,
        pnl: Math.round(pnl * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        status: finalStatus,
        lastActive: hasRecentActivity 
          ? recentTrades[recentTrades.length - 1].date
          : userTrades.length > 0 
            ? userTrades[userTrades.length - 1].date
            : user.lastActive
      };
    });
    
    const totalUsers = processedUsers.length;
    const activeUsers = processedUsers.filter(u => u.status === 'active').length;
    const inactiveUsers = processedUsers.filter(u => u.status === 'inactive').length;
    
    // Only calculate P&L and win rate for active users
    const activeUsersList = processedUsers.filter(u => u.status === 'active');
    const totalPnL = activeUsersList.reduce((sum, user) => sum + user.pnl, 0);
    const avgWinRate = activeUsersList.length > 0 
      ? activeUsersList.reduce((sum, user) => sum + user.winRate, 0) / activeUsersList.length 
      : 0;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalPnL,
      avgWinRate
    };
  }, [period, category, range]);

  const columns = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      align: 'left' as const,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {value.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-white">{value}</div>
            <div className="text-sm text-neutral-400">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            value === 'active' 
              ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
              : 'bg-red-900/30 text-red-400 border border-red-500/30'
          }`}>
            {value === 'active' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
            {value}
          </span>
          <span className="text-xs text-neutral-500">
            Last active: {new Date(row.lastActive).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'totalTrades',
      label: 'Trades',
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-white">{value.toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'pnl',
      label: 'P&L',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          {value >= 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
          <span className={`font-semibold ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(value)}
          </span>
        </div>
      )
    },
    {
      key: 'winRate',
      label: 'Win Rate',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-400" />
          <span className={`font-semibold ${value >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(value)}
          </span>
        </div>
      )
    },
    {
      key: 'joinedDate',
      label: 'Joined',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <span className="text-neutral-200">
            {new Date(value).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: any, row: any) => (
        <button
          onClick={() => router.push(`/admin/users/${row.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      )
    }
  ];

  const handleRowClick = (row: any) => {
    router.push(`/admin/users/${row.id}`);
  };

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, period, category]);


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-neutral-400 mt-1">Monitor and manage all students and their trading performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-400">
            {totalUsers} users found • Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Statistics Cards - Same format as Admin Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="panel bg-[#1A1A1F] border-neutral-700/50 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
          </div>
          <h3 className="text-sm font-medium text-neutral-400">Total Users</h3>
          <p className="text-xs text-neutral-500 mt-1">All registered users</p>
        </div>

        <div className="panel bg-[#1A1A1F] border-neutral-700/50 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-500/50 transition-all duration-300 hover:shadow-xl">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.activeUsers}</span>
          </div>
          <h3 className="text-sm font-medium text-neutral-400">Active Users</h3>
          <p className="text-xs text-neutral-500 mt-1">Users with recent activity</p>
        </div>

        <div className="panel bg-[#1A1A1F] border-neutral-700/50 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-500/20 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-500/50 transition-all duration-300 hover:shadow-xl">
              <UserX className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.inactiveUsers}</span>
          </div>
          <h3 className="text-sm font-medium text-neutral-400">Inactive Users</h3>
          <p className="text-xs text-neutral-500 mt-1">No recent activity</p>
        </div>

        <div className="panel bg-[#1A1A1F] border-neutral-700/50 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/50 transition-all duration-300 hover:shadow-xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(stats.totalPnL)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-neutral-400">Total P&L</h3>
          <p className="text-xs text-neutral-500 mt-1">All active users combined</p>
        </div>

        <div className="panel bg-[#1A1A1F] border-neutral-700/50 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-xl shadow-lg shadow-orange-500/50 transition-all duration-300 hover:shadow-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{formatPercent(stats.avgWinRate)}</span>
          </div>
          <h3 className="text-sm font-medium text-neutral-400">Avg Win Rate</h3>
          <p className="text-xs text-neutral-500 mt-1">Average across active users</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onStatusChange={(status) => setStatusFilter(status as 'all' | 'active' | 'inactive' | 'recent')}
        statusFilter={statusFilter}
        recentUsersCount={recentUsersCount}
      />


      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        searchable={false}
        exportable={true}
        exportFilename="users"
        onRowClick={handleRowClick}
        highlightRowId={highlightUserId}
        periodInfo={{
          period,
          category,
          range
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#1A1A1F] border border-neutral-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-md hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-400 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-md hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}