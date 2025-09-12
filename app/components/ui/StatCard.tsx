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
  intent?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
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
      default:
        return 'hover:shadow-blue-500/20';
    }
  };

  return (
    <div className={`panel bg-[#1A1A1F] border-neutral-700/50 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${getBackgroundGlowColor()} cursor-pointer ${className}`}>
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
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-neutral-400 text-sm">{title}</p>
        {sublabel && (
          <p className="text-neutral-500 text-xs mt-1">{sublabel}</p>
        )}
        {change && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{getTrendText()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
