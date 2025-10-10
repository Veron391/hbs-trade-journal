/**
 * Admin dashboard service layer with mock fallback
 * Provides data for admin dashboard with automatic fallback to mock data
 */

import { isMockEnabled, shouldUseMock } from '@/lib/mocks/flag';
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
    // This would call your existing P/L series function
    // For now, return empty array to trigger mock fallback
    return [];
  } catch (error) {
    console.error('Error fetching real P/L series:', error);
    return [];
  }
}

async function realGetTopAssets(params: any): Promise<TopAsset[]> {
  try {
    // This would call your existing top assets function
    // For now, return empty array to trigger mock fallback
    return [];
  } catch (error) {
    console.error('Error fetching real top assets:', error);
    return [];
  }
}

async function realGetTopPerformers(params: any): Promise<Performer[]> {
  try {
    // This would call your existing top performers function
    // For now, return empty array to trigger mock fallback
    return [];
  } catch (error) {
    console.error('Error fetching real top performers:', error);
    return [];
  }
}

async function realGetRecentUsers(params: any): Promise<RecentUser[]> {
  try {
    // This would call your existing recent users function
    // For now, return empty array to trigger mock fallback
    return [];
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
