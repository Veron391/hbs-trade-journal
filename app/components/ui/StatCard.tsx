"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  sublabel?: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: ReactNode;
  intent?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray' | 'lime';
  /** P/L qiymat matn rangi: foyda = yashil, zarar = qizil */
  valueTone?: 'profit' | 'loss' | 'neutral';
  className?: string;
}

export default function StatCard({
  title,
  value,
  sublabel,
  change,
  trend = 'stable',
  icon,
  intent = 'blue',
  valueTone = 'neutral',
  className = ''
}: StatCardProps) {
  const getIntentColor = () => {
    switch (intent) {
      case 'blue':
        return 'bg-blue-600';
      case 'green':
        return 'bg-green-600';
      case 'purple':
        return 'bg-purple-600';
      case 'orange':
        return 'bg-orange-600';
      case 'red':
        return 'bg-red-600';
      case 'gray':
        return 'bg-neutral-600';
      case 'lime':
        return 'bg-[#D9FE43]';
      default:
        return 'bg-blue-600';
    }
  };

  const getGlowColor = () => {
    switch (intent) {
      case 'blue':
        return 'shadow-blue-500/50';
      case 'green':
        return 'shadow-green-500/50';
      case 'purple':
        return 'shadow-purple-500/50';
      case 'orange':
        return 'shadow-orange-500/50';
      case 'red':
        return 'shadow-red-500/50';
      case 'gray':
        return 'shadow-neutral-500/50';
      case 'lime':
        return 'shadow-[#D9FE43]/50';
      default:
        return 'shadow-blue-500/50';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'up':
        return 'Trending up';
      case 'down':
        return 'Trending down';
      default:
        return 'Stable';
    }
  };

  const getBackgroundGlowColor = () => {
    switch (intent) {
      case 'blue':
        return 'hover:shadow-blue-500/20';
      case 'green':
        return 'hover:shadow-green-500/20';
      case 'purple':
        return 'hover:shadow-purple-500/20';
      case 'orange':
        return 'hover:shadow-orange-500/20';
      case 'red':
        return 'hover:shadow-red-500/20';
      case 'gray':
        return 'hover:shadow-neutral-500/20';
      case 'lime':
        return 'hover:shadow-[#D9FE43]/20';
      default:
        return 'hover:shadow-blue-500/20';
    }
  };

  // Ichki gradient: o'ng pastdan chap tepaga, intent rangi 13% opacity
  const getGradientBackground = () => {
    const opacity = 0.13;
    switch (intent) {
      case 'blue':
        return `linear-gradient(to top left, rgba(59, 130, 246, ${opacity}), transparent 55%)`;
      case 'green':
        return `linear-gradient(to top left, rgba(34, 197, 94, ${opacity}), transparent 55%)`;
      case 'purple':
        return `linear-gradient(to top left, rgba(139, 92, 246, ${opacity}), transparent 55%)`;
      case 'orange':
        return `linear-gradient(to top left, rgba(249, 115, 22, ${opacity}), transparent 55%)`;
      case 'red':
        return `linear-gradient(to top left, rgba(239, 68, 68, ${opacity}), transparent 55%)`;
      case 'gray':
        return `linear-gradient(to top left, rgba(115, 115, 115, ${opacity}), transparent 55%)`;
      case 'lime':
        return `linear-gradient(to top left, rgba(217, 254, 67, ${opacity}), transparent 55%)`;
      default:
        return `linear-gradient(to top left, rgba(59, 130, 246, ${opacity}), transparent 55%)`;
    }
  };

  const valueColorClass =
    valueTone === 'profit'
      ? 'text-green-400'
      : valueTone === 'loss'
        ? 'text-red-400'
        : 'text-white';

  return (
    <div
      className={`stat-card-border relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${getBackgroundGlowColor()} cursor-pointer ${className}`}
      style={{ backgroundColor: 'rgba(19, 19, 19, 0.3)' }}
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: getGradientBackground() }}
        aria-hidden
      />
      <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={`p-3 rounded-xl ${getIntentColor()} shadow-lg ${getGlowColor()} transition-all duration-300 hover:shadow-xl`}>
            {icon}
          </div>
        )}
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className={`text-2xl font-bold mb-1 ${valueColorClass}`}>{value}</h3>
        {sublabel ? (
          <>
            <p className="text-neutral-400 text-sm font-normal">{title}</p>
            <p className="text-neutral-500 text-xs mt-1">{sublabel}</p>
          </>
        ) : (
          <p className="text-neutral-500 text-xs mt-3 font-normal">{title}</p>
        )}
        {change && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{getTrendText()}</span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
