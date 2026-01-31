"use client";

import { useState, useEffect, useRef } from 'react';
import { usePeriod, useTradeType, useCustomStartDate, useCustomEndDate, useFilterStore } from '../../../lib/filters';
import { Period, TradeType } from '../../../lib/filters';
import { ChevronDown, Calendar } from 'lucide-react';

const periodOptions = [
  { value: 'allStats' as Period, label: 'All Time' },
  { value: 'oneWeek' as Period, label: '1 Week' },
  { value: 'thisMonth' as Period, label: 'This Month' },
  { value: 'lastMonth' as Period, label: 'Last Month' },
  { value: 'last90Days' as Period, label: 'Last 90 Days' },
  { value: 'custom' as Period, label: 'Custom Range' },
];


const tradeTypeOptions = [
  { value: null as TradeType, label: 'All Types' },
  { value: 'crypto' as TradeType, label: 'Crypto' },
  { value: 'stock' as TradeType, label: 'Stock' },
];

export default function PeriodAndCategoryBar() {
  const period = usePeriod();
  const tradeType = useTradeType();
  const customStartDate = useCustomStartDate();
  const customEndDate = useCustomEndDate();
  const { setPeriod, setTradeType, setCustomDates } = useFilterStore();
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPeriod = periodOptions.find(option => option.value === period);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-4 py-3">
      {/* First Row: Period and Trade Type */}
      <div className="flex items-center justify-between gap-3">
        {/* Period Custom Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
            className="flex items-center justify-between gap-2 bg-[#171717] border border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm hover:bg-[#D9FE43]/10 hover:border-blue-500/50 transition-colors min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            aria-expanded={isPeriodDropdownOpen}
            aria-haspopup="listbox"
            aria-label="Select time period"
          >
            <span>{selectedPeriod?.label || 'This Month'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ml-2 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPeriodDropdownOpen && (
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-blue-900/5 backdrop-blur-md border border-blue-500/30 rounded-lg shadow-2xl z-50 min-w-[160px]"
              style={{
                background: 'rgba(30, 58, 138, 0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
              role="listbox"
              aria-label="Time period options"
            >
              {periodOptions.map((option) => {
                const isSelected = period === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPeriod(option.value);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors focus:outline-none focus:bg-blue-900/30 ${isSelected
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                      : 'text-white hover:bg-blue-900/30'
                      }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Trade Type Filter */}
        <div className="flex items-center gap-1 bg-[#171717] border border-blue-500/30 rounded-full p-1" role="group" aria-label="Trade type selection">
          {tradeTypeOptions.map((option) => {
            const isActive = tradeType === option.value;
            return (
              <button
                key={option.value || 'all'}
                onClick={() => setTradeType(option.value)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-full transition-all duration-200
                  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none
                  ${isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-blue-900/30'
                  }
                `}
                aria-pressed={isActive}
                aria-label={`Filter by ${option.label} trades`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Picker */}
      {period === 'custom' && (
        <div className="flex items-center gap-3 bg-[#171717] border border-blue-500/30 rounded-lg p-3">
          <Calendar className="h-4 w-4 text-blue-400" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate || ''}
              onChange={(e) => {
                setCustomDates(e.target.value, customEndDate);
                // Automatically apply filter when both dates are set
                if (e.target.value && customEndDate) {
                  setPeriod('custom');
                }
              }}
              className="bg-[#0f0f12] border border-neutral-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customEndDate || ''}
              onChange={(e) => {
                setCustomDates(customStartDate, e.target.value);
                // Automatically apply filter when both dates are set
                if (customStartDate && e.target.value) {
                  setPeriod('custom');
                }
              }}
              className="bg-[#0f0f12] border border-neutral-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>
        </div>
      )}

    </div>
  );
}
