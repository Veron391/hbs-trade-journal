/**
 * Admin dashboard service layer with mock fallback
 * Provides data for admin dashboard with automatic fallback to mock data
 */

import { isMockEnabled, shouldUseMock } from '@/lib/mocks/flag';
import { getBackendRange } from '@/lib/filters';
import { 
  mockAggregates, 
  mockPLSeries, 
  mockTopAssets, 
  mockTopPerformers, 
  mockRecentUsers,
  getSeedFromParams,
  type Aggregates,
  type PLPoint,
  type TopAsset,
  type Performer,
  type RecentUser
} from '@/lib/mocks/dashboard';

// User Management Summary types
export interface UserManagementSummary {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_pnl: number;
  avg_win_rate: number;
}

// User Management Users types
export interface UserManagementUser {
  full_name: string;
  email: string;
  joined_at: string;
  status: 'active' | 'inactive';
  last_active_at: string | null;
  trade_count: number;
  pnl: number;
  win_rate: number;
}

export interface UserManagementUsersResponse {
  filters: {
    trade_type: string | null;
    status: string;
    start_date: string;
    end_date: string;
  };
  total: number;
  items: UserManagementUser[];
}

// User Detail types
export interface UserDetailInfo {
  full_name: string;
  email: string;
  username: string;
  status: 'active' | 'inactive';
  joined_at: string;
}

export interface ProfitabilityStats {
  total_profit_loss: number;
  average_profit_loss: number;
  average_winning_trade: number;
  average_losing_trade: number;
  largest_profit: number;
  largest_loss: number;
  risk_reward_ratio: number | null;
  win_rate: number;
  sortino_ratio: number | null;
  sharpe_ratio: number | null;
  avg_risk_reward_ratio: number | null;
}

export interface TradeAnalysisStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  break_even_trades: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
  avg_hold_time_all: string | null;
  avg_hold_time_winners: string | null;
  avg_hold_time_losers: string | null;
}

export interface UserDetailResponse {
  filters: {
    trade_type: string | null;
    start_date: string;
    end_date: string;
  };
  user_detail_info: UserDetailInfo;
  stats: {
    profitability: ProfitabilityStats;
    trade_analysis: TradeAnalysisStats;
  };
}

