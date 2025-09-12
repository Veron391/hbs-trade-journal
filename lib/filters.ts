import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { thisMonth, oneWeek, lastMonth, last90Days, yearToDate, allStats } from './dateRanges';

export type Period = 'thisMonth' | 'oneWeek' | 'lastMonth' | 'last90Days' | 'yearToDate' | 'allStats';
export type Category = 'total' | 'stock' | 'crypto';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterState {
  period: Period;
  category: Category;
  range: DateRange;
  
  // Actions
  setPeriod: (period: Period) => void;
  setCategory: (category: Category) => void;
  resetFilters: () => void;
}

const getRangeForPeriod = (period: Period): DateRange => {
  switch (period) {
    case 'thisMonth': return thisMonth();
    case 'oneWeek': return oneWeek();
    case 'lastMonth': return lastMonth();
    case 'last90Days': return last90Days();
    case 'yearToDate': return yearToDate();
    case 'allStats': return allStats();
    default: return thisMonth();
  }
};

const defaultFilters: Omit<FilterState, 'setPeriod' | 'setCategory' | 'resetFilters'> = {
  period: 'thisMonth',
  category: 'total',
  range: thisMonth()
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilters,
  
  setPeriod: (period) => set({ 
    period, 
    range: getRangeForPeriod(period) 
  }),
  setCategory: (category) => set({ category }),
  resetFilters: () => set(defaultFilters),
}));

// Selectors
export const usePeriod = () => useFilterStore((state) => state.period);
export const useCategory = () => useFilterStore((state) => state.category);
export const useRange = () => useFilterStore((state) => state.range);
export const useFilters = () => {
  const period = usePeriod();
  const category = useCategory();
  const range = useRange();
  const setPeriod = useFilterStore((state) => state.setPeriod);
  const setCategory = useFilterStore((state) => state.setCategory);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  return { period, category, range, setPeriod, setCategory, resetFilters };
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
