export type TradeType = 'stock' | 'crypto' | 'total';
export type Direction = 'long' | 'short';

export interface Trade {
  id: string;
  type: TradeType;
  symbol: string;
  direction: Direction;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  setupNotes: string;
  mistakesNotes: string;
  tags: string[];
  link?: string;
}

export interface TradeStats {
  totalProfitLoss: number;
  averageProfitLoss: number;
  averageWinningTrade: number;
  averageLosingTrade: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  largestProfit: number;
  largestLoss: number;
  averageHoldTime: number;
  averageWinningHoldTime: number;
  averageLosingHoldTime: number;
  profitFactor: number;
  winRate: number;
  sortino: number;
  averageRiskRewardRatio: number;
} 