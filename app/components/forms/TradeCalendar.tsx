"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTrades } from '../../../lib/hooks/useTrades';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isToday, isSameMonth, setYear, setMonth, setDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X, TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import MonthSummary from '../dashboard/MonthSummary';

export default function TradeCalendar() {
  const { trades: dbTrades, isLoading, error } = useTrades();
  
  // Convert database trades to frontend format
  const trades = useMemo(() => {
    return dbTrades.map(dbTrade => {
      const occurredAt = typeof dbTrade.occurredAt === 'string' 
        ? new Date(dbTrade.occurredAt) 
        : dbTrade.occurredAt;
        
      const entryDate = dbTrade.entryDate 
        ? (typeof dbTrade.entryDate === 'string' 
            ? new Date(dbTrade.entryDate) 
            : dbTrade.entryDate)
        : occurredAt; // Fallback to occurredAt if entryDate is not available
        
      const exitDate = dbTrade.exitDate 
        ? (typeof dbTrade.exitDate === 'string' 
            ? new Date(dbTrade.exitDate) 
            : dbTrade.exitDate)
        : occurredAt; // Fallback to occurredAt if exitDate is not available
      
      // Format dates as YYYY-MM-DD using local timezone to avoid timezone issues
      const formatDate = (date: Date) => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      return {
        id: dbTrade.id,
        type: dbTrade.assetType as 'stock' | 'crypto',
        symbol: dbTrade.symbol,
        direction: dbTrade.side === 'buy' ? 'long' : 'short',
        entryDate: formatDate(entryDate),
        exitDate: formatDate(exitDate),
        entryPrice: dbTrade.entryPrice ? parseFloat(String(dbTrade.entryPrice)) : 0,
        exitPrice: dbTrade.exitPrice ? parseFloat(String(dbTrade.exitPrice)) : parseFloat(String(dbTrade.price)),
        quantity: dbTrade.qty,
        setupNotes: dbTrade.setupNotes || '',
        mistakesNotes: dbTrade.mistakesNotes || '',
        tags: dbTrade.tags ? dbTrade.tags.split(', ').filter(tag => tag.trim()) : [],
        link: dbTrade.link || undefined,
      };
    });
  }, [dbTrades]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Calculate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Compute start day with Monday as the first day of the week (Mon=0 ... Sun=6)
  const startDay = (getDay(monthStart) + 6) % 7;

  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Go to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Handle date picker outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply selected date
  const applySelectedDate = () => {
    const newDate = setDate(setMonth(setYear(new Date(), selectedYear), selectedMonth), selectedDay);
    setCurrentMonth(newDate);
    setShowDatePicker(false);
  };

  // Handle day click to show trade details
  const handleDayClick = (dateKey: string, event: React.MouseEvent) => {
    const dayData = tradesByDate.get(dateKey);
    if (dayData && dayData.trades.length > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate position considering scroll and viewport
      let yPosition = rect.bottom + scrollY + 10;
      let xPosition = rect.left + rect.width / 2;
      
      // Estimate dropdown height based on number of trades
      const estimatedDropdownHeight = Math.min(500, 200 + (dayData.trades.length * 80));
      
      // If the dropdown would go off screen at bottom, position it above the day cell
      if (yPosition + estimatedDropdownHeight > scrollY + viewportHeight) {
        yPosition = rect.top + scrollY - estimatedDropdownHeight - 10;
      }
      
      // Ensure dropdown stays within viewport horizontally
      const dropdownWidth = 400; // Approximate dropdown width
      if (xPosition - dropdownWidth/2 < 10) {
        xPosition = dropdownWidth/2 + 10;
      } else if (xPosition + dropdownWidth/2 > viewportWidth - 10) {
        xPosition = viewportWidth - dropdownWidth/2 - 10;
      }
      
      setDropdownPosition({
        x: xPosition,
        y: yPosition
      });
      setSelectedDateForDetails(dateKey);
      setExpandedTrades(new Set()); // Reset expanded trades when opening new dropdown
      setIsDropdownVisible(false); // Start with hidden state
      
      // Trigger animation
      setTimeout(() => setIsDropdownVisible(true), 10);
    }
  };

  // Toggle trade expansion
  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  // Close dropdown with animation
  const closeDropdown = () => {
    setIsDropdownVisible(false);
    setTimeout(() => {
      setSelectedDateForDetails(null);
    }, 300); // Wait for animation to complete (increased by 50%)
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedDateForDetails) {
        const target = event.target as Element;
        // Check if click is inside the dropdown
        const dropdown = document.querySelector('[data-dropdown="trade-details"]');
        if (dropdown && !dropdown.contains(target)) {
          closeDropdown();
        }
      }
    };

    if (selectedDateForDetails) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedDateForDetails]);

  // Generate years array (current year - 10 to current year + 10)
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);
  
  // Generate months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate days array (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const grouped = new Map();
    
    trades.forEach(trade => {
      const exitDate = format(new Date(trade.exitDate), 'yyyy-MM-dd');
      
      if (!grouped.has(exitDate)) {
        grouped.set(exitDate, {
          trades: [],
          totalPnL: 0
        });
      }
      
      const group = grouped.get(exitDate);
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
      
      group.trades.push(trade);
      group.totalPnL += pnl;
    });
    
    return grouped;
  }, [trades]);

  return (
    <div>
      {/* Monthly summary */}
      <MonthSummary currentMonth={currentMonth} />
      
      {/* Calendar */}
      <div className="bg-[#1C1719] rounded-lg shadow p-6">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 rounded-full text-white transition-colors duration-200 flex items-center gap-2 px-3"
              style={{ backgroundColor: '#231F21' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#231F21'}
            >
              <Calendar size={16} />
              <span className="text-sm">Custom Date</span>
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-full text-white transition-colors duration-200"
              style={{ backgroundColor: '#231F21' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#231F21'}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full text-white transition-colors duration-200"
              style={{ backgroundColor: '#231F21' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#231F21'}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Custom Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              ref={datePickerRef}
              className="bg-[#1C1719] rounded-lg shadow-xl p-6 w-80 max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Select Date</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Year Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-[#342f31] border border-white/15 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Month Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full bg-[#342f31] border border-white/15 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>

                {/* Day Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Day</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="w-full bg-[#342f31] border border-white/15 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 px-4 py-2 border border-white/15 rounded-md bg-[#342f31] text-white hover:bg-blue-600/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applySelectedDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day names */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className={`font-medium text-center py-2 ${
              day === 'Sat' || day === 'Sun' ? 'text-orange-400' : 'text-gray-300'
            }`}>
              {day}
            </div>
          ))}

          {/* Empty cells before start of month */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-start-${index}`} className="p-1 rounded-md min-h-[100px]"></div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = tradesByDate.get(dateKey);
            const hasTrades = dayData && dayData.trades.length > 0;
            const isProfitable = hasTrades && dayData.totalPnL > 0;
            const isBreakEven = hasTrades && dayData.totalPnL === 0;
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
            
            return (
              <div
                key={dateKey}
                onClick={(e) => handleDayClick(dateKey, e)}
                className={`p-1 rounded-md min-h-[100px] transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-blue-500/50 ${
                  hasTrades ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isToday(day) 
                    ? 'border border-blue-500' 
                    : !isSameMonth(day, currentMonth) 
                    ? 'opacity-50' 
                    : ''
                } ${
                  hasTrades 
                    ? isProfitable 
                      ? 'bg-green-900/30' 
                      : isBreakEven 
                      ? 'bg-yellow-900/30' 
                      : 'bg-red-900/30'
                    : ''
                }`}
                style={{ backgroundColor: hasTrades ? undefined : '#231F21' }}
              >
                <div className="text-left mb-1 px-1">
                  <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isWeekend ? 'bg-orange-400/20' : 'bg-[#342F31]'
                  }`}>
                    <span className={`text-sm font-medium ${isToday(day) ? 'text-blue-400' : 'text-gray-300'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                </div>
                
                {hasTrades && (
                  <div className="flex flex-col items-center px-1">
                    <div className={`text-base font-bold ${
                      isProfitable ? 'text-success' : isBreakEven ? 'text-yellow-500' : 'text-danger'
                    }`}>
                      {isProfitable ? '+' : dayData.totalPnL < 0 ? '-' : ''}${Math.abs(dayData.totalPnL).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {dayData.trades.length} {dayData.trades.length === 1 ? 'trade' : 'trades'}
                    </div>
                  </div>
                )}
                
                {/* Weekend indicator */}
                {isWeekend && !hasTrades && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full opacity-60"></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty cells after end of month */}
          {Array.from({ length: 6 - ((getDay(monthEnd) + 6) % 7) }).map((_, index) => (
            <div key={`empty-end-${index}`} className="p-1 rounded-md min-h-[100px]"></div>
          ))}
        </div>
      </div>

      {/* Trade Details Dropdown */}
      {selectedDateForDetails && (
        <div
          data-dropdown="trade-details"
          className={`absolute z-50 bg-[#1C1719] border border-white/20 rounded-lg shadow-2xl p-4 max-w-md max-h-[80vh] overflow-y-auto transition-all duration-300 ease-out ${
            isDropdownVisible 
              ? 'opacity-100 scale-100 backdrop-blur-sm' 
              : 'opacity-0 scale-95 backdrop-blur-none'
          }`}
          style={{
            left: `${dropdownPosition.x}px`,
            top: `${dropdownPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          {(() => {
            const dayData = tradesByDate.get(selectedDateForDetails);
            if (!dayData) return null;

            const selectedDate = new Date(selectedDateForDetails);
            const isProfitable = dayData.totalPnL > 0;
            const isBreakEven = dayData.totalPnL === 0;
            
            // Get unique assets traded
            const assets = [...new Set(dayData.trades.map(trade => trade.symbol))];
            
            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {format(selectedDate, 'MMM d, yyyy')}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDropdown();
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#231F21] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Total P/L</span>
                    </div>
                    <div className={`text-lg font-bold ${
                      isProfitable ? 'text-green-500' : isBreakEven ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {isProfitable ? '+' : dayData.totalPnL < 0 ? '-' : ''}${Math.abs(dayData.totalPnL).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-[#231F21] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Trades</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {dayData.trades.length}
                    </div>
                  </div>
                </div>

                {/* Assets Traded */}
                <div className="bg-[#231F21] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">Assets Traded</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assets.map(asset => (
                      <span
                        key={asset}
                        className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-sm"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trade Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Trade Details</h4>
                  {dayData.trades.map((trade, index) => {
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
                    
                    const isTradeProfitable = pnl > 0;
                    const isTradeBreakEven = pnl === 0;
                    const isExpanded = expandedTrades.has(trade.id);
                    const hasNotes = trade.setupNotes || trade.mistakesNotes;
                    
                    return (
                      <div key={trade.id} className="bg-[#231F21] rounded-lg border border-white/10">
                        {/* Trade Header - Always Visible */}
                        <div 
                          className={`flex items-center justify-between p-3 ${hasNotes ? 'cursor-pointer' : 'cursor-default'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasNotes) {
                              toggleTradeExpansion(trade.id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{trade.symbol}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.direction === 'long' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.direction.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`font-bold ${
                              isTradeProfitable ? 'text-green-500' : isTradeBreakEven ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {isTradeProfitable ? '+' : pnl < 0 ? '-' : ''}${Math.abs(pnl).toFixed(2)}
                            </div>
                            {hasNotes && (
                              <div className="text-gray-400">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable Content */}
                        {hasNotes && (
                          <div 
                            className={`overflow-hidden transition-all duration-450 ease-in-out ${
                              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                              {/* Setup Notes */}
                              {trade.setupNotes && (
                                <div className="transform transition-all duration-300 ease-out">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText size={14} className="text-blue-400" />
                                    <span className="text-xs text-blue-400">Setup Notes</span>
                                  </div>
                                  <p className="text-sm text-gray-300 bg-[#1C1719] rounded p-2 transition-all duration-300 hover:bg-blue-600/20">
                                    {trade.setupNotes}
                                  </p>
                                </div>
                              )}

                              {/* Mistakes & Learnings */}
                              {trade.mistakesNotes && (
                                <div className="transform transition-all duration-300 ease-out">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle size={14} className="text-orange-400" />
                                    <span className="text-xs text-orange-400">Mistakes & Learnings</span>
                                  </div>
                                  <p className="text-sm text-gray-300 bg-[#1C1719] rounded p-2 transition-all duration-300 hover:bg-blue-600/20">
                                    {trade.mistakesNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}