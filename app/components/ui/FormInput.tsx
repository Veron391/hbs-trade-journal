"use client";

import React, { useState } from 'react';
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
}

export default function FormInput({
  id,
  label,
  type,
  value,
  onChange,
  required = false,
  placeholder = '',
  error
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-[#342F31] text-white border rounded-md 
            focus:outline-none focus:ring-1 focus:ring-blue-500 
            ${error ? 'border-danger' : 'border-[#534E50]'}
            ${isPassword ? 'pr-10' : ''}`}
          style={{
            WebkitBoxShadow: '0 0 0 1000px #342F31 inset',
            WebkitTextFillColor: 'white',
            transition: 'background-color 5000s ease-in-out 0s'
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
} 