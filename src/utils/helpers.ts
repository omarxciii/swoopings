/**
 * General Utility Functions
 * 
 * File Purpose:
 * - Collection of helper functions used throughout the app
 * - Focus on reusable, pure functions
 * - Examples: date formatting, price formatting, validation
 * 
 * Dependencies:
 * - None (vanilla JavaScript)
 * 
 * History:
 * - 2025-12-06: Initial creation with common utilities
 */

/**
 * Format price in cents to dollar string
 * Example: 2999 -> "$29.99"
 */
export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

/**
 * Format date object to YYYY-MM-DD string (useful for date inputs)
 */
export const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date for display (e.g., "Dec 6, 2025")
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Calculate number of days between two dates
 * Useful for calculating rental duration
 */
export const calculateDaysBetween = (
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate total rental price
 * Example: 2999 per day, 3 days -> 8997 (in cents)
 */
export const calculateTotalPrice = (
  pricePerDay: number,
  days: number
): number => {
  return pricePerDay * days;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if password meets minimum requirements
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one number
 */
export const isValidPassword = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasMinLength && hasUpperCase && hasNumber;
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Debounce function for search inputs
 * Delays execution until user stops typing
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  return new Date(dateString) > new Date();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Get today's date in YYYY-MM-DD format
 * Useful for setting min/max on date inputs
 */
export const getTodayString = (): string => {
  return formatDateToInput(new Date());
};
