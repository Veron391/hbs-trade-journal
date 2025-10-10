import { Trade } from '../api/trades';

export interface UserStats {
  id: string;
  name: string;
  email: string;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgPnL: number;
  bestTrade: number;
  worstTrade: number;
  lastActive: string;
  joinDate: string;
  status?: 'active' | 'inactive';
  trades: Trade[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTrades: number;
  totalPnL: number;
  avgWinRate: number;
  topPerformers: UserStats[];
  recentUsers: UserStats[];
}

// Get all registered users from localStorage
export function getAllRegisteredUsers(): any[] {
  try {
    const users = localStorage.getItem('registeredUsers');
    const parsedUsers = users ? JSON.parse(users) : [];
    console.log('Registered users found:', parsedUsers.length);
    return parsedUsers;
  } catch (error) {
    console.error('Error getting registered users:', error);
    return [];
  }
}

// Get all trades from localStorage (user trades)
export async function getAllTrades(): Promise<Trade[]> {
  try {
    // First try to get from localStorage (user trades)
    const localTrades = localStorage.getItem('trades');
    if (localTrades) {
      const parsedTrades = JSON.parse(localTrades);
      console.log('Local trades found:', parsedTrades.length);
      console.log('Sample trade:', parsedTrades[0]);
      return parsedTrades;
    }

    // Also try to get from individual user keys
    const registeredUsers = localStorage.getItem('registeredUsers');
    if (registeredUsers) {
      const users = JSON.parse(registeredUsers);
      let allTrades: any[] = [];
      
      users.forEach((user: any) => {
        const userTradesKey = `trades_${user.id}`;
        const userTrades = localStorage.getItem(userTradesKey);
        if (userTrades) {
          const parsedTrades = JSON.parse(userTrades);
          allTrades = allTrades.concat(parsedTrades);
          console.log(`User ${user.name} trades found:`, parsedTrades.length);
        }
      });
      
      if (allTrades.length > 0) {
        console.log('Total user trades found:', allTrades.length);
        return allTrades;
      }
    }

    // Fallback to API
    const response = await fetch('/api/trades');
    if (!response.ok) {
      throw new Error('Failed to fetch trades');
    }
    const trades = await response.json();
    console.log('API trades found:', trades.length);
    return trades;
  } catch (error) {
    console.error('Error fetching trades:', error);
    return [];
  }
}

// Calculate user statistics from trades
export function calculateUserStats(userId: string, trades: any[]): Partial<UserStats> {
  // Filter trades for this user - handle both API format and localStorage format
  const userTrades = trades.filter(trade => {
    // Check if it's localStorage format (has userId field) or API format
    // Also check if trade belongs to current user (no userId field means current user)
    return trade.userId === userId || 
           trade.id?.includes(userId) || 
           !trade.userId; // If no userId, assume it's current user's trade
  });
  
  console.log(`User ${userId} trades found:`, userTrades.length);
  console.log(`Sample user trade:`, userTrades[0]);
  
  if (userTrades.length === 0) {
    return {
      totalTrades: 0,
      totalPnL: 0,
      winRate: 0,
      avgPnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      lastActive: new Date().toISOString(),
    };
  }

  // Calculate PnL for each trade
  const tradesWithPnL = userTrades.map(trade => {
    let pnl = 0;
    
    // If trade has pnl field (API format)
    if (trade.pnl !== null && trade.pnl !== undefined) {
      pnl = trade.pnl;
    } else {
      // Calculate PnL from entry/exit prices (localStorage format)
      const entryPrice = parseFloat(trade.entryPrice) || 0;
      const exitPrice = parseFloat(trade.exitPrice) || 0;
      const quantity = parseFloat(trade.quantity) || 0;
      
      if (trade.direction === 'long') {
        pnl = (exitPrice - entryPrice) * quantity;
      } else {
        pnl = (entryPrice - exitPrice) * quantity;
      }
    }
    
    return {
      ...trade,
      calculatedPnL: pnl
    };
  });

  const totalPnL = tradesWithPnL.reduce((sum, trade) => sum + trade.calculatedPnL, 0);
  const winningTrades = tradesWithPnL.filter(trade => trade.calculatedPnL > 0);
  const winRate = tradesWithPnL.length > 0 ? (winningTrades.length / tradesWithPnL.length) * 100 : 0;
  const avgPnL = tradesWithPnL.length > 0 ? totalPnL / tradesWithPnL.length : 0;
  
  const pnlValues = tradesWithPnL.map(trade => trade.calculatedPnL);
  const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

  // Get last active date from most recent trade
  const lastActive = userTrades.length > 0 
    ? userTrades.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.entryDate || Date.now());
        const dateB = new Date(b.createdAt || b.entryDate || Date.now());
        return dateB.getTime() - dateA.getTime();
      })[0].createdAt || new Date().toISOString()
    : new Date().toISOString();

  return {
    totalTrades: userTrades.length,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
    avgPnL: Math.round(avgPnL * 100) / 100, // Round to 2 decimals
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    lastActive,
    trades: userTrades,
  };
}

