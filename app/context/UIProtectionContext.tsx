"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useUIProtection } from '../hooks/useUIProtection';

interface UIProtectionContextType {
  isUILocked: boolean;
  lockState: any;
  lockUI: () => void;
  unlockUI: () => void;
  resetUILock: () => void;
  canModifyUI: () => boolean;
  getLockInfo: () => any;
}

const UIProtectionContext = createContext<UIProtectionContextType | undefined>(undefined);

export function UIProtectionProvider({ children }: { children: ReactNode }) {
  const uiProtection = useUIProtection();

  return (
    <UIProtectionContext.Provider value={uiProtection}>
      {children}
    </UIProtectionContext.Provider>
  );
}

export function useUIProtectionContext() {
  const context = useContext(UIProtectionContext);
  if (context === undefined) {
    throw new Error('useUIProtectionContext must be used within a UIProtectionProvider');
  }
  return context;
}
