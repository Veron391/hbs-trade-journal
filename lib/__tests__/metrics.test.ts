import { describe, it, expect, beforeEach } from 'vitest';
import { 
  inRange, 
  filterByRangeAndCategory, 
  seriesPLByDay, 
  topSymbolsByTrades, 
  sumPL,
  countTrades,
  calculateWinRate 
} from '../metrics';
import { Trade } from '../../types/trade';

// Mock trades for testing
const mockTrades: Trade[] = [
  { id: '1', userId: 'user_001', date: '2023-01-01', symbol: 'AAPL', assetClass: 'stock', qty: 10, pnl: 100 },
  { id: '2', userId: 'user_001', date: '2023-01-01', symbol: 'BTC', assetClass: 'crypto', qty: 1, pnl: -50 },
  { id: '3', userId: 'user_002', date: '2023-01-02', symbol: 'AAPL', assetClass: 'stock', qty: 5, pnl: 200 },
  { id: '4', userId: 'user_001', date: '2023-01-02', symbol: 'ETH', assetClass: 'crypto', qty: 2, pnl: 150 },
  { id: '5', userId: 'user_003', date: '2023-01-03', symbol: 'MSFT', assetClass: 'stock', qty: 20, pnl: -75 },
  { id: '6', userId: 'user_001', date: '2023-01-03', symbol: 'AAPL', assetClass: 'stock', qty: 15, pnl: 300 },
  { id: '7', userId: 'user_004', date: '2023-01-04', symbol: 'BTC', assetClass: 'crypto', qty: 0.5, pnl: 1000 },
  { id: '8', userId: 'user_002', date: '2023-01-04', symbol: 'NVDA', assetClass: 'stock', qty: 3, pnl: -20 },
];

describe('metrics', () => {
  // Test inRange function
  it('should correctly check if a date is within a range', () => {
    const start = new Date('2023-01-01T00:00:00.000Z');
    const end = new Date('2023-01-03T23:59:59.999Z');

    expect(inRange('2023-01-01', start, end)).toBe(true);
    expect(inRange('2023-01-02', start, end)).toBe(true);
    expect(inRange('2023-01-03', start, end)).toBe(true);
    expect(inRange('2022-12-31', start, end)).toBe(false);
    expect(inRange('2023-01-04', start, end)).toBe(false);
  });

  // Test filterByRangeAndCategory function
  it('should filter trades by date range and category', () => {
    const range = { start: new Date('2023-01-01'), end: new Date('2023-01-02') };
    
    const filteredTotal = filterByRangeAndCategory(mockTrades, range, 'total');
    expect(filteredTotal.length).toBe(4); // Trades 1, 2, 3, 4

    const filteredStock = filterByRangeAndCategory(mockTrades, range, 'stock');
    expect(filteredStock.length).toBe(2); // Trades 1, 3
    expect(filteredStock.every(t => t.assetClass === 'stock')).toBe(true);

    const filteredCrypto = filterByRangeAndCategory(mockTrades, range, 'crypto');
    expect(filteredCrypto.length).toBe(2); // Trades 2, 4
    expect(filteredCrypto.every(t => t.assetClass === 'crypto')).toBe(true);
  });

  // Test seriesPLByDay function
  it('should group trades by date and sum P&L', () => {
    const result = seriesPLByDay(mockTrades);
    
    expect(result).toHaveLength(4); // 4 unique dates
    
    // Check specific dates
    const jan1 = result.find(r => r.date === '2023-01-01');
    expect(jan1).toBeDefined();
    expect(jan1?.pnl).toBe(50); // 100 + (-50)

    const jan2 = result.find(r => r.date === '2023-01-02');
    expect(jan2).toBeDefined();
    expect(jan2?.pnl).toBe(350); // 200 + 150

    const jan3 = result.find(r => r.date === '2023-01-03');
    expect(jan3).toBeDefined();
    expect(jan3?.pnl).toBe(225); // -75 + 300

    const jan4 = result.find(r => r.date === '2023-01-04');
    expect(jan4).toBeDefined();
    expect(jan4?.pnl).toBe(980); // 1000 + (-20)
  });

  // Test topSymbolsByTrades function
  it('should return top symbols by trade count', () => {
    const result = topSymbolsByTrades(mockTrades, 3);
    
    expect(result).toHaveLength(3);
    
    // AAPL should be first (3 trades)
    expect(result[0].label).toBe('AAPL');
    expect(result[0].value).toBe(3);
    expect(result[0].assetClass).toBe('stock');
    
    // BTC should be second (2 trades)
    expect(result[1].label).toBe('BTC');
    expect(result[1].value).toBe(2);
    expect(result[1].assetClass).toBe('crypto');
    
    // ETH, MSFT, NVDA should be tied for third (1 trade each)
    // The function should return one of them
    expect(result[2].value).toBe(1);
  });

  // Test sumPL function
  it('should calculate total P&L correctly', () => {
    const result = sumPL(mockTrades);
    const expected = 100 + (-50) + 200 + 150 + (-75) + 300 + 1000 + (-20);
    expect(result).toBe(expected);
  });

  // Test countTrades function
  it('should count trades correctly', () => {
    const result = countTrades(mockTrades);
    expect(result).toBe(8);
  });

  // Test calculateWinRate function
  it('should calculate win rate correctly', () => {
    const result = calculateWinRate(mockTrades);
    // Profitable trades: 100, 200, 150, 300, 1000 = 5 trades
    // Total trades: 8
    // Win rate: 5/8 * 100 = 62.5%
    expect(result).toBe(62.5);
  });

  it('should return 0 for empty trades array', () => {
    expect(calculateWinRate([])).toBe(0);
  });
});
