export type AssetClass = 'stock' | 'crypto';

export type Trade = {
  id: string;
  userId: string;
  date: string;        // ISO 8601 (yyyy-mm-dd)
  symbol: string;      // AAPL, NVDA, BTC, ETH ...
  assetClass: AssetClass;
  qty: number;         // lot/units
  pnl: number;         // profit/loss in USD
};