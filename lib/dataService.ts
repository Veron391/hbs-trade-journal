import { useMemo } from 'react';
import { useFilters } from './filters';
import { MOCK_TRADES, getActiveUsers } from './mock';
import { 
  filterByRangeAndCategory, 
  seriesPLByDay, 
  topSymbolsByTrades, 
  sumPL, 
  countTrades 
} from './metrics';

/**
 * Hook for getting P&L line series data
 */
export function useLineSeries(): { date: string; pnl: number }[] {
  const { range, category } = useFilters();
  
  return useMemo(() => {
    // Get real trades from localStorage
    let realTrades: any[] = [];
    try {
      // First try to get from main trades key
      const mainTrades = localStorage.getItem('trades');
      if (mainTrades) {
        const parsedTrades = JSON.parse(mainTrades);
        realTrades = realTrades.concat(parsedTrades);
      }

      // Also try to get from individual user keys
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        const users = JSON.parse(registeredUsers);
        
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

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    return seriesPLByDay(filteredTrades);
  }, [range.start.getTime(), range.end.getTime(), category]);
}

/**
 * Hook for getting donut chart data (top symbols by trade count)
 */
export function useDonutData(): { label: string; value: number }[] {
  const { range, category } = useFilters();
  
  return useMemo(() => {
    // Get real trades from localStorage
    let realTrades: any[] = [];
    try {
      // First try to get from main trades key
      const mainTrades = localStorage.getItem('trades');
      if (mainTrades) {
        const parsedTrades = JSON.parse(mainTrades);
        realTrades = realTrades.concat(parsedTrades);
        console.log('Main trades found:', parsedTrades.length);
      }

      // Also try to get from individual user keys
      const registeredUsers = localStorage.getItem('registeredUsers');
      if (registeredUsers) {
        const users = JSON.parse(registeredUsers);
        
        users.forEach((user: any) => {
          const userTradesKey = `trades_${user.id}`;
          const userTrades = localStorage.getItem(userTradesKey);
          if (userTrades) {
            const parsedTrades = JSON.parse(userTrades);
            realTrades = realTrades.concat(parsedTrades);
            console.log(`User ${user.name} trades found:`, parsedTrades.length);
          }
        });
      }
    } catch (error) {
      console.error('Error getting trades from localStorage:', error);
    }

    console.log('Total trades for donut chart:', realTrades.length);

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    const topSymbols = topSymbolsByTrades(filteredTrades, 7);
    
    // Sort by trade count (highest first)
    const sortedSymbols = topSymbols.sort((a, b) => b.value - a.value);
    
    // Convert to donut chart format (remove assetClass)
    return sortedSymbols.map(symbol => ({
      label: symbol.label,
      value: symbol.value
    }));
  }, [range.start.getTime(), range.end.getTime(), category]);
}

/**
 * Hook for getting total P&L and trade count
 */
export function useTotals(): { totalPL: number; tradesCount: number } {
  const { range, category } = useFilters();
  
  return useMemo(() => {
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

    // If no real trades, return zeros
    if (realTrades.length === 0) {
      return { totalPL: 0, tradesCount: 0 };
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    return {
      totalPL: Math.round(sumPL(filteredTrades) * 100) / 100,
      tradesCount: countTrades(filteredTrades)
    };
  }, [range.start.getTime(), range.end.getTime(), category]);
}

/**
 * Get human-readable label for period
 */
export function labelForPeriod(period: 'thisMonth' | 'oneWeek' | 'lastMonth' | 'last90Days' | 'yearToDate' | 'allStats'): string {
  switch (period) {
    case 'thisMonth':
      return 'This month';
    case 'oneWeek':
      return 'Weekly';
    case 'lastMonth':
      return 'Last month';
    case 'last90Days':
      return 'Last 90 days';
    case 'yearToDate':
      return 'Year to date';
    case 'allStats':
      return 'All stats';
    default:
      return 'Unknown period';
  }
}

/**
 * Get human-readable label for category
 */
export function labelForCategory(cat: 'total' | 'stock' | 'crypto'): string {
  switch (cat) {
    case 'total':
      return 'Total';
    case 'stock':
      return 'Stock';
    case 'crypto':
      return 'Crypto';
    default:
      return 'Unknown category';
  }
}

/**
 * Hook for getting trades by day data (for trades chart)
 */
export function useTradesByDay(): { date: string; trades: number }[] {
  const { range, category } = useFilters();
  
  return useMemo(() => {
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

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    
    // Group trades by date and count them
    const dailyTrades = new Map<string, number>();
    
    filteredTrades.forEach(trade => {
      const existing = dailyTrades.get(trade.date) || 0;
      dailyTrades.set(trade.date, existing + 1);
    });
    
    // Convert to array and sort by date
    return Array.from(dailyTrades.entries())
      .map(([date, trades]) => ({ date, trades }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [range.start, range.end, category]);
}

/**
 * Hook for getting cumulative P&L data
 */
export function useCumulativePnL(): { date: string; pnl: number }[] {
  const { range, category } = useFilters();
  
  return useMemo(() => {
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

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    const dailyPnL = seriesPLByDay(filteredTrades);
    
    // Calculate cumulative P&L
    let cumulative = 0;
    return dailyPnL.map(day => {
      cumulative += day.pnl;
      return {
        date: day.date,
        pnl: Math.round(cumulative * 100) / 100
      };
    });
  }, [range.start, range.end, category]);
}

/**
 * Hook for getting asset class distribution
 */
export function useAssetClassDistribution(): { label: string; value: number; color: string }[] {
  const { range, category } = useFilters();
  
  return useMemo(() => {
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

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    
    // Count trades by asset class
    const stockCount = filteredTrades.filter(trade => trade.assetClass === 'stock').length;
    const cryptoCount = filteredTrades.filter(trade => trade.assetClass === 'crypto').length;
    
    return [
      { label: 'Stocks', value: stockCount, color: '#3b82f6' },
      { label: 'Crypto', value: cryptoCount, color: '#f59e0b' }
    ].filter(item => item.value > 0); // Only include non-zero values
  }, [range.start, range.end, category]);
}

/**
 * Hook for getting win rate data (all users)
 */
export function useWinRate(): number {
  const { range, category } = useFilters();
  
  return useMemo(() => {
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

    // If no real trades, return 0
    if (realTrades.length === 0) {
      return 0;
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    
    if (filteredTrades.length === 0) return 0;
    
    const profitableTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
    return Math.round((profitableTrades / filteredTrades.length) * 100 * 10) / 10;
  }, [range.start, range.end, category]);
}

/**
 * Hook for getting totals for active users only
 */
export function useActiveTotals(): { totalPL: number; tradesCount: number; activeUsersCount: number } {
  const { range, category } = useFilters();
  
  return useMemo(() => {
    const activeUsers = getActiveUsers();
    const activeUserIds = activeUsers.map(user => user.id);
    
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

    // If no real trades, return zeros
    if (realTrades.length === 0) {
      return { totalPL: 0, tradesCount: 0, activeUsersCount: activeUsers.length };
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    // Filter trades to only include active users
    const activeUserTrades = formattedTrades.filter(trade => activeUserIds.includes(trade.userId));
    const filteredTrades = filterByRangeAndCategory(activeUserTrades, range, category);
    
    return {
      totalPL: Math.round(sumPL(filteredTrades) * 100) / 100,
      tradesCount: countTrades(filteredTrades),
      activeUsersCount: activeUsers.length
    };
  }, [range.start.getTime(), range.end.getTime(), category]);
}

/**
 * Hook for getting win rate for active users only
 */
export function useActiveWinRate(): number {
  const { range, category } = useFilters();
  
  return useMemo(() => {
    const activeUsers = getActiveUsers();
    const activeUserIds = activeUsers.map(user => user.id);
    
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

    // If no real trades, return 0
    if (realTrades.length === 0) {
      return 0;
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: trade.exitDate,
      symbol: trade.symbol,
      assetClass: trade.type === 'crypto' ? 'crypto' : 'stock',
      qty: trade.quantity,
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
        const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        if (trade.direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    // Filter trades to only include active users
    const activeUserTrades = formattedTrades.filter(trade => activeUserIds.includes(trade.userId));
    const filteredTrades = filterByRangeAndCategory(activeUserTrades, range, category);
    
    if (filteredTrades.length === 0) return 0;
    
    const profitableTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
    return Math.round((profitableTrades / filteredTrades.length) * 100 * 10) / 10;
  }, [range.start.getTime(), range.end.getTime(), category]);
}
