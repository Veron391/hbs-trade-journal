/**
 * Mock data generators for admin dashboard
 * Provides deterministic data based on seed (period + category)
 */

// Types matching real API responses
export interface Aggregates {
  totalUsers: number;
  activeUsersMTD: number;
  totalTradesMTD: number;
  totalPLMTD: number;
  avgWinRateMTD: number;
}

export interface PLPoint {
  date: string; // ISO UTC
  value: number; // cumulative P/L
}

export interface TopAsset {
  symbol: string;
  trades: number;
}

export interface Performer {
  id: string;
  fullName?: string;
  username?: string;
  email: string;
  tradesCount: number;
  totalPnl: number;
  winRate: number; // 0..1
}

export interface RecentUser {
  id: string;
  fullName?: string;
  username?: string;
  email: string;
  createdAt: string; // ISO UTC
  status: 'active' | 'inactive';
}

// Symbol palette
const SYMBOLS = ['ETH', 'AAPL', 'SOL', 'TSLA', 'MSFT', 'GOOGL', 'BNB'];

// Deterministic RNG based on seed
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// Generate seed from period and category
const generateSeed = (period: string = 'this-month', category: string = 'total'): string => {
  return `${period}|${category}`;
};

// Mock aggregates data
export function mockAggregates(seed: string): Aggregates {
  const rng = new SeededRandom(seed);
  
  return {
    totalUsers: rng.nextInt(15, 45),
    activeUsersMTD: rng.nextInt(8, 25),
    totalTradesMTD: rng.nextInt(45, 180),
    totalPLMTD: rng.nextFloat(1200, 8500),
    avgWinRateMTD: rng.nextFloat(0.45, 0.85)
  };
}

// Mock P/L series data
export function mockPLSeries(seed: string): PLPoint[] {
  const rng = new SeededRandom(seed);
  const points: PLPoint[] = [];
  
  // Generate 30 days of data
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let cumulativePL = 0;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Daily P/L change (-200 to +500)
    const dailyChange = rng.nextFloat(-200, 500);
    cumulativePL += dailyChange;
    
    points.push({
      date: date.toISOString(),
      value: Math.round(cumulativePL * 100) / 100
    });
  }
  
  return points;
}

// Mock top assets data
export function mockTopAssets(seed: string, limit: number = 7, category: string = 'total'): TopAsset[] {
  const rng = new SeededRandom(seed);
  const assets: TopAsset[] = [];
  
  // Define symbols by category
  let symbols: string[] = [];
  if (category === 'stock') {
    symbols = ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'NVDA', 'AMZN', 'META'];
  } else if (category === 'crypto') {
    symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA'];
  } else {
    // Total - mix of both
    symbols = [...SYMBOLS];
  }
  
  // Shuffle symbols deterministically
  const shuffledSymbols = [...symbols].sort(() => rng.next() - 0.5);
  
  for (let i = 0; i < Math.min(limit, shuffledSymbols.length); i++) {
    assets.push({
      symbol: shuffledSymbols[i],
      trades: rng.nextInt(5, 35)
    });
  }
  
  // Sort by trade count (highest first)
  return assets.sort((a, b) => b.trades - a.trades);
}

// Mock top performers data
export function mockTopPerformers(seed: string, limit: number = 10): Performer[] {
  const rng = new SeededRandom(seed);
  const performers: Performer[] = [];
  
  const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Blake', 'Sage'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  for (let i = 0; i < limit; i++) {
    const firstName = rng.choice(firstNames);
    const lastName = rng.choice(lastNames);
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
    const email = `${username}@example.com`;
    
    const tradesCount = rng.nextInt(1, 8);
    const totalPnl = rng.nextFloat(45, 1200);
    const winRate = rng.nextFloat(0.45, 0.85);
    
    performers.push({
      id: `user_${rng.nextInt(1000, 9999)}`,
      fullName: `${firstName} ${lastName}`,
      username,
      email,
      tradesCount,
      totalPnl: Math.round(totalPnl * 100) / 100,
      winRate: Math.round(winRate * 100) / 100
    });
  }
  
  // Sort by total PnL (highest first)
  return performers.sort((a, b) => b.totalPnl - a.totalPnl);
}

// Mock recent users data
export function mockRecentUsers(seed: string, limit: number = 10): RecentUser[] {
  const rng = new SeededRandom(seed);
  const users: RecentUser[] = [];
  
  const firstNames = ['Sam', 'Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Blake'];
  const lastNames = ['Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'];
  
  for (let i = 0; i < limit; i++) {
    const firstName = rng.choice(firstNames);
    const lastName = rng.choice(lastNames);
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
    const email = `${username}@example.com`;
    
    // Random date within last 90 days
    const daysAgo = rng.nextInt(1, 90);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    // Status based on whether user has trades (more realistic)
    // 70% chance of having trades (active), 30% chance of no trades (inactive)
    const hasTrades = rng.next() > 0.3;
    const status = hasTrades ? 'active' : 'inactive';
    
    // Generate trades count for active users
    const tradesCount = hasTrades ? rng.nextInt(1, 15) : 0;
    
    users.push({
      id: `user_${rng.nextInt(1000, 9999)}`,
      fullName: `${firstName} ${lastName}`,
      username,
      email,
      createdAt: createdAt.toISOString(),
      status: status as 'active' | 'inactive',
      totalTrades: tradesCount,
      tradesCount: tradesCount
    });
  }
  
  // Sort by creation date (newest first)
  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Helper function to generate seed from params
export function getSeedFromParams(period?: string, category?: string): string {
  return generateSeed(period || 'this-month', category || 'total');
}
