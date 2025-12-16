import { Trade } from '@/app/types';

/**
 * Check if a trade is pending (not yet closed)
 * A trade is pending if:
 * - exitDate is missing/null
 * - exitPrice is missing/null/0
 * - exitDate equals entryDate and exitPrice is 0 or null
 */
export function isPendingTrade(trade: Trade): boolean {
  if (!trade.exitDate) return true;
  if (trade.exitPrice == null || Number(trade.exitPrice) === 0) return true;
  if (trade.exitDate && trade.entryDate && trade.exitDate === trade.entryDate && (trade.exitPrice == null || Number(trade.exitPrice) === 0)) {
    return true;
  }
  return false;
}

/**
 * Filter out pending trades from an array
 */
export function filterCompletedTrades<T extends Trade>(trades: T[]): T[] {
  return trades.filter(trade => !isPendingTrade(trade));
}
