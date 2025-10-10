"use client";

import { useState, useEffect } from 'react';

interface UILockState {
  locked: boolean;
  timestamp: number;
  lockedBy: string;
}

export function useUIProtection() {
  const [isUILocked, setIsUILocked] = useState(false);
  const [lockState, setLockState] = useState<UILockState | null>(null);

  useEffect(() => {
    const savedLockState = localStorage.getItem('ui-lock-state');
    if (savedLockState) {
      try {
        const state: UILockState = JSON.parse(savedLockState);
        setLockState(state);
        
        // Check if lock is expired (24 hours)
        const isExpired = Date.now() - state.timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
          // Auto-unlock if expired
          localStorage.removeItem('ui-lock-state');
          setIsUILocked(false);
        } else {
          setIsUILocked(state.locked);
        }
      } catch (error) {
        console.error('Error parsing UI lock state:', error);
        setIsUILocked(false);
      }
    }
  }, []);

  const lockUI = () => {
    const newState: UILockState = {
      locked: true,
      timestamp: Date.now(),
      lockedBy: 'admin'
    };
    localStorage.setItem('ui-lock-state', JSON.stringify(newState));
    setLockState(newState);
    setIsUILocked(true);
  };

  const unlockUI = () => {
    const newState: UILockState = {
      locked: false,
      timestamp: Date.now(),
      lockedBy: 'admin'
    };
    localStorage.setItem('ui-lock-state', JSON.stringify(newState));
    setLockState(newState);
    setIsUILocked(false);
  };

  const resetUILock = () => {
    localStorage.removeItem('ui-lock-state');
    setLockState(null);
    setIsUILocked(false);
  };

  const canModifyUI = () => {
    return !isUILocked;
  };

  const getLockInfo = () => {
    if (!lockState) return null;
    
    const lockTime = new Date(lockState.timestamp);
    const timeAgo = Date.now() - lockState.timestamp;
    const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
    
    return {
      lockedBy: lockState.lockedBy,
      lockedAt: lockTime.toLocaleString(),
      hoursAgo,
      isExpired: timeAgo > 24 * 60 * 60 * 1000
    };
  };

  return {
    isUILocked,
    lockState,
    lockUI,
    unlockUI,
    resetUILock,
    canModifyUI,
    getLockInfo
  };
}
