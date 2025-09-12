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

  // Don't render children until we've loaded the initial state
  if (!isInitialized) {
    return null;
  }

  return (
    <TimePeriodContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
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
