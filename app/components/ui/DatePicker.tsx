"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function DatePicker({ value, onChange, placeholder, className, error }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsAnimating(true);
          setTimeout(() => {
            setIsOpen(false);
            setIsAnimating(false);
          }, 150);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update selected date when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6)
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);

    // Format date as YYYY-MM-DD for input value (use local timezone)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    onChange(formattedDate);

    // Close with animation
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 150);
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
        setShowYearSelector(false);
        setShowMonthSelector(false);
      }, 150);
    } else {
      setIsOpen(true);
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearSelector(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(month);
    setShowMonthSelector(false);
  };

  const generateYearRange = () => {
    const currentYearValue = new Date().getFullYear();
    const startYear = currentYearValue - 50;
    const endYear = currentYearValue + 10;
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="w-8 h-8"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`
            w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors
            ${isSelected(day)
              ? 'bg-[#553527] text-white'
              : isToday(day)
                ? 'bg-[#553527]/70 text-white ring-2 ring-[#553527]'
                : 'text-gray-200 hover:bg-[#553527]/50 hover:text-white'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`
          relative flex items-center w-full rounded-md border px-3 py-2 bg-[#171717] text-white cursor-pointer transition-colors
          ${error ? 'border-red-500 focus-within:border-red-500' : 'border-[#553527]/40 focus-within:border-[#553527]'}
          ${className || ''}
        `}
        onClick={handleToggle}
      >
        <input
          ref={inputRef}
          type="text"
          value={selectedDate ? formatDisplayDate(selectedDate) : ''}
          placeholder={placeholder}
          readOnly
          className="flex-1 bg-transparent text-white placeholder-[#303030] outline-none cursor-pointer"
        />
        <Calendar className="w-4 h-4 text-gray-400 ml-2" />
      </div>

      {(isOpen || isAnimating) && (
        <div
          className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-50 bg-[#101010]/95 backdrop-blur-md border border-white/15 rounded-lg shadow-xl p-4 w-80 transition-all duration-200 ease-out ${isOpen && !isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {!showYearSelector && !showMonthSelector && (
              <>
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="p-1 rounded-lg hover:bg-[#171717] text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowMonthSelector(true)}
                    className="text-white font-medium hover:bg-[#171717] py-1 px-2 rounded-lg transition-colors"
                  >
                    {MONTHS[currentMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowYearSelector(true)}
                    className="text-white font-medium hover:bg-[#171717] py-1 px-2 rounded-lg transition-colors"
                  >
                    {currentYear}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-[#171717] text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {showYearSelector && (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => setShowYearSelector(false)}
                  className="p-1 rounded-lg hover:bg-[#171717] text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <h3 className="text-white font-medium text-center flex-1">
                  Select Year
                </h3>

                <div className="w-6"></div> {/* Spacer for alignment */}
              </div>
            )}

            {showMonthSelector && (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => setShowMonthSelector(false)}
                  className="p-1 rounded-lg hover:bg-[#171717] text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <h3 className="text-white font-medium text-center flex-1">
                  Select Month
                </h3>

                <div className="w-6"></div> {/* Spacer for alignment */}
              </div>
            )}
          </div>

          {!showYearSelector && !showMonthSelector && (
            <>
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-300"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
              </div>
            </>
          )}

          {showYearSelector && (
            <div className="max-h-48 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {generateYearRange().map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${year === currentYear
                        ? 'bg-[#553527] text-white'
                        : 'text-gray-200 hover:bg-[#553527]/50 hover:text-white'
                      }
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showMonthSelector && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${index === currentMonth
                      ? 'bg-[#553527] text-white'
                      : 'text-gray-200 hover:bg-[#553527]/50 hover:text-white'
                    }
                  `}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
