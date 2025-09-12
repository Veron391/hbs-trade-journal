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
import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Hook for getting P&L line series data
 */
export function useLineSeries(): { date: string; pnl: number }[] {
  const { range, category } = useFilters();
  const { data: apiTrades } = useSWR('/api/trades', fetcher);
  
  return useMemo(() => {
    // Use API trades instead of localStorage
    const realTrades: any[] = Array.isArray(apiTrades) ? apiTrades : [];

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: (typeof trade.exitDate === 'string' ? trade.exitDate : new Date(trade.exitDate).toISOString().split('T')[0]),
      symbol: trade.symbol,
      assetClass: (trade.assetType || trade.type) === 'crypto' ? 'crypto' : 'stock',
      qty: typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0),
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.price === 'number' ? trade.price : (typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0);
        const quantity = typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0);
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        const direction = trade.direction || (trade.side === 'buy' ? 'long' : 'short');
        if (direction === 'long') {
          return exitValue - entryValue;
        } else {
          return entryValue - exitValue;
        }
      })()
    }));

    const filteredTrades = filterByRangeAndCategory(formattedTrades, range, category);
    return seriesPLByDay(filteredTrades);
  }, [apiTrades, range.start.getTime(), range.end.getTime(), category]);
}

/**
 * Hook for getting donut chart data (top symbols by trade count)
 */
export function useDonutData(): { label: string; value: number }[] {
  const { range, category } = useFilters();
  const { data: apiTrades } = useSWR('/api/trades', fetcher);
  
  return useMemo(() => {
    const realTrades: any[] = Array.isArray(apiTrades) ? apiTrades : [];

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: (typeof trade.exitDate === 'string' ? trade.exitDate : new Date(trade.exitDate).toISOString().split('T')[0]),
      symbol: trade.symbol,
      assetClass: (trade.assetType || trade.type) === 'crypto' ? 'crypto' : 'stock',
      qty: typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0),
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.price === 'number' ? trade.price : (typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0);
        const quantity = typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0);
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        const direction = trade.direction || (trade.side === 'buy' ? 'long' : 'short');
        if (direction === 'long') {
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
  }, [apiTrades, range.start.getTime(), range.end.getTime(), category]);
}

/**
 * Hook for getting total P&L and trade count
 */
export function useTotals(): { totalPL: number; tradesCount: number } {
  const { range, category } = useFilters();
  
  // Fetch data from admin aggregates API
  const { data: aggregates, error } = useSWR('/api/admin/aggregates', fetcher);
  
  return useMemo(() => {
    if (error || !aggregates) {
      return { totalPL: 0, tradesCount: 0 };
    }

    return {
      totalPL: aggregates.totalPL || 0,
      tradesCount: aggregates.totalTrades || 0
    };
  }, [aggregates, error]);
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
  const { data: apiTrades } = useSWR('/api/trades', fetcher);
  
  return useMemo(() => {
    const realTrades: any[] = Array.isArray(apiTrades) ? apiTrades : [];

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: (typeof trade.exitDate === 'string' ? trade.exitDate : new Date(trade.exitDate).toISOString().split('T')[0]),
      symbol: trade.symbol,
      assetClass: (trade.assetType || trade.type) === 'crypto' ? 'crypto' : 'stock',
      qty: typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0),
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.price === 'number' ? trade.price : (typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0);
        const quantity = typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0);
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        const direction = trade.direction || (trade.side === 'buy' ? 'long' : 'short');
        if (direction === 'long') {
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
  }, [apiTrades, range.start, range.end, category]);
}

/**
 * Hook for getting cumulative P&L data
 */
export function useCumulativePnL(): { date: string; pnl: number }[] {
  const { range, category } = useFilters();
  const { data: apiTrades } = useSWR('/api/trades', fetcher);
  
  return useMemo(() => {
    const realTrades: any[] = Array.isArray(apiTrades) ? apiTrades : [];

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: (typeof trade.exitDate === 'string' ? trade.exitDate : new Date(trade.exitDate).toISOString().split('T')[0]),
      symbol: trade.symbol,
      assetClass: (trade.assetType || trade.type) === 'crypto' ? 'crypto' : 'stock',
      qty: typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0),
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.price === 'number' ? trade.price : (typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0);
        const quantity = typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0);
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        const direction = trade.direction || (trade.side === 'buy' ? 'long' : 'short');
        if (direction === 'long') {
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
  }, [apiTrades, range.start, range.end, category]);
}

/**
 * Hook for getting asset class distribution
 */
export function useAssetClassDistribution(): { label: string; value: number; color: string }[] {
  const { range, category } = useFilters();
  const { data: apiTrades } = useSWR('/api/trades', fetcher);
  
  return useMemo(() => {
    const realTrades: any[] = Array.isArray(apiTrades) ? apiTrades : [];

    // If no real trades, return empty array
    if (realTrades.length === 0) {
      return [];
    }

    // Convert real trades to the format expected by filterByRangeAndCategory
    const formattedTrades = realTrades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      date: (typeof trade.exitDate === 'string' ? trade.exitDate : new Date(trade.exitDate).toISOString().split('T')[0]),
      symbol: trade.symbol,
      assetClass: (trade.assetType || trade.type) === 'crypto' ? 'crypto' : 'stock',
      qty: typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0),
      pnl: (() => {
        const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
        const exitPrice = typeof trade.price === 'number' ? trade.price : (typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0);
        const quantity = typeof trade.qty === 'number' ? trade.qty : (typeof trade.quantity === 'number' ? trade.quantity : 0);
        
        const entryValue = entryPrice * quantity;
        const exitValue = exitPrice * quantity;
        
        const direction = trade.direction || (trade.side === 'buy' ? 'long' : 'short');
        if (direction === 'long') {
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
  }, [apiTrades, range.start, range.end, category]);
}

/**
 * Hook for getting win rate data (all users)
 */
export function useWinRate(): number {
  const { range, category } = useFilters();
  
  // Fetch data from admin aggregates API
  const { data: aggregates, error } = useSWR('/api/admin/aggregates', fetcher);
  
  return useMemo(() => {
    if (error || !aggregates) {
      return 0;
    }

    return Math.round((aggregates.winRate || 0) * 100 * 10) / 10;
  }, [aggregates, error]);
}

/**
 * Hook for getting totals for active users only
 */
export function useActiveTotals(): { totalPL: number; tradesCount: number; activeUsersCount: number } {
  const { range, category } = useFilters();
  
  // Fetch data from admin aggregates API
  const { data: aggregates, error } = useSWR('/api/admin/aggregates', fetcher);
  
  return useMemo(() => {
    if (error || !aggregates) {
      return { totalPL: 0, tradesCount: 0, activeUsersCount: 0 };
    }

    return {
      totalPL: aggregates.totalPL || 0,
      tradesCount: aggregates.totalTrades || 0,
      activeUsersCount: aggregates.activeUsersCount || 0
    };
  }, [aggregates, error]);
}

/**
 * Hook for getting win rate for active users only
 */
export function useActiveWinRate(): number {
  const { range, category } = useFilters();
  
  // Fetch data from admin aggregates API
  const { data: aggregates, error } = useSWR('/api/admin/aggregates', fetcher);
  
  return useMemo(() => {
    if (error || !aggregates) {
      return 0;
    }

    return Math.round((aggregates.winRate || 0) * 100 * 10) / 10;
  }, [aggregates, error]);
}