// Get comprehensive user statistics
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const registeredUsers = getAllRegisteredUsers();
    const user = registeredUsers.find(u => u.id === userId);
    
    if (!user) {
      return null;
    }

    const allTrades = await getAllTrades();
    const stats = calculateUserStats(userId, allTrades);

    return {
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      joinDate: new Date(parseInt(user.id)).toISOString().split('T')[0], // Use ID as timestamp
      ...stats,
    } as UserStats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

// Get all users with their statistics
export async function getAllUsersWithStats(): Promise<UserStats[]> {
  try {
    const registeredUsers = getAllRegisteredUsers();
    const allTrades = await getAllTrades();
    
    console.log('Processing users:', registeredUsers.length);
    console.log('Processing trades:', allTrades.length);
    console.log('Sample trade:', allTrades[0]);
    
    const usersWithStats: UserStats[] = [];

    for (const user of registeredUsers) {
      console.log(`Processing user: ${user.name} (${user.id})`);
      const stats = calculateUserStats(user.id, allTrades);
      
      // Determine status based on trades
      const hasTrades = stats.totalTrades && stats.totalTrades > 0;
      const status = hasTrades ? 'active' : 'inactive';
      
      const userStats = {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        joinDate: new Date(parseInt(user.id)).toISOString().split('T')[0],
        status,
        totalTrades: stats.totalTrades || 0,
        tradesCount: stats.totalTrades || 0,
        ...stats,
      } as UserStats;
      
      console.log(`User ${user.name} final stats:`, userStats);
      usersWithStats.push(userStats);
    }

    console.log('All users with stats:', usersWithStats);
    return usersWithStats;
  } catch (error) {
    console.error('Error getting all users with stats:', error);
    return [];
  }
}

// Get admin dashboard statistics
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const usersWithStats = await getAllUsersWithStats();
    const allTrades = await getAllTrades();
    
    const totalUsers = usersWithStats.length;
    const activeUsers = usersWithStats.filter(user => user.totalTrades > 0).length;
    const totalTrades = allTrades.length;
    const totalPnL = usersWithStats.reduce((sum, user) => sum + user.totalPnL, 0);
    
    const usersWithTrades = usersWithStats.filter(user => user.totalTrades > 0);
    const avgWinRate = usersWithTrades.length > 0 
      ? usersWithTrades.reduce((sum, user) => sum + user.winRate, 0) / usersWithTrades.length 
      : 0;

    // Top performers (by total PnL)
    const topPerformers = usersWithStats
      .filter(user => user.totalTrades > 0)
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, 5);

    // Recent users (by join date)
    const recentUsers = usersWithStats
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, 5);

    const stats = {
      totalUsers,
      activeUsers,
      totalTrades,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgWinRate: Math.round(avgWinRate * 10) / 10,
      topPerformers,
      recentUsers,
    };

    console.log('Final admin stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalTrades: 0,
      totalPnL: 0,
      avgWinRate: 0,
      topPerformers: [],
      recentUsers: [],
    };
  }
}
