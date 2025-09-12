"use client";

import { useMemo } from 'react';
import { useTrades } from '../../context/TradeContext';
import { filterTradesByPeriod, TimePeriod } from './TimePeriodSelector';
import { differenceInDays } from 'date-fns';
import { TradeType } from '../../types';

interface DetailedStatsProps {
  selectedPeriod: TimePeriod;
  tradeType?: TradeType;
}

export default function DetailedStats({ selectedPeriod, tradeType }: DetailedStatsProps) {
  const { trades } = useTrades();

  // Filter trades based on selected period and calculate detailed stats
  const filteredStats = useMemo(() => {
    let filteredTrades = filterTradesByPeriod(trades, selectedPeriod);
    
    // Filter by trade type if specified (not 'total')
    if (tradeType && tradeType !== 'total') {
      filteredTrades = filteredTrades.filter(trade => trade.type === tradeType);
    }
    
    if (filteredTrades.length === 0) {
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
        profitFactor: 0,
        winRate: 0,
        sortino: 0,
        averageRiskRewardRatio: 0,
        sharpeRatio: 0,
      };
    }

    // Process each trade and categorize them
    const processedTrades = filteredTrades.map(trade => {
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      
      const entryTotal = entryPrice * quantity;
      const exitTotal = exitPrice * quantity;
      
      let profitLoss = 0;
      if (trade.direction === 'long') {
        profitLoss = exitTotal - entryTotal;
      } else {
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
        isWinner: profitLoss > 0.01,
        isLoser: profitLoss < -0.01,
        isBreakEven: Math.abs(profitLoss) <= 0.01,
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
    
    // Sortino Ratio (simplified)
    const lossesSquared = losingTrades.map(t => t.profitLoss ** 2);
    const avgLossSquared = lossesSquared.length > 0 ? lossesSquared.reduce((sum, val) => sum + val, 0) / lossesSquared.length : 0;
    const downDev = Math.sqrt(avgLossSquared);
    const sortino = downDev !== 0 ? averageProfitLoss / downDev : 0;
    
    // Average risk reward
    const averageRiskRewardRatio = averageWinningTrade && averageLosingTrade 
      ? Math.abs(averageWinningTrade / averageLosingTrade) 
      : 0;
    
    // Sharpe Ratio calculation
    const returns = processedTrades.map(t => {
      const entryPrice = typeof t.entryPrice === 'number' ? t.entryPrice : parseFloat(String(t.entryPrice)) || 0;
      const quantity = typeof t.quantity === 'number' ? t.quantity : parseFloat(String(t.quantity)) || 0;
      const entryTotal = entryPrice * quantity;
      return entryTotal > 0 ? t.profitLoss / entryTotal : 0; // Return as percentage
    });
    
    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const returnVariance = returns.length > 1 
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
      : 0;
    const returnStdDev = Math.sqrt(returnVariance);
    
    // Assuming risk-free rate of 3% annually (0.03), convert to trade-level
    const riskFreeRate = 0.03 / 252; // Daily risk-free rate (252 trading days per year)
    const sharpeRatio = returnStdDev !== 0 ? (avgReturn - riskFreeRate) / returnStdDev : 0;
    
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
      profitFactor,
      winRate,
      sortino,
      averageRiskRewardRatio,
      sharpeRatio,
    };
  }, [trades, selectedPeriod, tradeType]);

  let filteredTrades = filterTradesByPeriod(trades, selectedPeriod);
  
  // Filter by trade type if specified (not 'total')
  if (tradeType && tradeType !== 'total') {
    filteredTrades = filteredTrades.filter(trade => trade.type === tradeType);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const StatItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="py-3 border-b border-[#F3E9DC]/20">
      <div className="flex justify-between">
        <span className="text-white/70">{label}</span>
        <span className="font-medium text-[#F0E4D3]">{value}</span>
      </div>
    </div>
  );

  if (filteredTrades.length === 0) {
    return (
      <div className="bg-[#1C1719] shadow rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-6 text-[#F0E4D3]">Detailed Statistics</h2>
        <div className="text-center py-12">
          <p className="text-gray-300">No trades found for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1C1719] shadow rounded-lg p-6 mt-8">
      <h2 className="text-xl font-semibold mb-6 text-[#F0E4D3]">Detailed Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium mb-4 text-[#F0E4D3]">Profitability</h3>
          <div className="space-y-1">
            <StatItem 
              label="Total Profit/Loss" 
              value={formatCurrency(filteredStats.totalProfitLoss)} 
            />
            <StatItem 
              label="Average Profit/Loss" 
              value={formatCurrency(filteredStats.averageProfitLoss)} 
            />
            <StatItem 
              label="Average Winning Trade" 
              value={formatCurrency(filteredStats.averageWinningTrade)} 
            />
            <StatItem 
              label="Average Losing Trade" 
              value={formatCurrency(filteredStats.averageLosingTrade)} 
            />
            <StatItem 
              label="Largest Profit" 
              value={formatCurrency(filteredStats.largestProfit)} 
            />
            <StatItem 
              label="Largest Loss" 
              value={formatCurrency(filteredStats.largestLoss)} 
            />
            <StatItem 
              label="Profit Factor" 
              value={filteredStats.profitFactor.toFixed(2)} 
            />
            <StatItem 
              label="Win Rate" 
              value={formatPercent(filteredStats.winRate * 100)} 
            />
            <StatItem 
              label="Sortino Ratio" 
              value={filteredStats.sortino.toFixed(2)} 
            />
            <StatItem 
              label="Sharpe Ratio" 
              value={filteredStats.sharpeRatio.toFixed(2)} 
            />
            <StatItem 
              label="Average Risk/Reward Ratio" 
              value={filteredStats.averageRiskRewardRatio.toFixed(2)} 
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 text-[#F0E4D3]">Trade Analysis</h3>
          <div className="space-y-1">
            <StatItem 
              label="Total Trades" 
              value={filteredStats.totalTrades} 
            />
            <StatItem 
              label="Winning Trades" 
              value={filteredStats.winningTrades} 
            />
            <StatItem 
              label="Losing Trades" 
              value={filteredStats.losingTrades} 
            />
            <StatItem 
              label="Break Even Trades" 
              value={filteredStats.breakEvenTrades} 
            />
            <StatItem 
              label="Max Consecutive Wins" 
              value={filteredStats.maxConsecutiveWins} 
            />
            <StatItem 
              label="Max Consecutive Losses" 
              value={filteredStats.maxConsecutiveLosses} 
            />
            <StatItem 
              label="Average Hold Time (All)" 
              value={`${filteredStats.averageHoldTime.toFixed(1)} days`} 
            />
            <StatItem 
              label="Average Hold Time (Winners)" 
              value={`${filteredStats.averageWinningHoldTime.toFixed(1)} days`} 
            />
            <StatItem 
              label="Average Hold Time (Losers)" 
              value={`${filteredStats.averageLosingHoldTime.toFixed(1)} days`} 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 