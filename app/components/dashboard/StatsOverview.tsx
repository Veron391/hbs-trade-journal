"use client";

import { useMemo } from 'react';
import { useTrades } from '../../context/TradeContext';
import { filterTradesByPeriod, TimePeriod } from '../dashboard/TimePeriodSelector';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, BarChart3, Percent } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { TradeType } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface StatsOverviewProps {
  selectedPeriod: TimePeriod;
  tradeType?: TradeType;
}

export default function StatsOverview({ selectedPeriod, tradeType }: StatsOverviewProps) {
  const { t } = useI18n();
  const { trades } = useTrades();

  // Filter trades based on selected period and calculate stats
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
        largestProfit: 0,
        largestLoss: 0,
        averageHoldTime: 0,
        riskRewardRatio: 0,
        winRate: 0,
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
    const averageHoldTime = totalHoldTime / processedTrades.length;
    
    // Calculate performance ratios
    // Use existing averageWinningTrade and averageLosingTrade for risk/reward ratio
    // Make sure to use absolute value for averageLosingTrade to avoid negative ratios
    const riskRewardRatio = averageWinningTrade && averageLosingTrade ? averageWinningTrade / Math.abs(averageLosingTrade) : 0;
    const winRate = processedTrades.length > 0 ? winningTrades.length / processedTrades.length : 0;
    
    return {
      totalProfitLoss,
      averageProfitLoss,
      averageWinningTrade,
      averageLosingTrade,
      totalTrades: processedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      largestProfit,
      largestLoss,
      averageHoldTime,
      riskRewardRatio,
      winRate,
    };
  }, [trades, selectedPeriod, tradeType]);

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

  let filteredTrades = filterTradesByPeriod(trades, selectedPeriod);
  
  // Filter by trade type if specified (not 'total')
  if (tradeType && tradeType !== 'total') {
    filteredTrades = filteredTrades.filter(trade => trade.type === tradeType);
  }

  if (filteredTrades.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1C1719] rounded-lg">
        <p className="text-gray-300">{t('noTradesFound')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white">{t('performanceCharts')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total P&L */}
        <div className="bg-[#1C1719] rounded-lg shadow p-6 transform-gpu transition-transform duration-200 hover:scale-[1.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('totalProfitLoss')}</p>
              <p className={`text-2xl font-bold ${filteredStats.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(filteredStats.totalProfitLoss)}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${filteredStats.totalProfitLoss >= 0 ? 'bg-green-900' : 'bg-red-900'}`}
              style={{
                boxShadow: filteredStats.totalProfitLoss >= 0
                  ? '0 0 8px 2px rgba(16, 185, 129, 0.3)'
                  : '0 0 8px 2px rgba(239, 68, 68, 0.3)'
              }}
            >
              <DollarSign 
                size={24} 
                className={`${filteredStats.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}
                style={{
                  filter: `drop-shadow(0 0 10px ${filteredStats.totalProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'})`
                }}
              />
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#1C1719] rounded-lg shadow p-6 transform-gpu transition-transform duration-200 hover:scale-[1.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('winRate')}</p>
              <p className="text-2xl font-bold text-primary">
                {formatPercent(filteredStats.winRate * 100)}
              </p>
            </div>
            <div
              className="p-3 rounded-full bg-blue-900"
              style={{ boxShadow: '0 0 8px 2px rgba(59, 130, 246, 0.3)' }}
            >
              <Percent 
                size={24} 
                className="text-primary"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))'
                }}
              />
            </div>
          </div>
        </div>

        {/* Risk/Reward Ratio */}
        <div className="bg-[#1C1719] rounded-lg shadow p-6 transform-gpu transition-transform duration-200 hover:scale-[1.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('riskRewardRatio')}</p>
              <p className="text-2xl font-bold text-primary">
                {filteredStats.riskRewardRatio.toFixed(2)}
              </p>
            </div>
            <div
              className="p-3 rounded-full bg-blue-900"
              style={{ boxShadow: '0 0 8px 2px rgba(59, 130, 246, 0.3)' }}
            >
              <BarChart3 
                size={24} 
                className="text-primary"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))'
                }}
              />
            </div>
          </div>
        </div>

        {/* Average Winning Trade */}
        <div className="bg-[#1C1719] rounded-lg shadow p-6 transform-gpu transition-transform duration-200 hover:scale-[1.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('avgWinningTrade')}</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(filteredStats.averageWinningTrade)}
              </p>
            </div>
            <div
              className="p-3 rounded-full bg-green-900"
              style={{ boxShadow: '0 0 8px 2px rgba(16, 185, 129, 0.3)' }}
            >
              <ArrowUpCircle 
                size={24} 
                className="text-success"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))'
                }}
              />
            </div>
          </div>
        </div>

        {/* Average Losing Trade */}
        <div className="bg-[#1C1719] rounded-lg shadow p-6 transform-gpu transition-transform duration-200 hover:scale-[1.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('avgLosingTrade')}</p>
              <p className="text-2xl font-bold text-danger">
                {formatCurrency(filteredStats.averageLosingTrade)}
              </p>
            </div>
            <div
              className="p-3 rounded-full bg-red-900"
              style={{ boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.3)' }}
            >
              <ArrowDownCircle 
                size={24} 
                className="text-danger"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))'
                }}
              />
            </div>
          </div>
        </div>

        {/* Average Hold Time */}
        <div className="bg-[#1C1719] rounded-lg shadow p-6 transform-gpu transition-transform duration-200 hover:scale-[1.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('avgHoldTime')}</p>
              <p className="text-2xl font-bold text-gray-100">
                {filteredStats.averageHoldTime.toFixed(1)} {t('days')}
              </p>
            </div>
            <div
              className="p-3 rounded-full bg-gray-700"
              style={{ boxShadow: '0 0 8px 2px rgba(156, 163, 175, 0.3)' }}
            >
              <Calendar 
                size={24} 
                className="text-gray-300"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(156, 163, 175, 0.6))'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 