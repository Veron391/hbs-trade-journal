"use client";

import { useTrades } from '../../context/TradeContext';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { filterTradesByPeriod, TimePeriod } from '../dashboard/TimePeriodSelector';
import { TradeType } from '../../types';
import { filterCompletedTrades } from '@/lib/utils/tradeUtils';

interface CumulativePLChartNewProps {
  selectedPeriod: TimePeriod;
  tradeType?: TradeType;
}

export default function CumulativePLChartNew({ selectedPeriod, tradeType }: CumulativePLChartNewProps) {
  const { trades } = useTrades();

  if (trades.length === 0) {
    return null;
  }

  // Calculate cumulative P&L using filtered trades
  let filteredTrades = filterTradesByPeriod(trades, selectedPeriod);

  // Filter by trade type if specified (not 'total')
  if (tradeType && tradeType !== 'total') {
    filteredTrades = filteredTrades.filter(trade => trade.type === tradeType);
  }
  
  // Filter out pending trades - only show completed trades in chart
  filteredTrades = filterCompletedTrades(filteredTrades);
  const sortedTrades = [...filteredTrades].sort((a, b) => 
    new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );

  let cumulativePnL = 0;
  const chartData = sortedTrades.map((trade) => {
    // Calculate P&L based on trade direction
    const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
    const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
    const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
    
    const entryTotal = entryPrice * quantity;
    const exitTotal = exitPrice * quantity;
    
    let pnl = 0;
    if (trade.direction === 'long') {
      pnl = exitTotal - entryTotal;
    } else {
      // For short trades, profit is when exit price is lower than entry
      pnl = entryTotal - exitTotal;
    }
    
    cumulativePnL += pnl;
    
    const tashkentTimezone = 'Asia/Tashkent';
    const tradeDateInTashkent = toZonedTime(new Date(trade.exitDate), tashkentTimezone);
    
    return {
      date: trade.exitDate,
      cumPnL: cumulativePnL,
      pnl: pnl,
      volume: trade.quantity * trade.entryPrice, // Mock volume
      formattedDate: format(tradeDateInTashkent, 'MMM d'),
      fullDate: format(tradeDateInTashkent, 'MMM d, yyyy')
    };
  });

  // Format currency for Y-axis
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProfit = data.cumPnL >= 0;
      const pnlColor = isProfit ? '#22C55E' : '#EF4444';
      
      return (
        <div 
          className="rounded-xl border border-[#5e5e5e] shadow-[0_8px_24px_rgba(0,0,0,0.45)] p-3"
          style={{
            background: 'rgba(40, 40, 40, 0.75)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(94, 94, 94, 0.3)'
          }}
        >
          <div className="text-sm text-white mb-2">{data.fullDate}</div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Trade P/L</span>
            <span 
              className="font-bold"
              style={{ color: data.pnl >= 0 ? '#22C55E' : '#EF4444' }}
            >
              {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Cumulative P/L</span>
            <span 
              className="font-bold"
              style={{ color: pnlColor }}
            >
              {isProfit ? '+' : ''}{formatCurrency(data.cumPnL)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl p-4 bg-[#1C1719] relative overflow-hidden outline-none focus:outline-none">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #1C1719 0%, #1C1719 60%, #1C1719 100%)'
        }}
      />
      
      {/* SVG filters for glow effect */}
      <svg className="absolute inset-0 pointer-events-none" style={{ width: 0, height: 0 }}>
        <defs>
          <filter id="plGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feFlood floodColor="#22C55E" floodOpacity="0.35" result="flood"/>
            <feComposite in="flood" in2="coloredBlur" operator="in" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="plGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,197,94,0.22)" />
            <stop offset="60%" stopColor="rgba(34,197,94,0.08)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.00)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-100">Cumulative P&L</h3>
        </div>
        <div className="h-80 outline-none focus:outline-none" role="img" aria-label="Cumulative profit and loss chart" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 15, bottom: 20 }}
              style={{ outline: 'none' }}
            >
              <defs>
                <linearGradient id="plGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.22)" />
                  <stop offset="60%" stopColor="rgba(34,197,94,0.08)" />
                  <stop offset="100%" stopColor="rgba(34,197,94,0.00)" />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#322F30" 
                strokeOpacity={0.28}
                horizontal={true}
                vertical={false}
              />
              
              <XAxis 
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#E9E8E9', fontSize: 12 }}
                minTickGap={24}
              />
              
              <YAxis 
                tickFormatter={formatCurrency}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#E9E8E9', fontSize: 12 }}
                tickCount={6}
                width={40}
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#94A3B8', strokeWidth: 2, strokeOpacity: 0.4 }}
              />
              
              <Area
                type="monotone"
                dataKey="cumPnL"
                stroke="none"
                fill="url(#plGradient)"
                animationDuration={900}
                animationEasing="ease-out"
              />
              
              <Line
                type="monotone"
                dataKey="cumPnL"
                stroke="#22C55E"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, fill: '#22C55E' }}
                animationDuration={900}
                animationEasing="ease-out"
                filter="url(#plGlow)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
