import { Trade, AssetClass } from '../types/trade';
import { toISODate, addDays } from './date';
import { getTashkentTime } from './dateRanges';

// Stock and crypto symbols
export const STOCKS = ['AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','NFLX','AMD','AVGO'];
export const CRYPTOS = ['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','TON','TRX','LTC'];

/**
 * Seeded random number generator for deterministic data
 */
export function seededRng(seed: number): () => number {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Generate realistic mock trades
 */
export function generateTrades(opts: { days?: number; users?: number; seed?: number } = {}): Trade[] {
  const { days = 180, users = 50, seed = 42 } = opts;
  const rng = seededRng(seed);
  const trades: Trade[] = [];
  const today = getTashkentTime(); // Use Tashkent time
  
  // Generate trades for each day
  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const tradeDate = addDays(today, -dayOffset);
    const dateStr = toISODate(tradeDate);
    
    // Skip weekends for stocks (optional)
    const isWeekend = tradeDate.getDay() === 0 || tradeDate.getDay() === 6;
    
    // Generate trades for each user
    for (let userId = 1; userId <= users; userId++) {
      const userIdStr = `user_${userId.toString().padStart(3, '0')}`;
      
      // 0-3 trades per user per day (higher probability on weekdays)
      const maxTrades = isWeekend ? 2 : 3;
      const numTrades = Math.floor(rng() * (maxTrades + 1));
      
      for (let i = 0; i < numTrades; i++) {
        // 50/50 split between stocks and crypto
        const assetClass: AssetClass = rng() < 0.5 ? 'stock' : 'crypto';
        const symbols = assetClass === 'stock' ? STOCKS : CRYPTOS;
        const symbol = symbols[Math.floor(rng() * symbols.length)];
        
        // Generate P&L with normal-like distribution
        let pnl: number;
        if (rng() < 0.05) {
          // 5% chance of outlier (±1500)
          pnl = (rng() < 0.5 ? -1 : 1) * (1000 + rng() * 500);
        } else {
          // Normal distribution around 0, range -200 to +200
          const normal = (rng() + rng() + rng() + rng()) / 4; // Approximate normal
          pnl = (normal - 0.5) * 400;
        }
        
        // Generate quantity (1-100 units)
        const qty = Math.floor(1 + rng() * 100);
        
        const trade: Trade = {
          id: `trade_${dateStr}_${userId}_${i}`,
          userId: userIdStr,
          date: dateStr,
          symbol,
          assetClass,
          qty,
          pnl: Math.round(pnl * 100) / 100 // Round to 2 decimal places
        };
        
        trades.push(trade);
      }
    }
  }
  
  return trades;
}

// Generate and export mock trades
export const MOCK_TRADES = generateTrades();

// Mock data service with deterministic seed for consistent data
class MockDataService {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  // Simple seeded random number generator
  private seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Generate random number between min and max
  private random(min: number, max: number): number {
    return min + (this.seed * 9301 + 49297) % 233280 / 233280 * (max - min);
  }

  // Generate trend data
  private generateTrend(): "up" | "down" | "stable" {
    const rand = this.seededRandom();
    if (rand < 0.4) return "up";
    if (rand < 0.7) return "down";
    return "stable";
  }

  // Generate percentage change
  private generateChange(): number {
    const trend = this.generateTrend();
    const baseChange = this.random(1, 15);
    return trend === "up" ? baseChange : trend === "down" ? -baseChange : this.random(-2, 2);
  }

  // KPI Data
  getKPIData() {
    // Get real data
    const users = this.getDetailedUsers();
    const trades = this.getTradesLog();
    
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const totalTrades = trades.length;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    
    // Calculate average win rate
    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    const avgWinRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100 * 10) / 10 : 0;
    
