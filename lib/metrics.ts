import { Trade, AssetClass } from '../types/trade';
import { toISODate } from './date';

export function inRange(d: string, start: Date, end: Date): boolean {
  const date = new Date(d);
  // Normalize dates to start of day for comparison
  const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  return date >= startOfDay && date <= endOfDay;
}

export function filterByRangeAndCategory(
  trades: Trade[],
  range: { start: Date; end: Date },
  category: 'total' | 'stock' | 'crypto'
): Trade[] {
  return trades.filter(trade => {
    const dateMatch = inRange(trade.date, range.start, range.end);
    if (!dateMatch) return false;

    if (category === 'total') return true;
    return trade.assetClass === category;
  });
}

export function seriesPLByDay(trades: Trade[]): { date: string; pnl: number }[] {
  const pnlMap = new Map<string, number>();
  
  trades.forEach(trade => {
    const currentPnl = pnlMap.get(trade.date) || 0;
    pnlMap.set(trade.date, currentPnl + trade.pnl);
  });

  return Array.from(pnlMap.entries())
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function topSymbolsByTrades(trades: Trade[], n = 7): { label: string; value: number; assetClass: AssetClass }[] {
  const symbolCounts = new Map<string, { count: number; assetClass: AssetClass }>();
  
  trades.forEach(trade => {
    const current = symbolCounts.get(trade.symbol) || { count: 0, assetClass: trade.assetClass };
    symbolCounts.set(trade.symbol, { 
      count: current.count + 1, 
      assetClass: trade.assetClass 
    });
  });

  return Array.from(symbolCounts.entries())
    .map(([symbol, data]) => ({ 
      label: symbol, 
      value: data.count, 
      assetClass: data.assetClass 
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function sumPL(trades: Trade[]): number {
  return trades.reduce((sum, trade) => sum + trade.pnl, 0);
}

export function countTrades(trades: Trade[]): number {
  return trades.length;
}

export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  return (winningTrades / trades.length) * 100;
}

export function calculateAvgPnL(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return sumPL(trades) / trades.length;
}