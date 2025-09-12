'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface RiskContextType {
  isAllRead: boolean;
  setIsAllRead: (read: boolean) => void;
}

const RiskContext = createContext<RiskContextType | undefined>(undefined);

export function RiskProvider({ children }: { children: ReactNode }) {
  const [isAllRead, setIsAllRead] = useState(false);

  return (
    <RiskContext.Provider value={{ isAllRead, setIsAllRead }}>
      {children}
    </RiskContext.Provider>
  );
}

export function useRisk() {
  const context = useContext(RiskContext);
  if (context === undefined) {
    throw new Error('useRisk must be used within a RiskProvider');
  }
  return context;
}
