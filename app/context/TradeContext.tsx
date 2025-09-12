"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Trade, TradeStats } from '../types';
import { differenceInDays } from 'date-fns';
import { fetchTradesFromApi } from '../services/tradeApiService';
import { useAuth } from './AuthContext';

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
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [stats, setStats] = useState<TradeStats>({
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
    profitFactor: 0,
    winRate: 0,
    sortino: 0,
    averageRiskRewardRatio: 0,
  });

  // Check if localStorage is available
  useEffect(() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      setStorageAvailable(true);
    } catch (e) {
      console.error('localStorage is not available:', e);
      setStorageAvailable(false);
    }
  }, []);

  // Load trades from localStorage on initial load
  useEffect(() => {
    if (!storageAvailable || !user) {
      setTrades([]);
      return;
    }

    try {
      const tradesKey = `trades_${user.id}`;
      const savedTrades = localStorage.getItem(tradesKey);

      if (savedTrades) {
        const parsedTrades = JSON.parse(savedTrades);
        if (Array.isArray(parsedTrades) && parsedTrades.length > 0) {
          setTrades(parsedTrades);
        } else {
          setTrades([]);
        }
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error('Error loading trades from localStorage:', error);
      setTrades([]);
    }
  }, [storageAvailable, user]);

  // Save trades to localStorage whenever they change
  useEffect(() => {
    if (!storageAvailable || !user) {
      calculateStats();
      return;
    }
    
    try {
      const tradesKey = `trades_${user.id}`;
      if (trades.length > 0) {
        console.log('Saving trades to localStorage:', trades.length, 'trades for user', user.id);
        localStorage.setItem(tradesKey, JSON.stringify(trades));
      } else {
        // Clear localStorage if no trades
        localStorage.removeItem(tradesKey);
      }
    } catch (error) {
      console.error('Error saving trades to localStorage:', error);
    }
    
    calculateStats();
  }, [trades, storageAvailable, user]);

  // Function to import trades from the API
  const importTradesFromApi = useCallback(async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const apiTrades = await fetchTradesFromApi();
      
      // Merge new trades with existing ones, avoiding duplicates by checking symbol and dates
      setTrades(prevTrades => {
        const newTrades = [...prevTrades];
        
        // Simple duplicate check based on symbol, entry date, and exit date
        apiTrades.forEach(apiTrade => {
          const isDuplicate = prevTrades.some(
            existingTrade => 
              existingTrade.symbol === apiTrade.symbol && 
              existingTrade.entryDate === apiTrade.entryDate &&
              existingTrade.exitDate === apiTrade.exitDate &&
              existingTrade.entryPrice === apiTrade.entryPrice &&
              existingTrade.exitPrice === apiTrade.exitPrice
          );
          
          if (!isDuplicate) {
            newTrades.push(apiTrade);
          }
        });
        
        return newTrades;
      });
      
      console.log('Imported trades from API');
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

  const addTrade = useCallback((trade: Omit<Trade, 'id'>) => {
    if (!user) {
      console.error('Cannot add trade: user not authenticated');
      return;
    }

    // Ensure numerical values are properly typed
    const sanitizedTrade = {
      ...trade,
      userId: user.id, // Add user ID to trade
      entryPrice: typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0,
      exitPrice: typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0,
      quantity: typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0,
      id: Math.random().toString(36).substr(2, 9),
    };

    setTrades(prevTrades => {
      const newTrades = [...prevTrades, sanitizedTrade];

      // Force save to localStorage immediately
      if (storageAvailable) {
        try {
          const tradesKey = `trades_${user.id}`;
          localStorage.setItem(tradesKey, JSON.stringify(newTrades));
        } catch (error) {
          console.error('Error saving trades:', error);
        }
      }
      return newTrades;
    });
  }, [storageAvailable, user]);

  const updateTrade = useCallback((id: string, tradeData: Omit<Trade, 'id'>) => {
    if (!user) {
      console.error('Cannot update trade: user not authenticated');
      return;
    }

    // Ensure numerical values are properly typed
    const sanitizedTrade = {
      ...tradeData,
      userId: user.id, // Ensure user ID is set
      entryPrice: typeof tradeData.entryPrice === 'number' ? tradeData.entryPrice : parseFloat(String(tradeData.entryPrice)) || 0,
      exitPrice: typeof tradeData.exitPrice === 'number' ? tradeData.exitPrice : parseFloat(String(tradeData.exitPrice)) || 0,
      quantity: typeof tradeData.quantity === 'number' ? tradeData.quantity : parseFloat(String(tradeData.quantity)) || 0,
    };
    
    console.log('Updating trade:', id, sanitizedTrade);
    setTrades(prevTrades => {
      const updatedTrades = prevTrades.map((trade) => 
        (trade.id === id ? { ...sanitizedTrade, id } : trade)
      );
      
      // Force save to localStorage immediately
      if (storageAvailable) {
        try {
          const tradesKey = `trades_${user.id}`;
          localStorage.setItem(tradesKey, JSON.stringify(updatedTrades));
          console.log('Saved trades after update:', updatedTrades);
        } catch (error) {
          console.error('Error saving trades after update:', error);
        }
      }
      
      return updatedTrades;
    });
  }, [storageAvailable, user]);

  const deleteTrade = useCallback((id: string) => {
    if (!user) {
      console.error('Cannot delete trade: user not authenticated');
      return;
    }

    console.log('Deleting trade:', id);
    setTrades(prevTrades => {
      const filteredTrades = prevTrades.filter((trade) => trade.id !== id);
      
      // Force save to localStorage immediately
      if (storageAvailable) {
        try {
          const tradesKey = `trades_${user.id}`;
          localStorage.setItem(tradesKey, JSON.stringify(filteredTrades));
          console.log('Saved trades after delete, remaining:', filteredTrades);
        } catch (error) {
          console.error('Error saving trades after delete:', error);
        }
      }
      
      return filteredTrades;
    });
  }, [storageAvailable, user]);

  const clearAllTrades = useCallback(() => {
    if (!user) {
      console.error('Cannot clear trades: user not authenticated');
      return;
    }

    console.log('Clearing all trades');
    setTrades(() => {
      if (storageAvailable) {
        try {
          const tradesKey = `trades_${user.id}`;
          localStorage.removeItem(tradesKey);
          localStorage.removeItem(`hasAddedSamples_${user.id}`);
          console.log('Removed all trades from localStorage for user', user.id);
        } catch (error) {
          console.error('Error clearing trades from localStorage:', error);
        }
      }
      return [] as Trade[];
    });
  }, [storageAvailable, user]);

  const calculateStats = useCallback(() => {
    if (trades.length === 0) {
      setStats({
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
        profitFactor: 0,
        winRate: 0,
        sortino: 0,
        averageRiskRewardRatio: 0,
      });
      return;
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
      
      const holdTime = differenceInDays(
        new Date(trade.exitDate),
        new Date(trade.entryDate)
      );
      
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
    
    const sortedTrades = [...processedTrades].sort((a, b) => 
      new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
    );
    
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
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount;
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
    
    setStats({
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
      profitFactor,
      winRate,
      sortino,
      averageRiskRewardRatio,
    });
  }, [trades]);

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