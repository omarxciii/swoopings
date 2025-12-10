/**
 * AvailabilityForm Component
 * 
 * Purpose:
 * - Manages day-of-week availability selection for listings
 * - Allows hosts to specify which days their listing is available for booking
 * - Displays checkboxes for Sunday (0) through Saturday (6)
 * - Used in listing creation and management pages
 * 
 * Props:
 * - availableDays: number[] - Array of available day numbers (0=Sunday, 6=Saturday)
 * - onChange: (days: number[]) => void - Callback when selection changes
 * - disabled: boolean - Whether form is disabled (optional)
 * 
 * Features:
 * - Visual day-of-week checkboxes
 * - "Select All" and "Clear All" buttons
 * - Keyboard accessible
 * - Mobile responsive
 * - Shows warning if no days selected
 * 
 * Data Format:
 * Available days stored as array of numbers: [0,1,2,3,4,5,6] = every day
 * Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
 */

'use client';

import { useState, useEffect } from 'react';

interface AvailabilityFormProps {
  availableDays: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export default function AvailabilityForm({
  availableDays,
  onChange,
  disabled = false,
}: AvailabilityFormProps) {
  const [selected, setSelected] = useState<number[]>(availableDays);

  useEffect(() => {
    setSelected(availableDays);
  }, [availableDays]);

  const handleToggle = (day: number) => {
    const newSelected = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day].sort((a, b) => a - b);
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    setSelected(allDays);
    onChange(allDays);
  };

  const handleClearAll = () => {
    setSelected([]);
    onChange([]);
  };

  const isAllSelected = selected.length === 7;
  const isNoneSelected = selected.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Available Days for Pick-up
          <span className="text-gray-500 font-normal ml-1">
            (Which days can renters start a rental?)
          </span>
        </label>

        {/* Explanation */}
        <div className="mb-4 p-3 bg-brand-secondary border border-brand-tertiary rounded-md">
          <p className="text-xs text-brand-primary">
            💡 <strong>How this works:</strong> Renters can only <em>start</em> rentals on selected days. 
            They can return the item on any day. For example, if you select only Friday, renters can pick up Friday and keep the item as long as they want.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || isAllSelected}
            className="px-3 py-1 text-xs font-medium text-brand-primary bg-brand-secondary rounded-md
              hover:bg-brand-tertiary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || isNoneSelected}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md
              hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Day Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map((day) => (
            <label
              key={day.value}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(day.value)}
                onChange={() => handleToggle(day.value)}
                disabled={disabled}
                className="w-4 h-4 text-brand-primary rounded border-gray-300
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                {day.label}
              </span>
            </label>
          ))}
        </div>

        {/* Warning if no days selected */}
        {isNoneSelected && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              ⚠️ Please select at least one available day
            </p>
          </div>
        )}

        {/* Summary */}
        {!isNoneSelected && (
          <div className="mt-3 p-3 bg-brand-secondary border border-brand-tertiary rounded-md">
            <p className="text-xs text-brand-primary">
              Available: {selected.map((d) => DAYS_OF_WEEK[d].label).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
