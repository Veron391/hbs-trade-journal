'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilters } from '../../../lib/filters';
import { Calendar, Users, Search, X, Filter, ChevronDown, Clock } from 'lucide-react';

const periodOptions = [
  { value: 'allStats' as const, label: 'All Time' },
  { value: 'oneWeek' as const, label: '1 Week' },
  { value: 'thisMonth' as const, label: 'This Month' },
  { value: 'lastMonth' as const, label: 'Last Month' },
  { value: 'last90Days' as const, label: 'Last 90 Days' },
  { value: 'yearToDate' as const, label: 'Year to Date' },
];

const categoryOptions = [
  { value: 'total' as const, label: 'All Assets' },
  { value: 'stock' as const, label: 'Stocks Only' },
  { value: 'crypto' as const, label: 'Crypto Only' },
];

const statusOptions = [
  { value: 'all' as const, label: 'All Users' },
  { value: 'active' as const, label: 'Active Only' },
  { value: 'inactive' as const, label: 'Inactive Only' },
  { value: 'recent' as const, label: 'Recent Users' },
];

interface FilterBarProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  onStatusChange?: (status: string) => void;
  statusFilter?: string;
  recentUsersCount?: number;
}

export default function FilterBar({ 
  onSearchChange, 
  searchQuery: externalSearchQuery, 
  onStatusChange, 
  statusFilter = 'all',
  recentUsersCount = 0 
}: FilterBarProps) {
  const { period, category, range, setPeriod, setCategory, resetFilters } = useFilters();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePeriodChange = (newPeriod: 'thisMonth' | 'oneWeek' | 'lastMonth' | 'last90Days' | 'yearToDate' | 'allStats') => {
    setPeriod(newPeriod);
    setIsPeriodDropdownOpen(false);
  };

  const handleCategoryChange = (newCategory: 'total' | 'stock' | 'crypto') => {
    setCategory(newCategory);
    setIsCategoryDropdownOpen(false);
  };

  const handleStatusChange = (newStatus: 'all' | 'active' | 'inactive' | 'recent') => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    setIsStatusDropdownOpen(false);
  };

  const handleSearchChange = (query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    } else {
      setInternalSearchQuery(query);
    }
  };

  const selectedPeriod = periodOptions.find(option => option.value === period);
  const selectedCategory = categoryOptions.find(option => option.value === category);
  const selectedStatus = statusOptions.find(option => option.value === statusFilter);

  const hasActiveFilters = 
    period !== 'thisMonth' || 
    category !== 'total' || 
    statusFilter !== 'all' ||
    searchQuery !== '';

  return (
    <div className="bg-[#1a1a1f] border border-neutral-800 rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <Filter className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-300 border border-neutral-700"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Period Custom Dropdown */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Calendar className="h-4 w-4" />
            Period
          </label>
          <div className="relative" ref={periodDropdownRef}>
            <button
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-[#1a1a1f] border-2 border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm hover:bg-blue-900/30 hover:border-blue-500/50 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              aria-expanded={isPeriodDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select time period"
            >
              <span>{selectedPeriod?.label || 'This Month'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ml-2 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isPeriodDropdownOpen && (
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-blue-900/5 backdrop-blur-md border-2 border-blue-500/30 rounded-xl shadow-2xl z-50 min-w-[160px] overflow-hidden"
                style={{
                  background: 'rgba(30, 58, 138, 0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
                role="listbox"
                aria-label="Time period options"
              >
                {periodOptions.map((option, index) => {
                  const isSelected = period === option.value;
                  const isFirst = index === 0;
                  const isLast = index === periodOptions.length - 1;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handlePeriodChange(option.value)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors focus:outline-none focus:bg-blue-900/30 ${
                        isFirst ? 'rounded-t-xl' : ''
                      } ${
                        isLast ? 'rounded-b-xl' : ''
                      } ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
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
        </div>

        {/* Category Custom Dropdown */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Users className="h-4 w-4" />
            Category
          </label>
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-[#1a1a1f] border-2 border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm hover:bg-blue-900/30 hover:border-blue-500/50 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              aria-expanded={isCategoryDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select category"
            >
              <span>{selectedCategory?.label || 'All Assets'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ml-2 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCategoryDropdownOpen && (
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-blue-900/5 backdrop-blur-md border-2 border-blue-500/30 rounded-xl shadow-2xl z-50 min-w-[160px] overflow-hidden"
                style={{
                  background: 'rgba(30, 58, 138, 0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
                role="listbox"
                aria-label="Category options"
              >
                {categoryOptions.map((option, index) => {
                  const isSelected = category === option.value;
                  const isFirst = index === 0;
                  const isLast = index === categoryOptions.length - 1;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleCategoryChange(option.value)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors focus:outline-none focus:bg-blue-900/30 ${
                        isFirst ? 'rounded-t-xl' : ''
                      } ${
                        isLast ? 'rounded-b-xl' : ''
                      } ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
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
        </div>

        {/* Status Custom Dropdown */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Clock className="h-4 w-4" />
            Status
          </label>
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-[#1a1a1f] border-2 border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm hover:bg-blue-900/30 hover:border-blue-500/50 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              aria-expanded={isStatusDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select status filter"
            >
              <span className="flex items-center gap-2">
                {selectedStatus?.label || 'All Users'}
                {statusFilter === 'recent' && recentUsersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {recentUsersCount}
                  </span>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ml-2 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isStatusDropdownOpen && (
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-blue-900/5 backdrop-blur-md border-2 border-blue-500/30 rounded-xl shadow-2xl z-50 min-w-[160px] overflow-hidden"
                style={{
                  background: 'rgba(30, 58, 138, 0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
                role="listbox"
                aria-label="Status filter options"
              >
                {statusOptions.map((option, index) => {
                  const isSelected = statusFilter === option.value;
                  const isFirst = index === 0;
                  const isLast = index === statusOptions.length - 1;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors focus:outline-none focus:bg-blue-900/30 ${
                        isFirst ? 'rounded-t-xl' : ''
                      } ${
                        isLast ? 'rounded-b-xl' : ''
                      } ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                          : 'text-white hover:bg-blue-900/30'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {option.value === 'recent' && recentUsersCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {recentUsersCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Search className="h-4 w-4" />
            Search
          </label>
            <input
              type="text"
            value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search trades..."
            className="w-full px-3 py-2 bg-[#1a1a1f] border-2 border-blue-500/30 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:bg-blue-900/30 hover:border-blue-500/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
