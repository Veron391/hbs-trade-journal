"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  backgroundColor?: string;
}

export default function FormInput({
  id,
  label,
  type,
  value,
  onChange,
  required = false,
  placeholder = '',
  error,
  autoComplete,
  backgroundColor = '#171717'
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isPassword = type === 'password';
  const hasValue = value.length > 0;
  const isLabelFloating = isFocused || hasValue;

  // Ma'lumotlar to'ldiriladigan inputlar: bo'sh 15% shaffof, to'ldirilganda 20% o'z rangida
  const parseHexToRgba = (hex: string, alpha: number) => {
    const m = hex.replace(/^#/, '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return null;
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const emptyBg = parseHexToRgba(backgroundColor, 0.15) ?? backgroundColor;
  const filledBg = parseHexToRgba(backgroundColor, 0.2) ?? backgroundColor;
  const resolvedBg = hasValue ? filledBg : emptyBg;

  // Check for autofill on mount and after a delay
  useEffect(() => {
    const checkAutofill = () => {
      if (inputRef.current) {
        const inputValue = inputRef.current.value;
        // Check if input has autofilled value that's not in React state
        const hasAutofill = inputRef.current.matches(':-webkit-autofill') ||
          inputRef.current.matches(':autofill') ||
          (inputValue && inputValue.length > 0 && !value);

        if (hasAutofill && inputValue && inputValue !== value) {
          // Update React state to match autofilled value
          const syntheticEvent = {
            target: { value: inputValue }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
          setIsFocused(true);
        }
      }
    };

    // Check immediately and after delays (for autofill)
    checkAutofill();
    const timeout1 = setTimeout(checkAutofill, 100);
    const timeout2 = setTimeout(checkAutofill, 300);
    const timeout3 = setTimeout(checkAutofill, 500);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onAnimationStart={(e) => {
            // Detect autofill animation
            if (e.animationName === 'onAutoFillStart') {
              setIsFocused(true);
            }
          }}
          required={required}
          autoComplete={autoComplete}
          className={`w-full px-2 sm:px-3 border rounded-md text-base bg-transparent
            focus:outline-none focus:ring-1 
            ${error ? 'border-danger focus:ring-red-500' : 'border-[#534E50]/30 focus:border-white/60 focus:ring-white/60'}
            ${isLabelFloating ? 'pt-4 pb-3' : 'py-2.5'}
            ${isPassword ? 'pr-10 sm:pr-10' : ''}`}
          style={{
            WebkitBoxShadow: `0 0 0 1000px ${resolvedBg} inset`,
            boxShadow: `0 0 0 1000px ${resolvedBg} inset`,
            backgroundColor: resolvedBg,
            WebkitTextFillColor: value ? 'rgba(255, 255, 255, 1)' : 'rgba(156, 163, 175, 0.4)',
            color: value ? 'rgba(255, 255, 255, 1)' : 'rgba(156, 163, 175, 0.4)',
            caretColor: 'rgba(255, 255, 255, 1)',
            lineHeight: '1.5',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            transition: 'background-color 5000s ease-in-out 0s, color 0.2s ease-in-out'
          }}
        />
        <label
          htmlFor={id}
          className={`absolute left-2 sm:left-3 pointer-events-none transition-all duration-200 z-[1] ${isLabelFloating
            ? 'top-0 -translate-y-1/2 text-xs rounded'
            : 'top-1/2 -translate-y-1/2 text-xs sm:text-sm'
            }`}
          style={isLabelFloating ? {
            background: 'var(--floating-label-bg, #141B16)',
            color: '#7c7c7c',
            paddingLeft: '6px',
            paddingRight: '6px',
            paddingTop: '2px',
            paddingBottom: '2px',
          } : { color: '#939393' }}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 z-10 transition-all duration-200 hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs sm:text-sm text-danger">{error}</p>}
    </div>
  );
} 