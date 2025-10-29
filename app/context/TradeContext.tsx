"use client";

import { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { Trade, TradeStats } from '../types';
import { differenceInDays } from 'date-fns';
import { useTrades as useTradesHook } from '@/lib/hooks/useTrades';
import { Trade as ApiTrade } from '@/lib/api/trades';

interface TradeContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  updateTrade: (id: string, trade: Omit<Trade, 'id'>) => void;
  deleteTrade: (id: string) => void;
  clearAllTrades: () => void;
  importTradesFromApi: () => Promise<void>;
  isImporting: boolean;
  importError: string | null;
  stats: TradeStats;
  isLoading: boolean;
  error: any;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

// Helper function to convert API trade to internal trade format
function convertApiTradeToInternal(apiTrade: ApiTrade): Trade {
  // Use exitPrice from API if available, otherwise calculate from PnL
  let exitPrice = apiTrade.exitPrice;
  if (!exitPrice && apiTrade.pnl !== null && apiTrade.pnl !== undefined) {
    const pnlPerShare = apiTrade.pnl / apiTrade.qty;
    exitPrice = apiTrade.direction === 'long' 
      ? apiTrade.entryPrice + pnlPerShare 
      : apiTrade.entryPrice - pnlPerShare;
  }

  // Convert UTC date to local date string (YYYY-MM-DD format)
  // Use entryDate and exitDate if available, otherwise fall back to occurredAt
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const entryDateString = apiTrade.entryDate ? formatDate(apiTrade.entryDate) : formatDate(apiTrade.occurredAt);
  const exitDateString = apiTrade.exitDate ? formatDate(apiTrade.exitDate) : formatDate(apiTrade.occurredAt);

  return {
    id: apiTrade.id,
    symbol: apiTrade.symbol,
    type: apiTrade.assetType, // 'stock' or 'crypto'
    direction: apiTrade.direction,
    entryDate: entryDateString,
    exitDate: exitDateString,
    entryPrice: apiTrade.entryPrice,
    exitPrice: exitPrice || apiTrade.entryPrice,
    quantity: apiTrade.qty,
    setupNotes: apiTrade.setupNotes || '',
    link: apiTrade.link || '',
  };
}

// Helper function to convert internal trade to API format
function convertInternalTradeToApi(trade: Omit<Trade, 'id'>): any {
  // Calculate PnL
  const entryTotal = trade.entryPrice * trade.quantity;
  const exitTotal = trade.exitPrice * trade.quantity;
  const pnl = trade.direction === 'long' 
    ? exitTotal - entryTotal 
    : entryTotal - exitTotal;

  return {
    assetType: trade.type === 'stock' ? 'stock' : 'crypto', // Convert type to assetType
    symbol: trade.symbol,
    direction: trade.direction, // Use direction directly
    qty: Number(trade.quantity), // Ensure it's a number
    entryPrice: Number(trade.entryPrice), // Use entryPrice field
    exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null, // Include exitPrice or null
    entryDate: new Date(trade.entryDate).toISOString(), // Entry date
    exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString() : null, // Exit date or null
    occurredAt: new Date(trade.entryDate).toISOString(), // Keep for backward compatibility
    // Pass through descriptive fields so backend mapper can forward them
    setupNotes: trade.setupNotes || '',
    link: trade.link || '',
  };
}

export function TradeProvider({ children }: { children: ReactNode }) {
  const tradesHookResult = useTradesHook();
  
  // Add safety check for undefined result
  if (!tradesHookResult) {
    console.error('useTradesHook returned undefined');
    return (
      <TradeContext.Provider
        value={{
          trades: [],
          addTrade: async () => {},
          updateTrade: async () => {},
          deleteTrade: async () => {},
          clearAllTrades: async () => {},
          importTradesFromApi: async () => {},
          isImporting: false,
          importError: null,
          stats: {
            totalProfitLoss: 0,
            averageProfitLoss: 0,
            averageWinningTrade: 0,
            averageLosingTrade: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            breakEvenTrades: 0,
            maxConsecutiveWins: 0,
            maxConsecutiveLosses: 0,
            largestProfit: 0,
            largestLoss: 0,
            averageHoldTime: 0,
            averageWinningHoldTime: 0,
            averageLosingHoldTime: 0,
            riskRewardRatio: 0,
            winRate: 0,
            sortino: 0,
            averageRiskRewardRatio: 0,
          },
          isLoading: true,
          error: new Error('Failed to initialize trades'),
        }}
      >
        {children}
      </TradeContext.Provider>
    );
  }

  const { trades: apiTrades, addTrade: apiAddTrade, editTrade: apiEditTrade, removeTrade: apiRemoveTrade, isLoading, error } = tradesHookResult;
  
  console.log('TradeProvider - apiTrades:', apiTrades);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Removed localStorage persistence for trades

  // Convert API trades to internal format
  const trades = Array.isArray(apiTrades) ? apiTrades.map(convertApiTradeToInternal) : [];

  // Calculate stats from trades
  const stats = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalProfitLoss: 0,
        averageProfitLoss: 0,
        averageWinningTrade: 0,
        averageLosingTrade: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        largestProfit: 0,
        largestLoss: 0,
        averageHoldTime: 0,
        averageWinningHoldTime: 0,
        averageLosingHoldTime: 0,
        riskRewardRatio: 0,
        winRate: 0,
        sortino: 0,
        averageRiskRewardRatio: 0,
      };
    }

    // Process each trade and categorize them
    const processedTrades = trades.map(trade => {
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      
      const entryTotal = entryPrice * quantity;
      const exitTotal = exitPrice * quantity;
      
      let profitLoss = 0;
      if (trade.direction === 'long') {
        profitLoss = exitTotal - entryTotal;
      } else {
        // For short trades, profit is when exit price is lower than entry
        profitLoss = entryTotal - exitTotal;
      }
      
      const holdTime = trade.exitDate ? differenceInDays(
        new Date(trade.exitDate),
        new Date(trade.entryDate)
      ) : 0;
      
      return {
        ...trade,
        profitLoss,
        holdTime,
        isWinner: profitLoss > 0.01, // Small threshold to account for floating point precision
        isLoser: profitLoss < -0.01, // Small threshold to account for floating point precision
        isBreakEven: Math.abs(profitLoss) <= 0.01, // Consider trades within $0.01 as break even
      };
    });
    
    // Filter trades by result
    const winningTrades = processedTrades.filter(t => t.isWinner);
    const losingTrades = processedTrades.filter(t => t.isLoser);
    const breakEvenTrades = processedTrades.filter(t => t.isBreakEven);
    
    // Calculate consecutive wins and losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    
    const sortedTrades = [...processedTrades].sort((a, b) => {
      // Handle pending trades (no exit date) by putting them at the end
      if (!a.exitDate && !b.exitDate) return 0;
      if (!a.exitDate) return 1;
      if (!b.exitDate) return -1;
      return new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime();
    });
    
    sortedTrades.forEach(trade => {
      if (trade.isWinner) {
        currentConsecutiveWins++;
        currentConsecutiveLosses = 0;
      } else if (trade.isLoser) {
        currentConsecutiveLosses++;
        currentConsecutiveWins = 0;
      } else {
        // Break even trades reset both counters
        currentConsecutiveWins = 0;
        currentConsecutiveLosses = 0;
      }
      
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentConsecutiveWins);
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
    });
    
    // Calculate profit & loss statistics
    const totalProfitLoss = processedTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const averageProfitLoss = totalProfitLoss / processedTrades.length;
    
    const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    
    const averageWinningTrade = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
    const averageLosingTrade = losingTrades.length > 0 ? -totalLossAmount / losingTrades.length : 0;
    
    // Calculate largest gains and losses
    const largestProfit = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profitLoss)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profitLoss)) : 0;
    
    // Calculate hold times
    const totalHoldTime = processedTrades.reduce((sum, t) => sum + t.holdTime, 0);
    const winningHoldTime = winningTrades.reduce((sum, t) => sum + t.holdTime, 0);
    const losingHoldTime = losingTrades.reduce((sum, t) => sum + t.holdTime, 0);
    
    const averageHoldTime = totalHoldTime / processedTrades.length;
    const averageWinningHoldTime = winningTrades.length > 0 ? winningHoldTime / winningTrades.length : 0;
    const averageLosingHoldTime = losingTrades.length > 0 ? losingHoldTime / losingTrades.length : 0;
    
    // Calculate performance ratios
    const riskRewardRatio = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount;
    const winRate = processedTrades.length > 0 ? winningTrades.length / processedTrades.length : 0;
    
    // Sortino Ratio (simplified) - using standard deviation of only losing trades
    const lossesSquared = losingTrades.map(t => t.profitLoss ** 2);
    const avgLossSquared = lossesSquared.length > 0 ? lossesSquared.reduce((sum, val) => sum + val, 0) / lossesSquared.length : 0;
    const downDev = Math.sqrt(avgLossSquared);
    const sortino = downDev !== 0 ? averageProfitLoss / downDev : 0;
    
    // Average risk reward (simplified, assuming 1:1 for now or calculated from trade data)
    const averageRiskRewardRatio = averageWinningTrade && averageLosingTrade 
      ? Math.abs(averageWinningTrade / averageLosingTrade) 
      : 0;
    
    return {
      totalProfitLoss,
      averageProfitLoss,
      averageWinningTrade,
      averageLosingTrade,
      totalTrades: processedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      largestProfit,
      largestLoss,
      averageHoldTime,
      averageWinningHoldTime,
      averageLosingHoldTime,
      riskRewardRatio: averageRiskRewardRatio,
      winRate,
      sortino,
      averageRiskRewardRatio,
    };
  }, [trades]);

  // Function to import trades from the API (placeholder for now)
  const importTradesFromApi = useCallback(async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      // This would be implemented to import from external APIs
      console.log('Import trades from API - not implemented yet');
    } catch (error) {
      console.error('Error importing trades from API:', error);
      if (error instanceof Error) {
        setImportError(error.message);
      } else {
        setImportError('An unknown error occurred while importing trades');
      }
    } finally {
      setIsImporting(false);
    }
  }, []);

  const addTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
    try {
      const apiTrade = convertInternalTradeToApi(trade);
      await apiAddTrade(apiTrade);
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  }, [apiAddTrade]);

  const updateTrade = useCallback(async (id: string, tradeData: Omit<Trade, 'id'>) => {
    try {
      const apiTrade = convertInternalTradeToApi(tradeData);
      await apiEditTrade(id, apiTrade);
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }, [apiEditTrade]);

  const deleteTrade = useCallback(async (id: string) => {
    try {
      await apiRemoveTrade(id);
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  }, [apiRemoveTrade]);

  const clearAllTrades = useCallback(async () => {
    try {
      // Delete all trades one by one
      for (const trade of trades) {
        await apiRemoveTrade(trade.id);
      }
    } catch (error) {
      console.error('Error clearing trades:', error);
      throw error;
    }
  }, [trades, apiRemoveTrade]);


  return (
    <TradeContext.Provider
      value={{
        trades,
        addTrade,
        updateTrade,
        deleteTrade,
        clearAllTrades,
        importTradesFromApi,
        isImporting,
        importError,
        stats,
        isLoading,
        error,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
} 