"use client";

import { useEffect, useMemo, useState } from 'react';
import { useTrades } from '../../context/TradeContext';
import { format } from 'date-fns';
import { useI18n } from '../../context/I18nContext';

interface MonthSummaryProps {
  currentMonth: Date;
}

export default function MonthSummary({ currentMonth }: MonthSummaryProps) {
  const { t } = useI18n();
  const [monthStats, setMonthStats] = useState({
    totalTrades: 0,
    totalPnL: 0,
    winCount: 0,
    lossCount: 0,
    breakEvenCount: 0,
    winRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1; // 1-12
    setIsLoading(true);
    const load = async () => {
      try {
        const res = await fetch(`/api/journal/trades/calendar?year=${year}&month=${month}&t=${Date.now()}`, { 
          cache: 'no-store'
        });
        if (!res.ok) {
          setMonthStats({
            totalTrades: 0,
            totalPnL: 0,
            winCount: 0,
            lossCount: 0,
            breakEvenCount: 0,
            winRate: 0,
          });
          return;
        }
        const data = await res.json();
        const summary = data.summary || { total_trades: 0, total_pnl: 0, win_rate: 0, winning_trades: 0, losing_trades: 0 };
        setMonthStats({
          totalTrades: summary.total_trades || 0,
          totalPnL: Number(summary.total_pnl) || 0,
          winCount: summary.winning_trades || 0,
          lossCount: summary.losing_trades || 0,
          breakEvenCount: Math.max(0, (summary.total_trades || 0) - (summary.winning_trades || 0) - (summary.losing_trades || 0)),
          winRate: Number(summary.win_rate) || 0,
        });
      } catch {
        setMonthStats({
          totalTrades: 0,
          totalPnL: 0,
          winCount: 0,
          lossCount: 0,
          breakEvenCount: 0,
          winRate: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentMonth]);
  
  // Format currency with dollar sign and two decimal places
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}$${absValue.toFixed(2)}`;
  };

  // Get month name in current language
  const getMonthName = (date: Date) => {
    const monthIndex = date.getMonth();
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(monthNames[monthIndex]);
  };
  
  return (
    <div className="bg-[#1C1719] rounded-lg shadow p-6 mb-4">
      <h2 className="text-xl font-semibold text-white mb-4">
        {getMonthName(currentMonth)} {currentMonth.getFullYear()} {t('tradingStatistics').toLowerCase()}
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-3 text-gray-400">{t('loadingSummary')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 justify-center">
        <div className="bg-[#1C1719] p-4 rounded-lg text-center">
          <div className="text-gray-400 text-sm">{t('totalTrades')}</div>
          <div className="text-white text-xl font-bold">{monthStats.totalTrades}</div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg text-center">
          <div className="text-gray-400 text-sm">{t('totalPL')}</div>
          <div className={`text-xl font-bold ${monthStats.totalPnL > 0 ? 'text-success' : monthStats.totalPnL < 0 ? 'text-danger' : 'text-gray-300'}`}>
            {formatCurrency(monthStats.totalPnL)}
          </div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg text-center">
          <div className="text-gray-400 text-sm">{t('winRate')}</div>
          <div className="text-white text-xl font-bold">
            {monthStats.winRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg text-center">
          <div className="text-gray-400 text-sm">{t('winningTrades')}</div>
          <div className="text-success text-xl font-bold">
            {monthStats.winCount}
          </div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg text-center">
          <div className="text-gray-400 text-sm">{t('losingTrades')}</div>
          <div className="text-danger text-xl font-bold">
            {monthStats.lossCount}
          </div>
        </div>
      </div>
      )}
    </div>
  );
} 