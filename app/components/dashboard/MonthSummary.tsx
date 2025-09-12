"use client";

import { useMemo } from 'react';
import { useTrades } from '../../../lib/hooks/useTrades';
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

interface MonthSummaryProps {
  currentMonth: Date;
}

export default function MonthSummary({ currentMonth }: MonthSummaryProps) {
  const { trades: dbTrades, isLoading, error } = useTrades();
  
  // Convert database trades to frontend format
  const trades = useMemo(() => {
    return dbTrades.map(dbTrade => {
      const occurredAt = typeof dbTrade.occurredAt === 'string' 
        ? new Date(dbTrade.occurredAt) 
        : dbTrade.occurredAt;
      
      const dateString = occurredAt.toISOString().split('T')[0];
      
      return {
        id: dbTrade.id,
        type: dbTrade.assetType as 'stock' | 'crypto',
        symbol: dbTrade.symbol,
        direction: dbTrade.side === 'buy' ? 'long' : 'short',
        entryDate: dateString,
        exitDate: dateString,
        entryPrice: dbTrade.price * 0.95, // Mock entry price
        exitPrice: dbTrade.price,
        quantity: dbTrade.qty,
        setupNotes: '',
        mistakesNotes: '',
        tags: [],
        link: undefined,
      };
    });
  }, [dbTrades]);
  
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Filter trades for the current month based on exit date
    const monthTrades = trades.filter(trade => {
      const exitDate = new Date(trade.exitDate);
      return isWithinInterval(exitDate, { start: monthStart, end: monthEnd });
    });
    
    let totalPnL = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakEvenCount = 0;
    
    // Calculate stats for the month
    monthTrades.forEach(trade => {
      const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
      const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      
      const entryValue = entryPrice * quantity;
      const exitValue = exitPrice * quantity;
      
      let pnl = 0;
      if (trade.direction === 'long') {
        pnl = exitValue - entryValue;
      } else {
        pnl = entryValue - exitValue;
      }
      
      totalPnL += pnl;
      
      if (pnl > 0) {
        winCount++;
      } else if (pnl < 0) {
        lossCount++;
      } else {
        breakEvenCount++;
      }
    });
    
    const winRate = monthTrades.length > 0 ? (winCount / monthTrades.length) * 100 : 0;
    
    return {
      totalTrades: monthTrades.length,
      totalPnL,
      winCount,
      lossCount,
      breakEvenCount,
      winRate
    };
  }, [trades, currentMonth]);
  
  // Format currency with dollar sign and two decimal places
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}$${absValue.toFixed(2)}`;
  };
  
  return (
    <div className="bg-[#1C1719] rounded-lg shadow p-6 mb-4">
      <h2 className="text-xl font-semibold text-white mb-4">
        {format(currentMonth, 'MMMM yyyy')} Summary
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1C1719] p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total Trades</div>
          <div className="text-white text-xl font-bold">{monthStats.totalTrades}</div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total P/L</div>
          <div className={`text-xl font-bold ${monthStats.totalPnL > 0 ? 'text-success' : monthStats.totalPnL < 0 ? 'text-danger' : 'text-gray-300'}`}>
            {formatCurrency(monthStats.totalPnL)}
          </div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Win Rate</div>
          <div className="text-white text-xl font-bold">
            {monthStats.winRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Winning Trades</div>
          <div className="text-success text-xl font-bold">
            {monthStats.winCount}
          </div>
        </div>
        
        <div className="bg-[#1C1719] p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Losing Trades</div>
          <div className="text-danger text-xl font-bold">
            {monthStats.lossCount}
          </div>
        </div>
      </div>
    </div>
  );
} 