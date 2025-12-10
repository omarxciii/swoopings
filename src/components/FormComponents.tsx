/**
 * Input Component
 * 
 * File Purpose:
 * - Reusable form input with consistent styling
 * - Handles validation feedback
 * - Supports different input types (text, email, password)
 * 
 * Dependencies:
 * - React
 * - Tailwind CSS
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

interface InputProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  step?: string;
}

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  step,
}: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        className={`
          w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary 
          focus:border-transparent outline-none transition-all
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

/**
 * Button Component
 * 
 * File Purpose:
 * - Reusable button with consistent styling
 * - Supports loading state
 * - Supports different variants (primary, secondary)
 * 
 * Dependencies:
 * - React
 * - Tailwind CSS
 */

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  isLoading = false,
  fullWidth = false,
}: ButtonProps) {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary:
      'bg-brand-primary text-white hover:bg-blue-600 focus:ring-brand-primary disabled:bg-gray-400',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * TextArea Component
 * 
 * File Purpose:
 * - Reusable textarea for multi-line text input
 * - Handles validation feedback
 * - Consistent with Input component styling
 * 
 * Dependencies:
 * - React
 * - Tailwind CSS
 */

interface TextAreaProps {
  label: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export function TextArea({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
}: TextAreaProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary 
          focus:border-transparent outline-none transition-all resize-none
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
