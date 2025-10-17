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
      id: `user_${index + 1}`, // Generate ID since API doesn't provide one
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
      id: `user_${index + 1}`, // Generate ID since API doesn't provide one
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

// Export types for use in other files
export type { Aggregates, PLPoint, TopAsset, Performer, RecentUser };
