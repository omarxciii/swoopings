/**
 * Search & Filters Component
 * 
 * File Purpose:
 * - Reusable component for searching and filtering listings
 * - Provides search input, price range, location, and sorting options
 * - Local state for filter editing, applies filters on button click
 * - Shows active filters with clear buttons
 * 
 * Features:
 * - Text search (title and description) with search button
 * - Price range filters with "Apply Filters" button
 * - Location/city filter with word-start matching
 * - Sort options (newest, cheapest, most expensive)
 * - Active filter badges with individual clear buttons
 * - Clear all filters button
 * - Responsive design
 * - Loading state support
 * 
 * Dependencies:
 * - React hooks (useState, useCallback, useEffect)
 * - Tailwind CSS
 * 
 * Data Flow:
 * 1. User adjusts filter inputs (local state)
 * 2. User clicks "Apply Filters" or Search button
 * 3. onChange callback called with new filter values
 * 4. Parent component fetches results with new filters
 * 5. Active filters displayed with clear option
 * 
 * Notes:
 * - Component manages local editing state
 * - Only notifies parent on explicit user action (button click)
 * - Better UX - users can adjust multiple filters before applying
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export interface FilterState {
  search: string;
  minPrice: string;
  maxPrice: string;
  city: string;
  sortBy: 'newest' | 'cheapest' | 'expensive';
}

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  isLoading?: boolean;
}

export default function SearchFilters({
  filters,
  onChange,
  isLoading = false,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Local state for editing filters before applying
  const [editingFilters, setEditingFilters] = useState<FilterState>(filters);

  // Sync local state when parent filters change (e.g., from URL params)
  useEffect(() => {
    setEditingFilters(filters);
  }, [filters]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setEditingFilters(prev => ({ ...prev, search: value }));
    },
    []
  );

  const handleMinPriceChange = useCallback(
    (value: string) => {
      setEditingFilters(prev => ({ ...prev, minPrice: value }));
    },
    []
  );

  const handleMaxPriceChange = useCallback(
    (value: string) => {
      setEditingFilters(prev => ({ ...prev, maxPrice: value }));
    },
    []
  );

  const handleCityChange = useCallback(
    (value: string) => {
      setEditingFilters(prev => ({ ...prev, city: value }));
    },
    []
  );

  const handleSortChange = useCallback(
    (value: 'newest' | 'cheapest' | 'expensive') => {
      setEditingFilters(prev => ({ ...prev, sortBy: value }));
    },
    []
  );

  // Apply filters from local state to parent
  const handleApplyFilters = useCallback(() => {
    onChange(editingFilters);
  }, [editingFilters, onChange]);

  // Apply search specifically (can be triggered by Enter key or Search button)
  const handleSearch = useCallback(() => {
    onChange(editingFilters);
  }, [editingFilters, onChange]);

  const clearFilter = (filterName: keyof FilterState) => {
    const defaultValues: FilterState = {
      search: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      sortBy: 'newest',
    };
    setEditingFilters(prev => ({ 
      ...prev, 
      [filterName]: defaultValues[filterName] 
    }));
  };

  const clearAllFilters = () => {
    const cleared: FilterState = {
      search: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      sortBy: 'newest',
    };
    setEditingFilters(cleared);
    onChange(cleared);
  };

  const hasActiveFilters =
    filters.search ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.city ||
    filters.sortBy !== 'newest';

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-3 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, description..."
            value={editingFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Search and Filter Buttons */}
        <div className="flex gap-3">
          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-4 py-2 bg-brand-primary text-white rounded-lg font-medium
              hover:bg-brand-secondary hover:text-brand-primary transition-colors flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700
              hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-brand-primary text-white text-xs font-semibold rounded-full">
                {[
                  filters.search,
                  filters.minPrice,
                  filters.maxPrice,
                  filters.city,
                  filters.sortBy !== 'newest' ? filters.sortBy : '',
                ].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-600">$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={editingFilters.minPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                    disabled:bg-white disabled:cursor-not-allowed"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-600">$</span>
                <input
                  type="number"
                  placeholder="No limit"
                  value={editingFilters.maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                    disabled:bg-white disabled:cursor-not-allowed"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="e.g., Denver, Austin"
                value={editingFilters.city}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                  disabled:bg-white disabled:cursor-not-allowed"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={editingFilters.sortBy}
                onChange={(e) =>
                  handleSortChange(
                    e.target.value as 'newest' | 'cheapest' | 'expensive'
                  )
                }
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                  disabled:bg-white disabled:cursor-not-allowed bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="cheapest">Cheapest First</option>
                <option value="expensive">Most Expensive First</option>
              </select>
            </div>
          </div>

          {/* Apply Filters and Clear Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="flex-1 px-4 py-2 font-medium text-white bg-brand-primary
                hover:bg-brand-secondary hover:text-brand-primary transition-colors rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white
                  border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary text-brand-tertiary rounded-full text-sm">
              <span>Search: {filters.search}</span>
              <button
                onClick={() => clearFilter('search')}
                className="hover:text-brand-primary"
              >
                ✕
              </button>
            </div>
          )}

          {filters.minPrice && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary text-brand-tertiary rounded-full text-sm">
              <span>Min: ${filters.minPrice}</span>
              <button
                onClick={() => clearFilter('minPrice')}
                className="hover:text-brand-primary"
              >
                ✕
              </button>
            </div>
          )}

          {filters.maxPrice && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary text-brand-tertiary rounded-full text-sm">
              <span>Max: ${filters.maxPrice}</span>
              <button
                onClick={() => clearFilter('maxPrice')}
                className="hover:text-brand-primary"
              >
                ✕
              </button>
            </div>
          )}

          {filters.city && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary text-brand-tertiary rounded-full text-sm">
              <span>{filters.city}</span>
              <button
                onClick={() => clearFilter('city')}
                className="hover:text-brand-primary"
              >
                ✕
              </button>
            </div>
          )}

          {filters.sortBy !== 'newest' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary text-brand-tertiary rounded-full text-sm">
              <span>
                Sort: {filters.sortBy === 'cheapest' ? 'Cheapest' : 'Most Expensive'}
              </span>
              <button
                onClick={() => clearFilter('sortBy')}
                className="hover:text-brand-primary"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
