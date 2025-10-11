"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTrades } from '../../context/TradeContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isToday, isSameMonth, setYear, setMonth, setDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X, TrendingUp, DollarSign, BarChart3, FileText, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import MonthSummary from '../dashboard/MonthSummary';
import { useI18n } from '../../context/I18nContext';
import { getCalendarDayDetails, CalendarDayDetails } from '../../../lib/api/trades';

export default function TradeCalendar() {
  const { t } = useI18n();
  const { trades } = useTrades();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [backendDays, setBackendDays] = useState<Map<string, { totalPnL: number; trades: number }>>(new Map());
  const [isBackendDataLoaded, setIsBackendDataLoaded] = useState(false);
  const [calendarDayDetails, setCalendarDayDetails] = useState<CalendarDayDetails | null>(null);
  const [isLoadingDayDetails, setIsLoadingDayDetails] = useState(false);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const anchorElRef = useRef<HTMLElement | null>(null);
  
  // Rate limiting: Only allow one API call per 500ms
  const RATE_LIMIT_MS = 500;

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
  const handleDayClick = async (dateKey: string, event: React.MouseEvent) => {
    // Keep reference to the clicked day so we can re-position while scrolling/resizing
    anchorElRef.current = event.currentTarget as HTMLElement;
    console.log('Day clicked:', dateKey);
    const dayData = tradesByDate.get(dateKey);
    const backendData = backendDays.get(dateKey);
    
    console.log('Day data:', dayData, 'Backend data:', backendData);
    
    // If clicking the same date that's already selected, toggle the dropdown
    if (selectedDateForDetails === dateKey && isDropdownVisible) {
      closeDropdown();
      return;
    }
    
    // Check if there are any trades for this day before making API request
    const hasLocalTrades = dayData && dayData.trades.length > 0;
    const hasBackendTrades = backendData && backendData.trades > 0;
    
    if (!hasLocalTrades && !hasBackendTrades) {
      console.log('No trades found for this day, skipping API request');
      return;
    }
    
    // Always show dropdown when clicked, regardless of existing data
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate position considering scroll and viewport
    let yPosition = rect.bottom + 10; // fixed -> viewport coords
    let xPosition = rect.left + rect.width / 2;
    
    // Estimate dropdown height more accurately based on viewport
    const maxDropdownHeight = Math.min(500, viewportHeight * 0.7); // Max 70% of viewport height
    const minDropdownHeight = 200; // Minimum height for basic content
    const estimatedDropdownHeight = maxDropdownHeight;
    
    // Check available space above and below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // If not enough space below, position above the day cell
    if (spaceBelow < estimatedDropdownHeight && spaceAbove > minDropdownHeight) {
      yPosition = rect.top - minDropdownHeight - 10;
    } else if (spaceBelow < minDropdownHeight) {
      // If very little space below, position above with available space
      yPosition = Math.max(20, rect.top - Math.min(estimatedDropdownHeight, spaceAbove - 20));
    }
    
    // Ensure dropdown stays within viewport horizontally
    const dropdownWidth = 384; // w-96 = 384px
    const margin = 20; // Increased margin for better spacing
    
    if (xPosition - dropdownWidth/2 < margin) {
      xPosition = dropdownWidth/2 + margin;
    } else if (xPosition + dropdownWidth/2 > viewportWidth - margin) {
      xPosition = viewportWidth - dropdownWidth/2 - margin;
    }
    
    // Ensure vertical position is within viewport bounds
    yPosition = Math.max(margin, Math.min(yPosition, viewportHeight - minDropdownHeight - margin));
    
    setDropdownPosition({
      x: xPosition,
      y: yPosition
    });
    setSelectedDateForDetails(dateKey);
    setExpandedTrades(new Set()); // Reset expanded trades when opening new dropdown
    
    // Only load detailed data from API if there are trades for this day
    if (hasLocalTrades || hasBackendTrades) {
      setIsLoadingDayDetails(true);
      try {
        const details = await getCalendarDayDetails(dateKey);
        setCalendarDayDetails(details);
      } catch (error) {
        console.error('Failed to load calendar day details:', error);
        // Keep existing data if API fails
        setCalendarDayDetails(null);
      } finally {
        setIsLoadingDayDetails(false);
      }
    }
    
    // Show dropdown immediately after data is loaded
    console.log('Setting dropdown visible for date:', dateKey);
    setIsDropdownVisible(true);
  };

  // Keep dropdown anchored to the selected day while scrolling/resizing
  useEffect(() => {
    const updatePosition = () => {
      if (!isDropdownVisible || !anchorElRef.current) return;
      const rect = anchorElRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let yPosition = rect.bottom + 10;
      let xPosition = rect.left + rect.width / 2;

      const maxDropdownHeight = Math.min(500, viewportHeight * 0.7);
      const minDropdownHeight = 200;
      const estimatedDropdownHeight = maxDropdownHeight;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < estimatedDropdownHeight && spaceAbove > minDropdownHeight) {
        yPosition = rect.top - minDropdownHeight - 10;
      } else if (spaceBelow < minDropdownHeight) {
        yPosition = Math.max(20, rect.top - Math.min(estimatedDropdownHeight, spaceAbove - 20));
      }

      const dropdownWidth = 384; // w-96
      const margin = 20;
      if (xPosition - dropdownWidth / 2 < margin) {
        xPosition = dropdownWidth / 2 + margin;
      } else if (xPosition + dropdownWidth / 2 > viewportWidth - margin) {
        xPosition = viewportWidth - dropdownWidth / 2 - margin;
      }

      yPosition = Math.max(margin, Math.min(yPosition, viewportHeight - minDropdownHeight - margin));
      setDropdownPosition({ x: xPosition, y: yPosition });
    };

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isDropdownVisible]);

  // Toggle trade expansion
  const toggleTradeExpansion = (tradeId: string) => {
    console.log('Toggling trade expansion for:', tradeId);
    setExpandedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
        console.log('Collapsing trade:', tradeId);
      } else {
        newSet.add(tradeId);
        console.log('Expanding trade:', tradeId);
      }
      console.log('New expanded trades set:', Array.from(newSet));
      return newSet;
    });
  };

  // Close dropdown with animation
  const closeDropdown = () => {
    setIsDropdownVisible(false);
    setTimeout(() => {
      setSelectedDateForDetails(null);
      setCalendarDayDetails(null);
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

  // Group trades by date via backend calendar API for accurate per-day totals
  const tradesByDate = useMemo(() => {
    const grouped = new Map();
    // Seed grouped map with current trades for details (local list)
    trades.forEach(trade => {
      const exitDate = format(new Date(trade.exitDate), 'yyyy-MM-dd');
      if (!grouped.has(exitDate)) grouped.set(exitDate, { trades: [], totalPnL: 0 });
      grouped.get(exitDate).trades.push(trade);
    });
    return grouped;
  }, [trades]);

  // Load per-day PnL and counts from backend calendar API
  // Note: This data may have calculation errors - day details API provides more accurate totals
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    // Don't block display - show local data immediately
    setIsBackendDataLoaded(true);
    const load = async () => {
      try {
        const res = await fetch(`/api/journal/trades/calendar?year=${year}&month=${month}&t=${Date.now()}`, { 
          cache: 'no-store'
        });
        if (!res.ok) {
          console.log('Calendar API not available, using local data');
          return;
        }
        const data = await res.json();
        console.log('Calendar list API response:', data);
        if (Array.isArray(data.days)) {
          const map = new Map<string, { totalPnL: number; trades: number }>();
          data.days.forEach((d: any) => {
            // Note: d.total_pnl may be incorrect - day details API provides accurate totals
            console.log(`Calendar list data for ${d.date}:`, { total_pnl: d.total_pnl, trades: d.trades });
            map.set(d.date, { totalPnL: Number(d.total_pnl) || 0, trades: Number(d.trades) || 0 });
          });
          setBackendDays(map);
        }
      } catch (error) {
        console.log('Calendar API error, using local data:', error);
      }
    };
    load();
  }, [currentMonth]);

  return (
    <div>
      {/* Monthly summary */}
      <MonthSummary currentMonth={currentMonth} />
      
      {/* Calendar */}
      <div className="bg-[#1C1719] rounded-lg shadow p-6">
        {!isBackendDataLoaded && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-400">Loading calendar data...</span>
          </div>
        )}
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
                <span className="text-sm">{t('customDate')}</span>
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
              
              <div className="space-y-4 pb-6">
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
            const backend = backendDays.get(dateKey);
            // Show backend data if available, otherwise fall back to local data
            const numTrades = backend?.trades ?? (dayData ? dayData.trades.length : 0);
            const totalPnLVal = backend?.totalPnL ?? (dayData ? dayData.totalPnL : 0);
            const hasTrades = numTrades > 0;
            const isProfitable = hasTrades && totalPnLVal > 0;
            const isBreakEven = hasTrades && totalPnLVal === 0;
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
            
            return (
              <div
                key={dateKey}
                onClick={(e) => handleDayClick(dateKey, e)}
                className={`p-1 rounded-md min-h-[100px] transition-all duration-200 ${
                  hasTrades 
                    ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:border-blue-500/50' 
                    : 'cursor-default opacity-60'
                } ${
                  !isSameMonth(day, currentMonth) 
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
                    isToday(day) 
                      ? 'bg-blue-500/20' 
                      : hasTrades 
                        ? (isProfitable 
                          ? 'bg-green-500/20' 
                          : isBreakEven 
                            ? 'bg-yellow-500/20' 
                            : 'bg-red-500/20')
                        : isWeekend ? 'bg-orange-400/20' : 'bg-[#342F31]'
                  }`}>
                    <span className={`text-sm font-medium ${
                      isToday(day) 
                        ? 'text-blue-400' 
                        : hasTrades 
                          ? (isProfitable ? 'text-green-400' : isBreakEven ? 'text-yellow-400' : 'text-red-400')
                          : isWeekend ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                </div>
                
                {hasTrades && (
                  <div className="flex flex-col items-center px-1">
                    <div className={`text-base font-bold ${
                      isProfitable ? 'text-success' : isBreakEven ? 'text-yellow-500' : 'text-danger'
                    }`}>
                      {isProfitable ? '+' : totalPnLVal < 0 ? '-' : ''}${Math.abs(totalPnLVal).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {numTrades} {numTrades === 1 ? 'trade' : 'trades'}
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
          className={`fixed z-[9999] bg-[#1C1719] border border-white/20 rounded-lg shadow-2xl p-4 pb-8 w-96 max-w-[90vw] max-h-[calc(100vh-40px)] overflow-y-auto overscroll-contain transition-all duration-300 ease-out ${
            isDropdownVisible 
              ? 'opacity-100 scale-100 backdrop-blur-sm' 
              : 'opacity-0 scale-95 backdrop-blur-none'
          }`}
          style={{
            left: `${dropdownPosition.x}px`,
            top: `${dropdownPosition.y}px`,
            transform: 'translateX(-50%)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            maxHeight: 'calc(100vh - 40px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
          }}
        >
          {console.log('Rendering dropdown for:', selectedDateForDetails, 'visible:', isDropdownVisible, 'position:', dropdownPosition)}
          {(() => {
            if (isLoadingDayDetails) {
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Loading...</h3>
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
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                </div>
              );
            }

            const dayData = tradesByDate.get(selectedDateForDetails);
            const backendData = backendDays.get(selectedDateForDetails);
            const apiData = calendarDayDetails;
            
            // Show loading state if no data is available yet
            if (!dayData && !backendData && !apiData && !isLoadingDayDetails) {
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">No Data</h3>
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
                  <div className="text-center text-gray-400 py-4">
                    No trades found for this date
                  </div>
                </div>
              );
            }

            const selectedDate = new Date(selectedDateForDetails);
            
            // Prioritize API day details data (most accurate) over calendar list data
            const totalPnL = apiData?.summary?.total_pnl ?? apiData?.totalPnL ?? (dayData?.totalPnL ?? 0);
            const tradesCount = apiData?.summary?.trade_count ?? apiData?.trades ?? (dayData?.trades.length ?? 0);
            const assets = apiData?.summary?.assets_traded ?? apiData?.assets ?? (dayData ? [...new Set(dayData.trades.map((trade: any) => trade.symbol))] as string[] : []);
            // Use local trade data for detailed information (includes notes) but API data for summary
            const tradeDetails = dayData?.trades ?? (apiData?.trades ?? apiData?.tradeDetails ?? []);
            
            // Note: We intentionally exclude backendData (calendar list) as it may have incorrect calculations
            // The day details API provides the accurate per-day totals
            
            // Debug logging
            console.log('API Data:', apiData);
            console.log('Summary:', apiData?.summary);
            console.log('Assets:', assets);
            console.log('Trade Details:', tradeDetails);
            console.log('Day Data (local):', dayData);
            console.log('Local trades sample:', dayData?.trades?.[0]);
            
            // Ensure assets is an array of strings - handle both string arrays and object arrays
            let safeAssets: string[] = [];
            if (Array.isArray(assets)) {
              safeAssets = assets.map(asset => {
                if (typeof asset === 'string') {
                  return asset;
                } else if (typeof asset === 'object' && asset !== null) {
                  // If it's an object, try to extract the symbol or name
                  return asset.symbol || asset.name || asset.id || String(asset);
                }
                return String(asset);
              }).filter(asset => asset && asset.trim() !== '');
            }
            
            // Ensure tradeDetails is an array
            const safeTradeDetails = Array.isArray(tradeDetails) ? tradeDetails : [];
            
            const isProfitable = totalPnL > 0;
            const isBreakEven = totalPnL === 0;
            
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-[#231F21] to-[#2A2527] rounded-lg p-2.5 border border-white/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{t('totalPL')}</span>
                    </div>
                    <div className={`text-lg font-bold ${
                      isProfitable ? 'text-green-500' : isBreakEven ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {isProfitable ? '+' : totalPnL < 0 ? '-' : ''}${Math.abs(totalPnL).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-[#231F21] to-[#2A2527] rounded-lg p-2.5 border border-white/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{t('trades')}</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {tradesCount}
                    </div>
                  </div>
                </div>

                {/* Assets Traded */}
                {safeAssets.length > 0 && (
                  <div className="bg-gradient-to-r from-[#231F21] to-[#2A2527] rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{t('assetsTraded')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {safeAssets.map((asset) => (
                        <span
                          key={asset}
                          className="px-2 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 rounded-md text-sm font-medium border border-orange-400/30"
                        >
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trade Details */}
                {safeTradeDetails.length > 0 && (
                <div className="space-y-3 pb-2">
                    <h4 className="text-sm font-medium text-gray-300">{t('tradeDetails')}</h4>
                    {safeTradeDetails.map((trade: any, index: number) => {
                    // Ensure trade has required properties
                    if (!trade || typeof trade !== 'object') {
                      console.warn('Invalid trade object:', trade);
                      return null;
                    }
                    
                    // Use API data structure if available, otherwise fall back to local calculation
                    let pnl = 0;
                    let entryPrice = 0;
                    let exitPrice = 0;
                    let quantity = 0;
                    let symbol = trade.symbol || 'Unknown';
                    let direction = trade.direction || 'long';
                    let tradeId = trade.id || `trade-${index}`;
                    
                    // Always use local calculation for accurate PnL
                    entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice)) || 0;
                    exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice)) || 0;
                    quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
                    
                    const entryValue = entryPrice * quantity;
                    const exitValue = exitPrice * quantity;
                    
                    if (direction === 'long') {
                      pnl = exitValue - entryValue;
                    } else {
                      pnl = entryValue - exitValue;
                    }
                    
                    // Debug: Log the trade data to verify calculations
                    console.log('Trade PnL calculation:', {
                      id: trade.id,
                      symbol: trade.symbol,
                      entryPrice,
                      exitPrice,
                      quantity,
                      direction,
                      entryValue,
                      exitValue,
                      calculatedPnL: pnl
                    });
                    
                    const isTradeProfitable = pnl > 0;
                    const isTradeBreakEven = pnl === 0;
                    const isExpanded = expandedTrades.has(tradeId);
                    const hasNotes = Boolean(trade.setupNotes || trade.mistakesLearnings || trade.link);
                    
                    // Debug: Log trade data to see what's available
                    console.log('Trade details for expansion:', {
                      tradeId,
                      symbol: trade.symbol,
                      setupNotes: trade.setupNotes,
                      mistakesLearnings: trade.mistakesLearnings,
                      link: trade.link,
                      hasNotes,
                      isExpanded
                    });
                    
                    return (
                      <div key={tradeId} className="bg-gradient-to-r from-[#231F21] to-[#2A2527] rounded-xl border border-white/10 shadow-lg">
                        {/* Trade Header - Always Visible */}
                        <div 
                          className={`flex items-center justify-between py-2.5 px-4 ${hasNotes ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'} transition-all duration-200 rounded-xl`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Trade header clicked:', { tradeId, hasNotes });
                            if (hasNotes) {
                              toggleTradeExpansion(tradeId);
                            } else {
                              console.log('No notes available for trade:', tradeId);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="font-semibold text-white text-sm">{symbol}</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                direction === 'long' 
                                  ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-400/30' 
                                  : 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border border-red-400/30'
                              }`}>
                                {direction.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`font-bold text-sm px-2 py-1 rounded-lg ${
                              isTradeProfitable 
                                ? 'text-green-300 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30' 
                                : isTradeBreakEven 
                                  ? 'text-yellow-300 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30' 
                                  : 'text-red-300 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30'
                            }`}>
                              {isTradeProfitable ? '+' : pnl < 0 ? '-' : ''}${Math.abs(pnl).toFixed(2)}
                            </div>
                            {hasNotes && (
                              <div className="text-gray-400 hover:text-white transition-colors">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable Content */}
                        {hasNotes && (
                          <div 
                            className={`overflow-hidden transition-all duration-450 ease-in-out ${
                              isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                            style={{ willChange: 'max-height' }}
                          >
                            <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                              {/* Setup Notes */}
                              {trade.setupNotes && (
                                <div className="transform transition-all duration-300 ease-out">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="p-1 rounded-lg bg-blue-500/20">
                                      <FileText size={14} className="text-blue-400" />
                                    </div>
                                    <span className="text-xs font-medium text-blue-300">{t('setupNotes')}</span>
                                  </div>
                                  <p className="text-xs text-white bg-gradient-to-r from-blue-900/40 to-blue-800/30 rounded-lg py-3 px-2 transition-all duration-300 hover:from-blue-800/50 hover:to-blue-700/40 border border-blue-500/20">
                                    {trade.setupNotes}
                                  </p>
                                </div>
                              )}

                              {/* Mistakes & Learnings */}
                              {trade.mistakesLearnings && (
                                <div className="transform transition-all duration-300 ease-out">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="p-1 rounded-lg bg-orange-500/20">
                                      <AlertCircle size={14} className="text-orange-400" />
                                    </div>
                                    <span className="text-xs font-medium text-orange-300">{t('mistakesLearnings')}</span>
                                  </div>
                                  <p className="text-xs text-white bg-gradient-to-r from-orange-900/40 to-red-800/30 rounded-lg py-3 px-2 transition-all duration-300 hover:from-orange-800/50 hover:to-red-700/40 border border-orange-500/20">
                                    {trade.mistakesLearnings}
                                  </p>
                                </div>
                              )}

                              {/* Trade Link */}
                              {trade.link && (
                                <div className="transform transition-all duration-300 ease-out">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="p-1 rounded-lg" style={{ backgroundColor: '#F4E9D720' }}>
                                      <ExternalLink size={14} style={{ color: '#F4E9D7' }} />
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: '#F4E9D7' }}>{t('tradeLink')}</span>
                                  </div>
                                  <a 
                                    href={trade.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-white rounded-lg py-3 px-2 block transition-all duration-300 hover:from-[#F4E9D7]/30 hover:to-[#F4E9D7]/40 break-all border border-[#F4E9D7]/20 bg-gradient-to-r from-[#F4E9D7]/10 to-[#F4E9D7]/10"
                                  >
                                    {trade.link}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}