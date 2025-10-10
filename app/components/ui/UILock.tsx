"use client";

import { useState, useEffect } from 'react';
import { Lock, Unlock, AlertTriangle, RotateCcw } from 'lucide-react';

interface UILockProps {
  isAdmin?: boolean;
  onLockChange?: (isLocked: boolean) => void;
}

export default function UILock({ isAdmin = false, onLockChange }: UILockProps) {
  const [isUILocked, setIsUILocked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Load UI lock state from localStorage
  useEffect(() => {
    const savedLockState = localStorage.getItem('ui-lock-state');
    if (savedLockState) {
      const { locked, timestamp } = JSON.parse(savedLockState);
      // Lock expires after 24 hours
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
      if (!isExpired) {
        setIsUILocked(locked);
      }
    }
  }, []);

  // Save UI lock state to localStorage
  const saveLockState = (locked: boolean) => {
    const lockState = {
      locked,
      timestamp: Date.now(),
      lockedBy: isAdmin ? 'admin' : 'user'
    };
    localStorage.setItem('ui-lock-state', JSON.stringify(lockState));
  };

  const handleLockUI = () => {
    if (isAdmin) {
      setIsUILocked(true);
      saveLockState(true);
      onLockChange?.(true);
      alert('UI has been locked! Design changes are now protected.');
    }
  };

  const handleUnlockUI = async () => {
    if (isAdmin) {
      const password = prompt('Enter admin password to unlock UI:');
      if (password === 'admin123') { // Simple password, in production use proper auth
        setIsUILocked(false);
        saveLockState(false);
        onLockChange?.(false);
        alert('UI has been unlocked! Design changes are now allowed.');
      } else {
        alert('Invalid password!');
      }
    } else {
      setShowConfirm(true);
    }
  };

  const handleUserUnlock = () => {
    if (lockPassword === 'unlock2024') { // User unlock password
      setIsUILocked(false);
      saveLockState(false);
      onLockChange?.(false);
      setShowConfirm(false);
      setLockPassword('');
      alert('UI temporarily unlocked for 1 hour!');
      
      // Auto-lock after 1 hour
      setTimeout(() => {
        setIsUILocked(true);
        saveLockState(true);
        onLockChange?.(true);
      }, 60 * 60 * 1000);
    } else {
      alert('Invalid unlock code!');
    }
  };

  const resetUILock = () => {
    if (isAdmin) {
      const confirm = window.confirm('Are you sure you want to reset UI lock? This will unlock UI for all users.');
      if (confirm) {
        localStorage.removeItem('ui-lock-state');
        setIsUILocked(false);
        onLockChange?.(false);
        alert('UI lock has been reset!');
      }
    }
  };

  if (!isUILocked) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <Unlock size={16} />
          <span className="text-sm font-medium">UI Unlocked</span>
          {isAdmin && (
            <button
              onClick={handleLockUI}
              className="ml-2 bg-green-700 hover:bg-green-800 px-2 py-1 rounded text-xs"
            >
              Lock UI
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <Lock size={16} />
          <span className="text-sm font-medium">UI Locked</span>
          <button
            onClick={handleUnlockUI}
            className="ml-2 bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs"
          >
            {isAdmin ? 'Unlock' : 'Request Unlock'}
          </button>
          {isAdmin && (
            <button
              onClick={resetUILock}
              className="ml-1 bg-red-800 hover:bg-red-900 px-2 py-1 rounded text-xs"
              title="Reset UI Lock"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* User Unlock Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1C1719] rounded-lg p-6 max-w-md w-full mx-4 border border-yellow-500">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">UI Unlock Request</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                UI is currently locked to prevent design changes. Enter the unlock code to temporarily unlock UI for 1 hour.
              </p>
              <input
                type="password"
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                placeholder="Enter unlock code"
                className="w-full px-3 py-2 bg-[#342f31] text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUserUnlock}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Unlock UI
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setLockPassword('');
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
