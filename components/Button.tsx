/**
 * GridPlay Button Component
 * 
 * A reusable button component with multiple variants, sizes, and states.
 * Follows WCAG AA accessibility guidelines.
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before the button text */
  leftIcon?: React.ReactNode;
  /** Icon to display after the button text */
  rightIcon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Button content */
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#10B981] text-gray-900 hover:bg-[#059669] focus:ring-[#10B981]',
  secondary: 'bg-[#1E3A5A] text-white hover:bg-[#2D4A6A] focus:ring-[#1E3A5A]',
  accent: 'bg-[#F59E0B] text-gray-900 hover:bg-[#D97706] focus:ring-[#F59E0B]',
  outline: 'bg-transparent border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-gray-900 focus:ring-[#10B981]',
  ghost: 'bg-transparent text-white hover:bg-[#2A2A2A] focus:ring-gray-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-xs gap-1',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  
  return (
    <svg
      className={`animate-spin ${spinnerSize}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  const baseStyles = [
    'inline-flex items-center justify-center',
    'font-medium',
    'rounded-md',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
  ].join(' ');

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].join(' ').trim();

  return (
    <button
      className={combinedClassName}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && <LoadingSpinner size={size} />}
      {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
