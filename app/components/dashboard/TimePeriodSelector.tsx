"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { startOfMonth, startOfYear, subDays, isAfter, isEqual, startOfDay, endOfMonth, subMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type TimePeriod = 'all-time' | 'last-7-days' | 'this-month' | 'last-month' | 'last-90-days' | 'year-to-date';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const TIMEZONE = 'Asia/Tashkent'; // UTC+5

const periodLabels: Record<TimePeriod, string> = {
  'all-time': 'All Time',
  'last-7-days': '1 Week',
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'last-90-days': 'Last 90 Days',
  'year-to-date': 'Year to Date'
};

export function getDateRangeForPeriod(period: TimePeriod): { startDate: Date; endDate: Date } {
  const now = toZonedTime(new Date(), TIMEZONE);
  const today = startOfDay(now);

  switch (period) {
    case 'all-time':
      return {
        startDate: new Date('2020-01-01'), // Far past date to include all trades
        endDate: today
      };
    case 'last-7-days':
      return {
        startDate: subDays(today, 7),
        endDate: today
      };
    case 'this-month':
      return {
        startDate: startOfMonth(now),
        endDate: today
      };
    case 'last-month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    case 'last-90-days':
      return {
        startDate: subDays(today, 90),
        endDate: today
      };
    case 'year-to-date':
      return {
        startDate: startOfYear(now),
        endDate: today
      };
    default:
      return {
        startDate: new Date('2020-01-01'), // Default to all time
        endDate: today
      };
  }
}

export function filterTradesByPeriod<T extends { exitDate: string }>(trades: T[], period: TimePeriod): T[] {
  const { startDate, endDate } = getDateRangeForPeriod(period);
  
  return trades.filter(trade => {
    const tradeDate = startOfDay(new Date(trade.exitDate));
    return (isAfter(tradeDate, startDate) || isEqual(tradeDate, startDate)) && 
           (isAfter(endDate, tradeDate) || isEqual(endDate, tradeDate));
  });
}

export default function TimePeriodSelector({ selectedPeriod, onPeriodChange }: TimePeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePeriodSelect = (period: TimePeriod) => {
    onPeriodChange(period);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1C1719] border border-white/20 rounded-lg text-white hover:bg-[#2A2426] transition-colors duration-200 min-w-[200px] justify-between"
      >
        <span className="text-sm">{periodLabels[selectedPeriod]}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#1C1719]/80 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50 overflow-hidden">
          {(Object.entries(periodLabels) as [TimePeriod, string][]).map(([period, label], index, array) => (
            <div key={period}>
              <button
                onClick={() => handlePeriodSelect(period)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors duration-150 ${
                  selectedPeriod === period 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
              {index < array.length - 1 && (
                <div className="border-b border-white/8" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
