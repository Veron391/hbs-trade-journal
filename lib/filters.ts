import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { thisMonth, oneWeek, lastMonth, last90Days, allStats } from './dateRanges';

export type Period = 'thisMonth' | 'oneWeek' | 'lastMonth' | 'last90Days' | 'allStats' | 'custom';
export type Category = 'total' | 'stock' | 'crypto';
export type TradeType = 'crypto' | 'stock' | null;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterState {
  period: Period;
  category: Category;
  tradeType: TradeType;
  range: DateRange;
  customStartDate: string | null;
  customEndDate: string | null;
  
  // Actions
  setPeriod: (period: Period) => void;
  setCategory: (category: Category) => void;
  setTradeType: (tradeType: TradeType) => void;
  setCustomDates: (startDate: string | null, endDate: string | null) => void;
  resetFilters: () => void;
}

const getRangeForPeriod = (period: Period): DateRange => {
  switch (period) {
    case 'thisMonth': return thisMonth();
    case 'oneWeek': return oneWeek();
    case 'lastMonth': return lastMonth();
    case 'last90Days': return last90Days();
    case 'allStats': return allStats();
    case 'custom': return { start: new Date(), end: new Date() }; // Will be overridden by custom dates
    default: return thisMonth();
  }
};

const defaultFilters: Omit<FilterState, 'setPeriod' | 'setCategory' | 'setTradeType' | 'setCustomDates' | 'resetFilters'> = {
  period: 'thisMonth',
  category: 'total',
  tradeType: null,
  range: thisMonth(),
  customStartDate: null,
  customEndDate: null
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilters,
  
  setPeriod: (period) => set({ 
    period, 
    range: getRangeForPeriod(period) 
  }),
  setCategory: (category) => set({ category }),
  setTradeType: (tradeType) => set({ tradeType }),
  setCustomDates: (customStartDate, customEndDate) => set({ 
    customStartDate, 
    customEndDate,
    period: 'custom',
    range: customStartDate && customEndDate ? {
      start: new Date(customStartDate),
      end: new Date(customEndDate)
    } : getRangeForPeriod('thisMonth')
  }),
  resetFilters: () => set(defaultFilters),
}));

// Selectors
export const usePeriod = () => useFilterStore((state) => state.period);
export const useCategory = () => useFilterStore((state) => state.category);
export const useTradeType = () => useFilterStore((state) => state.tradeType);
export const useRange = () => useFilterStore((state) => state.range);
export const useCustomStartDate = () => useFilterStore((state) => state.customStartDate);
export const useCustomEndDate = () => useFilterStore((state) => state.customEndDate);
export const useFilters = () => {
  const period = usePeriod();
  const category = useCategory();
  const tradeType = useTradeType();
  const range = useRange();
  const customStartDate = useCustomStartDate();
  const customEndDate = useCustomEndDate();
  const setPeriod = useFilterStore((state) => state.setPeriod);
  const setCategory = useFilterStore((state) => state.setCategory);
  const setTradeType = useFilterStore((state) => state.setTradeType);
  const setCustomDates = useFilterStore((state) => state.setCustomDates);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  return { 
    period, 
    category, 
    tradeType, 
    range, 
    customStartDate, 
    customEndDate,
    setPeriod, 
    setCategory, 
    setTradeType, 
    setCustomDates, 
    resetFilters 
  };
};

// Helper functions for filtering data
export const getDateRangeDays = (range: DateRange): number => {
  const diffTime = range.end.getTime() - range.start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isDateInRange = (date: Date, range: DateRange): boolean => {
  return date >= range.start && date <= range.end;
};

export const matchesCategory = (item: any, category: Category): boolean => {
  if (category === 'total') return true;
  
  switch (category) {
    case 'stock':
      return item.type === 'stock';
    case 'crypto':
      return item.type === 'crypto';
    default:
      return true;
  }
};

// Helper function to convert period to backend range format
export const getBackendRange = (period: Period): string | null => {
  switch (period) {
    case 'thisMonth': return 'this_month';
    case 'oneWeek': return '1w';
    case 'lastMonth': return 'last_30';
    case 'last90Days': return 'last_30';
    case 'allStats': return 'all';
    case 'custom': return null; // Custom will use start_date/end_date
    default: return 'this_month';
  }
};

// Helper function to format date for backend (YYYY-MM-DD)
export const formatDateForBackend = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
