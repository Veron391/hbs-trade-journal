"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TimePeriod } from '../components/TimePeriodSelector';

interface TimePeriodContextType {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
}

const TimePeriodContext = createContext<TimePeriodContextType | undefined>(undefined);

export function TimePeriodProvider({ children }: { children: ReactNode }) {
  const [selectedPeriod, setSelectedPeriodState] = useState<TimePeriod>('all-time');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load period from localStorage on initial load
  useEffect(() => {
    try {
      const savedPeriod = localStorage.getItem('selectedTimePeriod') as TimePeriod;
      if (savedPeriod && ['all-time', 'last-7-days', 'this-month', 'last-month', 'last-90-days', 'year-to-date'].includes(savedPeriod)) {
        setSelectedPeriodState(savedPeriod);
      }
    } catch (error) {
      console.error('Error loading time period from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save period to localStorage whenever it changes
  const setSelectedPeriod = (period: TimePeriod) => {
    setSelectedPeriodState(period);
    try {
      localStorage.setItem('selectedTimePeriod', period);
    } catch (error) {
      console.error('Error saving time period to localStorage:', error);
    }
  };

  // Don't block rendering - use default state if not initialized yet
  const currentPeriod = isInitialized ? selectedPeriod : 'all-time';

  return (
    <TimePeriodContext.Provider value={{ selectedPeriod: currentPeriod, setSelectedPeriod }}>
      {children}
    </TimePeriodContext.Provider>
  );
}

export function useTimePeriod() {
  const context = useContext(TimePeriodContext);
  if (context === undefined) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  return context;
}