// User Trades types
export interface UserTrade {
  id: number;
  symbol: string;
  trade_type: 'STOCK' | 'CRYPTO';
  direction: 'long' | 'short';
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  hold_time_days: number;
  trade_link: string;
  trade_setup_notes: string;
  ml_notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UserTradesResponse {
  filters: {
    user_id: number;
    trade_type: string | null;
    direction: string | null;
    start_date: string;
    end_date: string;
    search: string | null;
  };
  total: number;
  items: UserTrade[];
}

// Real data functions (existing implementations)
async function realGetAdminAggregates(params: any): Promise<Aggregates | null> {
  try {
    // This would call your existing getAdminStats function
    // For now, return null to trigger mock fallback
    return null;
  } catch (error) {
    console.error('Error fetching real admin aggregates:', error);
    return null;
  }
}

async function realGetPLSeries(params: any): Promise<PLPoint[]> {
  try {
    // Build query parameters for the PnL series API
    const queryParams = new URLSearchParams();
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling PnL series API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/pnl-series?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('PnL series API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('PnL series data received:', data);
    
    // Transform the data to match PLPoint format
    return data.series?.map((point: any) => ({
      date: point.date,
      pnl: point.pnl
    })) || [];
    
  } catch (error) {
    console.error('Error fetching real P/L series:', error);
    return [];
  }
}

async function realGetTopAssets(params: any): Promise<TopAsset[]> {
  try {
    // Build query parameters for the Top Assets API
    const queryParams = new URLSearchParams();
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling Top Assets API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/top-assets?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('Top Assets API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Top Assets data received:', data);
    
    // Transform the data to match TopAsset format
    return data.assets?.map((asset: any) => ({
      symbol: asset.symbol,
      trades: asset.count
    })) || [];
    
  } catch (error) {
    console.error('Error fetching real top assets:', error);
    return [];
  }
}

async function realGetTopPerformers(params: any): Promise<Performer[]> {
  try {
    // Build query parameters for the Top Users API
    const queryParams = new URLSearchParams();
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling Top Users API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/top-users?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('Top Users API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Top Users data received:', data);
    
    // Transform the data to match Performer format
    return data.users?.map((user: any, index: number) => ({
      id: user.id || user.user_id || `user_${index + 1}`, // Use actual ID from API if available
      fullName: user.full_name,
      email: user.email,
      totalTrades: user.trade_count,
      totalPnL: user.pnl,
      winRate: user.win_rate
    })) || [];
    
  } catch (error) {
    console.error('Error fetching real top performers:', error);
    return [];
  }
}

async function realGetRecentUsers(params: any): Promise<RecentUser[]> {
  try {
    // Build query parameters for the Recent Users API
    const queryParams = new URLSearchParams();
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling Recent Users API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/recent-users?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('Recent Users API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Recent Users data received:', data);
    
    // Transform the data to match RecentUser format
    return data.users?.map((user: any, index: number) => ({
      id: user.id || user.user_id || `user_${index + 1}`, // Use actual ID from API if available
      fullName: user.full_name,
      email: user.email,
      lastActive: user.last_trade_at,
      totalTrades: user.trade_count,
      status: user.active ? 'active' : 'inactive'
    })) || [];
    
  } catch (error) {
    console.error('Error fetching real recent users:', error);
    return [];
  }
}

async function realGetUserManagementSummary(params: any): Promise<UserManagementSummary | null> {
  try {
    // Build query parameters for the User Management Summary API
    const queryParams = new URLSearchParams();
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add status filter
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling User Management Summary API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/user-management-summary?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('User Management Summary API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('User Management Summary data received:', data);
    
    // Return the summary data directly
    return data.summary || null;
    
  } catch (error) {
    console.error('Error fetching real user management summary:', error);
    return null;
  }
}

async function realGetUserManagementUsers(params: any): Promise<UserManagementUsersResponse | null> {
  try {
    // Build query parameters for the User Management Users API
    const queryParams = new URLSearchParams();
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add status filter
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    // Add search filter
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    // Add pagination
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling User Management Users API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/user-management-users?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('User Management Users API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('User Management Users data received:', data);
    
    // Return the data directly
    return data || null;
    
  } catch (error) {
    console.error('Error fetching real user management users:', error);
    return null;
  }
}

async function realGetUserDetail(params: any): Promise<UserDetailResponse | null> {
  try {
    // Build query parameters for the User Detail API
    const queryParams = new URLSearchParams();
    
    // Add user ID (required)
    if (params.userId) {
      queryParams.append('user_id', params.userId);
    }
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling User Detail API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/user-detail?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('User Detail API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('User Detail data received:', data);
    
    // Return the data directly
    return data || null;
    
  } catch (error) {
    console.error('Error fetching real user detail:', error);
    return null;
  }
}

async function realGetUserTrades(params: any): Promise<UserTradesResponse | null> {
  try {
    // Build query parameters for the User Trades API
    const queryParams = new URLSearchParams();
    
    // Add user ID (required)
    if (params.userId) {
      queryParams.append('user_id', params.userId);
    }
    
    // Add trade type filter
    if (params.tradeType) {
      queryParams.append('trade_type', params.tradeType);
    }
    
    // Add direction filter
    if (params.direction) {
      queryParams.append('direction', params.direction);
    }
    
    // Add search filter
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    // Add pagination
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    
    // Add date range
    if (params.period) {
      const range = getBackendRange(params.period);
      if (range) {
        queryParams.append('range', range);
      }
    }
    
    // Add custom dates if period is custom
    if (params.period === 'custom' && params.customStartDate && params.customEndDate) {
      queryParams.append('start_date', params.customStartDate);
      queryParams.append('end_date', params.customEndDate);
    }
    
    console.log('Calling User Trades API with params:', queryParams.toString());
    const response = await fetch(`/api/admin/user-trades?${queryParams.toString()}`);
    
    if (!response.ok) {
      console.error('User Trades API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('User Trades data received:', data);
    
    // Return the data directly
    return data || null;
    
  } catch (error) {
    console.error('Error fetching real user trades:', error);
    return null;
  }
}

// Public API functions with fallback logic
export async function getAdminAggregates(params: any = {}): Promise<Aggregates> {
  const real = await realGetAdminAggregates(params);
  
  if (shouldUseMock(real)) {
    const seed = getSeedFromParams(params.period, params.category);
    console.log('Using mock aggregates with seed:', seed);
    return mockAggregates(seed);
  }
  
  return real!;
}

export async function getPLSeries(params: any = {}): Promise<PLPoint[]> {
  const real = await realGetPLSeries(params);
  
  if (shouldUseMock(real)) {
    const seed = getSeedFromParams(params.period, params.category);
    console.log('Using mock P/L series with seed:', seed);
    return mockPLSeries(seed);
  }
  
  return real;
}

export async function getTopAssets(params: any = {}): Promise<TopAsset[]> {
  const real = await realGetTopAssets(params);
  
  if (shouldUseMock(real)) {
    const seed = getSeedFromParams(params.period, params.category);
    console.log('Using mock top assets with seed:', seed, 'category:', params.category);
    return mockTopAssets(seed, params.limit || 7, params.category);
  }
  
  return real;
}

export async function getTopPerformers(params: any = {}): Promise<Performer[]> {
  const real = await realGetTopPerformers(params);
  
  if (shouldUseMock(real)) {
    const seed = getSeedFromParams(params.period, params.category);
    console.log('Using mock top performers with seed:', seed);
    return mockTopPerformers(seed, params.limit || 10);
  }
  
  return real;
}

export async function getRecentUsers(params: any = {}): Promise<RecentUser[]> {
  const real = await realGetRecentUsers(params);
  
  if (shouldUseMock(real)) {
    const seed = getSeedFromParams(params.period, params.category);
    console.log('Using mock recent users with seed:', seed);
    return mockRecentUsers(seed, params.limit || 10);
  }
  
  return real;
}

export async function getUserManagementSummary(params: any = {}): Promise<UserManagementSummary | null> {
  const real = await realGetUserManagementSummary(params);
  
  if (shouldUseMock(real)) {
    console.log('Using mock user management summary data');
    // For now, return null to use existing mock logic in the component
    return null;
  }
  
  return real;
}

export async function getUserManagementUsers(params: any = {}): Promise<UserManagementUsersResponse | null> {
  const real = await realGetUserManagementUsers(params);
  
  if (shouldUseMock(real)) {
    console.log('Using mock user management users data');
    // For now, return null to use existing mock logic in the component
    return null;
  }
  
  return real;
}

export async function getUserDetail(params: any = {}): Promise<UserDetailResponse | null> {
  const real = await realGetUserDetail(params);
  
  if (shouldUseMock(real)) {
    console.log('Using mock user detail data');
    // For now, return null to use existing mock logic in the component
    return null;
  }
  
  return real;
}

export async function getUserTrades(params: any = {}): Promise<UserTradesResponse | null> {
  const real = await realGetUserTrades(params);
  
  if (shouldUseMock(real)) {
    console.log('Using mock user trades data');
    // For now, return null to use existing mock logic in the component
    return null;
  }
  
  return real;
}

// Export types for use in other files
export type { Aggregates, PLPoint, TopAsset, Performer, RecentUser, UserManagementSummary, UserManagementUser, UserManagementUsersResponse, UserDetailResponse, UserDetailInfo, ProfitabilityStats, TradeAnalysisStats, UserTrade, UserTradesResponse };
