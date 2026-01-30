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
  autoComplete
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isPassword = type === 'password';
  const hasValue = value.length > 0;
  const isLabelFloating = isFocused || hasValue;

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
  }, [value, onChange]);

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
          className={`w-full px-2 sm:px-3 bg-[#342F31] border rounded-md text-base
            focus:outline-none focus:ring-1 
            ${error ? 'border-danger focus:ring-red-500' : 'border-[#534E50] focus:border-white/70 focus:ring-white/70'}
            ${isLabelFloating ? 'pt-5 pb-2.5' : 'py-2.5'}
            ${isPassword ? 'pr-10 sm:pr-10' : ''}`}
          style={{
            WebkitBoxShadow: '0 0 0 1000px #342F31 inset',
            WebkitTextFillColor: value ? 'rgba(255, 255, 255, 1)' : 'rgba(156, 163, 175, 0.4)',
            color: value ? 'rgba(255, 255, 255, 1)' : 'rgba(156, 163, 175, 0.4)',
            caretColor: 'rgba(255, 255, 255, 1)',
            lineHeight: '1.5',
            transition: 'background-color 5000s ease-in-out 0s, color 0.2s ease-in-out'
          }}
        />
        <label
          htmlFor={id}
          className={`absolute left-2 sm:left-3 pointer-events-none transition-all duration-200 ${
            isLabelFloating
              ? 'top-0 -translate-y-1/2 text-xs text-gray-300 px-1 bg-[#342F31] rounded'
              : 'top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-400'
          }`}
          style={isLabelFloating ? {
            background: '#342F31',
            paddingLeft: '4px',
            paddingRight: '4px'
          } : {}}
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