    return {
      totalUsers: {
        value: totalUsers,
        change: this.generateChange(),
        trend: this.generateTrend()
      },
      activeUsers: {
        value: activeUsers,
        change: this.generateChange(),
        trend: this.generateTrend()
      },
      totalTrades: {
        value: totalTrades,
        change: this.generateChange(),
        trend: this.generateTrend()
      },
      totalPnL: {
        value: Math.round(totalPnL),
        change: this.generateChange(),
        trend: this.generateTrend()
      },
      avgWinRate: {
        value: avgWinRate,
        change: this.generateChange(),
        trend: this.generateTrend()
      }
    };
  }


  // Generate last 30 days of trades data
  getTradesByDayData() {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic trade count (higher on weekdays, lower on weekends)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseTrades = isWeekend ? this.random(5, 15) : this.random(15, 45);
      const trades = Math.floor(baseTrades + this.random(-5, 5));
      
      data.push({
        date: date.toISOString().split('T')[0],
        trades: Math.max(0, trades)
      });
    }
    
    return data;
  }

  // Generate last 30 days of P&L data
  getPnLByDayData() {
    const data = [];
    const today = new Date();
    let cumulativePnL = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate daily P&L with some volatility
      const dailyPnL = this.random(-5000, 8000);
      cumulativePnL += dailyPnL;
      
      data.push({
        date: date.toISOString().split('T')[0],
        pnl: Math.round(cumulativePnL)
      });
    }
    
    return data;
  }

  // Generate top performers data
  getTopPerformers() {
    // Get real users from localStorage
    let realUsers: any[] = [];
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        realUsers = JSON.parse(registeredUsers);
      }
    } catch (error) {
      console.error('Error getting registered users:', error);
    }

    if (realUsers.length === 0) {
      return [];
    }

    // Get real trades from localStorage
    let realTrades: any[] = [];
    try {
      const storedTrades = localStorage.getItem('trades');
      if (storedTrades) {
        realTrades = JSON.parse(storedTrades);
      }
    } catch (error) {
      console.error('Error getting trades from localStorage:', error);
    }

    // Calculate performance for each user
    const performers = realUsers.map((user, index) => {
      const userId = user.id;
      const userTrades = realTrades.filter(trade => trade.userId === userId);
      
      let totalTrades = 0;
      let totalPnL = 0;
      let winCount = 0;
      
      if (userTrades.length > 0) {
        totalTrades = userTrades.length;
        totalPnL = userTrades.reduce((sum, trade) => {
          const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
          const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
          const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
          
          const entryValue = entryPrice * quantity;
          const exitValue = exitPrice * quantity;
          
          let pnl = 0;
          if (trade.direction === 'long') {
            pnl = exitValue - entryValue;
          } else {
            pnl = entryValue - exitValue;
          }
          
          return sum + pnl;
        }, 0);
        winCount = userTrades.filter(trade => {
          const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
          const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
          const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
          
          const entryValue = entryPrice * quantity;
          const exitValue = exitPrice * quantity;
          
          let pnl = 0;
          if (trade.direction === 'long') {
            pnl = exitValue - entryValue;
          } else {
            pnl = entryValue - exitValue;
          }
          
          return pnl > 0;
        }).length;
      }
      
      const winRate = totalTrades > 0 ? Math.round((winCount / totalTrades) * 100 * 10) / 10 : 0;
      
      return {
        id: userId,
        rank: index + 1,
        name: user.name,
        tradesCount: totalTrades,
        pnl: Math.round(totalPnL),
        winRate: winRate
      };
    });
    
    // Sort by P&L descending and return top 10
    return performers.sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  }

  // Generate recent users data (updated)
  getRecentUsers() {
    // Get real users from localStorage
    let realUsers: any[] = [];
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        realUsers = JSON.parse(registeredUsers);
      }
    } catch (error) {
      console.error('Error getting registered users:', error);
    }

    if (realUsers.length === 0) {
      return [];
    }

    // Filter for recent users (joined in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = realUsers.filter(user => {
      const joinedDate = new Date(user.joinedDate || user.createdAt || new Date());
      return joinedDate >= sevenDaysAgo;
    });
    
    // Return all recent users for users page filtering
    return recentUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      joinedDate: user.joinedDate || user.createdAt || new Date().toISOString().split('T')[0],
      initialTrades: 0, // Will be calculated from real trades
      status: 'inactive', // Default status, will be updated based on activity
      group: 'Alpha' // Default group
    }));
  }

  // Generate risk metrics data
  getRiskMetrics() {
    const names = [
      "Alex Chen", "Sarah Johnson", "Mike Rodriguez", "Emma Wilson", "David Kim",
      "Lisa Anderson", "James Brown", "Maria Garcia", "John Smith", "Anna Taylor",
      "Chris Miller", "Lisa Garcia", "Tom Anderson", "Amy Taylor", "Robert Wilson"
    ];
    
    const metrics = [];
    
    for (let i = 0; i < 15; i++) {
      const balance = this.random(10000, 100000);
      const equityDrop7d = this.random(-35, 5); // Some students have drops
      const winRate = this.random(25, 85);
      const totalTrades = Math.floor(this.random(20, 200));
      const exposure = this.random(30, 80);
      const leverage = this.random(1, 5);
      const largestDrawdown = Math.abs(this.random(-50000, -5000));
      const maxSingleTradeLoss = Math.abs(this.random(-15000, -1000));
      // Create more high frequency traders (10+ traders)
      const tradesThisWeek = i < 12 ? Math.floor(this.random(160, 350)) : Math.floor(this.random(50, 150));
      
      metrics.push({
        studentId: `student_${i + 1}`,
        studentName: names[i],
        equityDrop7d: Math.round(equityDrop7d * 10) / 10,
        winRate: Math.round(winRate * 10) / 10,
        totalTrades,
        exposure: Math.round(exposure * 10) / 10,
        balance: Math.round(balance),
        leverage: Math.round(leverage * 10) / 10,
        largestDrawdown: Math.round(largestDrawdown),
        maxSingleTradeLoss: Math.round(maxSingleTradeLoss),
        tradesThisWeek,
        isHighFrequency: tradesThisWeek > 150
      });
    }
    
    return metrics;
  }

  // Generate largest drawdown data (top 3)
  getLargestDrawdowns() {
    const metrics = this.getRiskMetrics();
    return metrics
      .sort((a, b) => a.largestDrawdown - b.largestDrawdown) // Sort by drawdown (ascending = worst first)
      .slice(0, 3)
      .map((metric, index) => ({
        rank: index + 1,
        name: metric.studentName,
        drawdown: metric.largestDrawdown,
        studentId: metric.studentId
      }));
  }

  // Generate max single trade loss data
  getMaxSingleTradeLosses() {
    const metrics = this.getRiskMetrics();
    return metrics
      .sort((a, b) => a.maxSingleTradeLoss - b.maxSingleTradeLoss) // Sort by loss (ascending = worst first)
      .slice(0, 5)
      .map((metric, index) => ({
        rank: index + 1,
        name: metric.studentName,
        loss: metric.maxSingleTradeLoss,
        studentId: metric.studentId
      }));
  }

  // Generate high frequency trading flags with pagination
  getHighFrequencyTraders(page: number = 1, pageSize: number = 10) {
    const metrics = this.getRiskMetrics();
    const allTraders = metrics
      .filter(metric => metric.isHighFrequency)
      .sort((a, b) => b.tradesThisWeek - a.tradesThisWeek) // Sort by trades (descending)
      .map((metric, index) => ({
        rank: index + 1,
        name: metric.studentName,
        tradesThisWeek: metric.tradesThisWeek,
        studentId: metric.studentId
      }));

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTraders = allTraders.slice(startIndex, endIndex);

    return {
      traders: paginatedTraders,
      total: allTraders.length,
      page,
      pageSize,
      totalPages: Math.ceil(allTraders.length / pageSize)
    };
  }

  // Generate leverage usage data
  getLeverageUsage() {
    const metrics = this.getRiskMetrics();
    return metrics
      .filter(metric => metric.leverage > 1) // Only students using leverage
      .sort((a, b) => b.leverage - a.leverage) // Sort by leverage (descending)
      .map((metric, index) => ({
        rank: index + 1,
        name: metric.studentName,
        leverage: metric.leverage,
        balance: metric.balance,
        studentId: metric.studentId
      }));
  }

  // New filter system methods
  getKPIDataFiltered(period: string, category: string, range: any) {
    // Generate different data based on period
    const baseData = this.getKPIData();
    
    // Adjust values based on period
    let multiplier = 1;
    let periodLabel = '';
    
    switch (period) {
      case 'thisMonth':
        multiplier = 0.8; // 80% of monthly data (partial month)
        periodLabel = 'This month';
        break;
      case 'oneWeek':
        multiplier = 0.2; // 20% of monthly data (1 week)
        periodLabel = '1 Week';
        break;
      case 'lastMonth':
        multiplier = 1; // Full monthly data
        periodLabel = 'Last month';
        break;
      case 'last90Days':
        multiplier = 3; // 3x monthly data for 90 days
        periodLabel = '90 Days';
        break;
      case 'yearToDate':
        multiplier = 8; // 8x monthly data for year to date
        periodLabel = 'Year to date';
        break;
      case 'allStats':
        multiplier = 24; // 24x monthly data for 2 years
        periodLabel = 'All stats';
        break;
      default:
        multiplier = 1;
        periodLabel = 'This month';
    }
    
    return {
      totalUsers: {
        ...baseData.totalUsers,
        value: Math.floor(baseData.totalUsers.value * multiplier),
        periodLabel
      },
      activeUsers: {
        ...baseData.activeUsers,
        value: Math.floor(baseData.activeUsers.value * multiplier),
        periodLabel
      },
      totalTrades: {
        ...baseData.totalTrades,
        value: Math.floor(baseData.totalTrades.value * multiplier),
        periodLabel
      },
      totalPnL: {
        ...baseData.totalPnL,
        value: baseData.totalPnL.value * multiplier,
        periodLabel
      },
      avgWinRate: {
        ...baseData.avgWinRate,
        value: baseData.avgWinRate.value + (Math.random() - 0.5) * 10, // Add some variation
        periodLabel
      }
    };
  }

  getRecentUsersFiltered(period: string, category: string, range: any) {
    // Get real users from localStorage
    let realUsers: any[] = [];
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        realUsers = JSON.parse(registeredUsers);
      }
    } catch (error) {
      console.error('Error getting registered users:', error);
    }

    if (realUsers.length === 0) {
      return [];
    }

    // Filter for recent users (joined in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = realUsers.filter(user => {
      const joinedDate = new Date(user.joinedDate || user.createdAt || new Date());
      return joinedDate >= sevenDaysAgo;
    });
    
    // Return only the first 10 recent users for dashboard display
    return recentUsers.slice(0, 10).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      joinedDate: user.joinedDate || user.createdAt || new Date().toISOString().split('T')[0],
      initialTrades: 0, // Will be calculated from real trades
      status: 'inactive', // Default status, will be updated based on activity
      group: 'Alpha' // Default group
    }));
  }

  getTradesByDayDataFiltered(period: string, category: string, range: any) {
    // Get real trades from localStorage for all users
    let realTrades: any[] = [];
    try {
      // Get all registered users
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        const users = JSON.parse(registeredUsers);
        
        // Get trades for each user
        users.forEach((user: any) => {
          const userTradesKey = `trades_${user.id}`;
          const userTrades = localStorage.getItem(userTradesKey);
          if (userTrades) {
            const parsedTrades = JSON.parse(userTrades);
            realTrades = realTrades.concat(parsedTrades);
          }
        });
      }
    } catch (error) {
      console.error('Error getting trades from localStorage:', error);
    }

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Group trades by date and count them
    const dailyTrades = new Map<string, number>();
    
    realTrades.forEach(trade => {
      const date = trade.exitDate;
      const existing = dailyTrades.get(date) || 0;
      dailyTrades.set(date, existing + 1);
    });
    
    // Convert to array and sort by date
    return Array.from(dailyTrades.entries())
      .map(([date, trades]) => ({ date, trades }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getPnLByDayDataFiltered(period: string, category: string, range: any) {
    // Get real trades from localStorage for all users
    let realTrades: any[] = [];
    try {
      // Get all registered users
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        const users = JSON.parse(registeredUsers);
        
        // Get trades for each user
        users.forEach((user: any) => {
          const userTradesKey = `trades_${user.id}`;
          const userTrades = localStorage.getItem(userTradesKey);
          if (userTrades) {
            const parsedTrades = JSON.parse(userTrades);
            realTrades = realTrades.concat(parsedTrades);
          }
        });
      }
    } catch (error) {
      console.error('Error getting trades from localStorage:', error);
    }

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Group trades by date and calculate daily P&L
    const dailyPnL = new Map<string, number>();
    
    realTrades.forEach(trade => {
      const date = trade.exitDate;
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      
      const entryValue = entryPrice * quantity;
      const exitValue = exitPrice * quantity;
      
      let pnl = 0;
      if (trade.direction === 'long') {
        pnl = exitValue - entryValue;
      } else {
        pnl = entryValue - exitValue;
      }
      
      const existing = dailyPnL.get(date) || 0;
      dailyPnL.set(date, existing + pnl);
    });
    
    // Convert to array and sort by date
    const data = Array.from(dailyPnL.entries())
      .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate cumulative P&L
    let cumulative = 0;
    return data.map(day => {
      cumulative += day.pnl;
      return {
        date: day.date,
        pnl: Math.round(cumulative * 100) / 100
      };
    });
  }

  getTopPerformersFiltered(period: string, category: string, range: any) {
    // Return real top performers data
    return this.getTopPerformers();
  }

  // Legacy filtered data methods (kept for backward compatibility)
  getFilteredRecentUsers(filters: any) {
    let users = this.getRecentUsers();
    
    // Apply search filter
    if (filters.search?.query) {
      const query = filters.search.query.toLowerCase();
      users = users.filter(user => {
        if (filters.search.type === 'name') {
          return user.name.toLowerCase().includes(query);
        } else if (filters.search.type === 'email') {
          return user.email.toLowerCase().includes(query);
        } else {
          return user.name.toLowerCase().includes(query) || 
                 user.email.toLowerCase().includes(query);
        }
      });
    }
    
    // Apply group by filter
    if (filters.groupBy?.type === 'group' && filters.groupBy?.value) {
      users = users.filter(user => user.group === filters.groupBy.value);
    }
    
    return users;
  }

  getFilteredTopPerformers(filters: any) {
    let performers = this.getTopPerformers();
    
    // Apply search filter
    if (filters.search?.query) {
      const query = filters.search.query.toLowerCase();
      performers = performers.filter(performer => 
        performer.name.toLowerCase().includes(query)
      );
    }
    
    return performers;
  }

  getFilteredKPIData(filters: any) {
    // For demo purposes, we'll return the same KPI data
    // In a real app, this would be calculated based on filtered data
    return this.getKPIData();
  }

  getFilteredTradesByDayData(filters: any) {
    // For demo purposes, we'll return the same chart data
    // In a real app, this would be calculated based on filtered date range
    return this.getTradesByDayData();
  }

  getFilteredPnLByDayData(filters: any) {
    // For demo purposes, we'll return the same chart data
    // In a real app, this would be calculated based on filtered date range
    return this.getPnLByDayData();
  }

  // Generate detailed users data for admin users page
  getDetailedUsers() {
    // Get real registered users from localStorage
    let realUsers: any[] = [];
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        realUsers = JSON.parse(registeredUsers);
      }
    } catch (error) {
      console.error('Error getting registered users:', error);
    }

    // If no real users, return empty array
    if (realUsers.length === 0) {
      return [];
    }

    const groups = ["Alpha", "Beta", "Delta"];

    // Get trades data to determine activity
    const trades = this.getTradesLog();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    return realUsers.map((user, i) => {
      const userId = user.id;
      
      // Check if user has traded in the last 2 weeks
      const recentTrades = trades.filter(trade => 
        trade.userId === userId && 
        new Date(trade.date) >= twoWeeksAgo
      );
      
      // Check if user has any trades at all
      const allUserTrades = trades.filter(trade => trade.userId === userId);
      const hasRecentActivity = recentTrades.length > 0;
      
      // Calculate user's actual trade statistics
      let totalTrades = 0;
      let totalPnL = 0;
      let winCount = 0;
      
      if (allUserTrades.length > 0) {
        totalTrades = allUserTrades.length;
        totalPnL = allUserTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        winCount = allUserTrades.filter(trade => trade.pnl > 0).length;
      }
      
      const winRate = totalTrades > 0 ? Math.round((winCount / totalTrades) * 100 * 10) / 10 : 0;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        joinedDate: user.joinedDate || new Date(Date.now() - this.random(1, 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalTrades: totalTrades,
        pnl: Math.round(totalPnL),
        winRate: winRate,
        status: hasRecentActivity ? 'active' : 'inactive',
        group: groups[Math.floor(this.random(0, groups.length))],
        lastActive: hasRecentActivity 
          ? recentTrades[recentTrades.length - 1].date
          : allUserTrades.length > 0 
            ? allUserTrades[allUserTrades.length - 1].date
            : new Date(Date.now() - this.random(15, 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    });
  }

  // Generate trades log data
  getTradesLog() {
    // Get real trades from localStorage
    let realTrades: any[] = [];
    try {
      const storedTrades = localStorage.getItem('trades');
      if (storedTrades) {
        realTrades = JSON.parse(storedTrades);
      }
    } catch (error) {
      console.error('Error getting trades from localStorage:', error);
    }

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Get real users for userName mapping
    let realUsers: any[] = [];
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        realUsers = JSON.parse(registeredUsers);
      }
    } catch (error) {
      console.error('Error getting registered users:', error);
    }

    return realTrades.map((trade, index) => {
      const user = realUsers.find(u => u.id === trade.userId);
      const userName = user ? user.name : `User ${trade.userId}`;
      
      // Calculate P&L based on trade data
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      
      const entryValue = entryPrice * quantity;
      const exitValue = exitPrice * quantity;
      
      let pnl = 0;
      if (trade.direction === 'long') {
        pnl = exitValue - entryValue;
      } else {
        pnl = entryValue - exitValue;
      }
      
      return {
        id: trade.id || index + 1,
        userId: trade.userId,
        userName: userName,
        symbol: trade.symbol,
        assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
        type: trade.direction === 'long' ? 'BUY' : 'SELL',
        quantity: quantity,
        entryPrice: entryPrice,
        exitPrice: exitPrice,
        entryDate: trade.entryDate,
        exitDate: trade.exitDate,
        pnl: Math.round(pnl * 100) / 100,
        status: 'FILLED',
        date: trade.exitDate,
        timestamp: new Date(trade.exitDate).toISOString(),
        link: trade.link || null
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Generate individual user profile data
  getUserProfile(userId: number) {
    const user = this.getDetailedUsers().find(u => u.id === userId);
    if (!user) return null;

    const trades = this.getTradesLog().filter(t => t.userId === userId);
    const recentTrades = trades.slice(0, 10);
    
    // Generate equity curve data (last 30 days)
    const equityCurve = [];
    let currentEquity = 100000; // Starting equity
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dailyPnL = this.random(-5000, 8000);
      currentEquity += dailyPnL;
      
      equityCurve.push({
        date: date.toISOString().split('T')[0],
        equity: Math.round(currentEquity)
      });
    }

    return {
      ...user,
      recentTrades,
      equityCurve,
      totalVolume: trades.reduce((sum, trade) => sum + (trade.quantity * trade.entryPrice), 0),
      avgTradeSize: trades.length > 0 ? trades.reduce((sum, trade) => sum + trade.quantity, 0) / trades.length : 0,
      bestTrade: trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0,
      worstTrade: trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0
    };
  }

  // Seed sample data if none exists
  seedSampleData() {
    try {
      const registeredUsers = localStorage.getItem('registeredUsers');
      let users = registeredUsers ? JSON.parse(registeredUsers) : [];
      if (users.length === 0) {
        const sampleUsers = [
          {
            id: '1',
            email: 'john@example.com',
            name: 'John Doe',
            password: 'password123',
            joinedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            id: '2',
            email: 'jane@example.com',
            name: 'Jane Smith',
            password: 'password123',
            joinedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            id: '3',
            email: 'mike@example.com',
            name: 'Mike Johnson',
            password: 'password123',
            joinedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ];
        localStorage.setItem('registeredUsers', JSON.stringify(sampleUsers));
        console.log('Seeded sample users.');
      }

      // Seed trades for each user
      ['1', '2', '3'].forEach(userId => {
        const tradesKey = `trades_${userId}`;
        const existingTrades = localStorage.getItem(tradesKey);
        if (!existingTrades || JSON.parse(existingTrades).length === 0) {
          const sampleTrades = [
            {
              id: Math.random().toString(36).substr(2, 9),
              userId: userId,
              symbol: 'BTCUSDT',
              type: 'crypto',
              direction: 'long',
              entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              exitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              entryPrice: 59000,
              exitPrice: 62000,
              quantity: 0.1,
              link: null
            },
            {
              id: Math.random().toString(36).substr(2, 9),
              userId: userId,
              symbol: 'AAPL',
              type: 'stock',
              direction: 'long',
              entryDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              exitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              entryPrice: 150,
              exitPrice: 155,
              quantity: 10,
              link: null
            },
            {
              id: Math.random().toString(36).substr(2, 9),
              userId: userId,
              symbol: 'ETHUSDT',
              type: 'crypto',
              direction: 'short',
              entryDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              exitDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              entryPrice: 3200,
              exitPrice: 3100,
              quantity: 1,
              link: null
            }
          ];
          localStorage.setItem(tradesKey, JSON.stringify(sampleTrades));
          console.log(`Seeded sample trades for user ${userId}.`);
        }
      });
    } catch (error) {
      console.error('Error seeding sample data:', error);
    }
  }
}

// Create singleton instance
export const mockData = new MockDataService();

// Format helpers
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatChange = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Get active users only (for KPI calculations)
export function getActiveUsers() {
  const allUsers = mockData.getDetailedUsers();
  return allUsers.filter(user => user.status === 'active');
}
