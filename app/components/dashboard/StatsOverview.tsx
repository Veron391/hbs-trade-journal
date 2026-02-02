"use client";

import { useMemo } from 'react';
import { useTrades } from '../../context/TradeContext';
import { filterTradesByPeriod, TimePeriod } from '../dashboard/TimePeriodSelector';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, BarChart3, Target } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { TradeType } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { filterCompletedTrades } from '@/lib/utils/tradeUtils';
import StatCard from '../ui/StatCard';

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

    // Filter out pending trades - only calculate stats for completed trades
    filteredTrades = filterCompletedTrades(filteredTrades);

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
    }).format(Math.abs(value));
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
      <div className="text-center py-12 bg-[#101010] rounded-lg">
        <p className="text-gray-300">{t('noTradesFound')}</p>
      </div>
    );
  }

  // KPI cards: same UI/UX as admin dashboard — StatCard (panel bg, icon glow, hover scale + shadow)
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white">{t('statsSummary')}</h2>

      <div className="stats-kpi-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          title={t('totalProfitLoss')}
          value={formatCurrency(filteredStats.totalProfitLoss)}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          intent={filteredStats.totalProfitLoss >= 0 ? 'green' : 'red'}
          valueTone={filteredStats.totalProfitLoss >= 0 ? 'profit' : 'loss'}
        />
        <StatCard
          title={t('winRate')}
          value={formatPercent(filteredStats.winRate * 100)}
          icon={<Target className="h-6 w-6 text-white" />}
          intent="purple"
        />
        <StatCard
          title={t('riskRewardRatio')}
          value={filteredStats.riskRewardRatio.toFixed(2)}
          icon={<BarChart3 className="h-6 w-6 text-white" />}
          intent="blue"
        />
        <StatCard
          title={t('avgWinningTrade')}
          value={formatCurrency(filteredStats.averageWinningTrade)}
          icon={<ArrowUpCircle className="h-6 w-6 text-white" />}
          intent="green"
          valueTone="profit"
        />
        <StatCard
          title={t('avgLosingTrade')}
          value={formatCurrency(filteredStats.averageLosingTrade)}
          icon={<ArrowDownCircle className="h-6 w-6 text-white" />}
          intent="red"
          valueTone="loss"
        />
        <StatCard
          title={t('avgHoldTime')}
          value={`${filteredStats.averageHoldTime.toFixed(1)} ${t('days')}`}
          icon={<Calendar className="h-6 w-6 text-black" />}
          intent="lime"
        />
      </div>
    </div>
  );
} 