'use client';

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TradesByDayProps {
  data: Array<{
    date: string;
    trades: number;
  }>;
}

const TradesByDay = memo(({ data }: TradesByDayProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTrades = (value: number) => {
    return value.toString();
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Trades by Day</h3>
        <p className="text-sm text-neutral-400">Daily trading activity over the last 30 days</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatTrades}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              labelFormatter={(value) => `Date: ${formatDate(value)}`}
              formatter={(value: number) => [value, 'Trades']}
            />
            <Line
              type="monotone"
              dataKey="trades"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

TradesByDay.displayName = 'TradesByDay';

export default TradesByDay;
