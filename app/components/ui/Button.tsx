"use client";

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const baseStyles = 'inline-flex justify-center items-center rounded-md font-medium focus:outline-none';

  const variantStyles = {
    primary: 'bg-transparent border border-green-500 text-green-500 hover:bg-green-500 hover:text-white',
    secondary: 'bg-transparent border border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white',
    danger: 'bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white',
    success: 'bg-green-500 border border-green-500 text-white hover:bg-green-600 hover:text-white',
    neon: 'bg-transparent border border-[#D9FE43] text-[#D9FE43] hover:bg-[#D9FE43] hover:text-[#101010]',
  };

  const sizeStyles = {
    sm: 'px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm min-h-[44px]',
    md: 'px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base min-h-[44px]',
    lg: 'px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg min-h-[44px]',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthStyles = fullWidth ? 'w-full' : '';

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles}
    >
      {children}
    </button>
  );
} 