import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useLineSeries } from '../../../lib/dataService';
import { currencyShort, dateLabel } from '../../../lib/format';

const PLLine: React.FC = React.memo(() => {
  const data = useLineSeries(); // [{date:'YYYY-MM-DD', pnl:number}]
  
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(147, 148, 148, 0.1)" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickMargin={8}
            tickFormatter={(d) => {
              const date = new Date(d);
              const day = date.getDate();
              const year = date.getFullYear();
              return `${day}/${year}`;
            }}
            stroke="currentColor" 
            opacity={0.6}
            fontSize={12}
            dx={-5}
          />
          <YAxis 
            width={50}
            tickFormatter={(v) => currencyShort(v)}
            stroke="currentColor" 
            opacity={0.6}
            fontSize={12}
            dx={-5}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value as number;
                const isProfit = value >= 0;
                const color = isProfit ? '#22c55e' : '#ef4444';
                const displayValue = isProfit ? `+${currencyShort(value)}` : currencyShort(value);
                
                return (
                  <div 
                    className="px-4 py-3 rounded-xl border backdrop-blur-md"
                    style={{
                      background: 'rgba(11, 20, 42, 0.36)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="text-sm text-gray-300 mb-1">
                      {(() => {
                        const date = new Date(label);
                        const day = date.getDate();
                        const month = date.toLocaleDateString('en-US', { month: 'short' });
                        const year = date.getFullYear();
                        return `${day} ${month} ${year}`;
                      })()}
                    </div>
                    <div 
                      className="text-lg font-bold"
                      style={{ color }}
                    >
                      {displayValue}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      P/L
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="pnl" 
            stroke="#22c55e" 
            strokeWidth={2.5} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

PLLine.displayName = 'PLLine';

export default PLLine;
