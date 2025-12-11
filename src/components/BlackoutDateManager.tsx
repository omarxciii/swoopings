/**
 * Blackout Date Manager Component
 * 
 * File Purpose:
 * - Allow listing owners to block specific date ranges when their item is unavailable
 * - Display calendar interface for selecting blackout periods
 * - Add/remove blackout dates with optional reason
 * - Show list of existing blackout dates
 * 
 * Features:
 * - Calendar date range selection
 * - Reason/note for each blackout period
 * - Delete existing blackout dates
 * - Visual feedback and error handling
 * - Prevents overlapping blackout dates
 * 
 * Props:
 * - listingId: ID of the listing
 * - onUpdate: Callback when blackout dates change
 * 
 * Dependencies:
 * - React hooks
 * - src/utils/database
 * 
 * History:
 * - 2025-12-11: Initial creation for Phase 5.5c
 */

'use client';

import { useState, useEffect } from 'react';
import { addBlackoutDate, deleteBlackoutDate, getListingBlackoutDates } from '@/utils/database';

interface BlackoutDate {
  id: string;
  listing_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason?: string;
  created_at: string;
}

interface BlackoutDateManagerProps {
  listingId: string;
  onUpdate?: () => void;
}

export default function BlackoutDateManager({ listingId, onUpdate }: BlackoutDateManagerProps) {
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state for new blackout date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadBlackoutDates();
  }, [listingId]);

  const loadBlackoutDates = async () => {
    setLoading(true);
    setError(null);
    
    const response = await getListingBlackoutDates(listingId);
    
    if (response.success && response.data) {
      setBlackoutDates(response.data);
    } else {
      setError(response.error || 'Failed to load blackout dates');
    }
    
    setLoading(false);
  };

  const handleAddBlackoutDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validation
    if (!startDate || !endDate) {
      setFormError('Both start and end dates are required');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      setFormError('End date must be after start date');
      return;
    }
    
    // Check for overlaps
    const hasOverlap = blackoutDates.some(existing => {
      const existingStart = new Date(existing.start_date);
      const existingEnd = new Date(existing.end_date);
      
      return (
        (start >= existingStart && start < existingEnd) ||
        (end > existingStart && end <= existingEnd) ||
        (start <= existingStart && end >= existingEnd)
      );
    });
    
    if (hasOverlap) {
      setFormError('This date range overlaps with an existing blackout period');
      return;
    }
    
    setIsAdding(true);
    
    const response = await addBlackoutDate(listingId, startDate, endDate, reason || undefined);
    
    if (response.success) {
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setFormError('');
      
      // Reload list
      await loadBlackoutDates();
      
      // Notify parent
      if (onUpdate) onUpdate();
    } else {
      setFormError(response.error || 'Failed to add blackout date');
    }
    
    setIsAdding(false);
  };

  const handleDeleteBlackoutDate = async (blackoutId: string) => {
    if (!confirm('Are you sure you want to remove this blackout period?')) {
      return;
    }
    
    const response = await deleteBlackoutDate(blackoutId);
    
    if (response.success) {
      await loadBlackoutDates();
      if (onUpdate) onUpdate();
    } else {
      alert(response.error || 'Failed to remove blackout date');
    }
  };

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const getTodayString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-primary mb-2">Blackout Dates</h3>
        <p className="text-sm text-gray-600">
          Block specific date ranges when your item is unavailable (maintenance, personal use, etc.)
        </p>
      </div>

      {/* Add New Blackout Date Form */}
      <div className="space-y-4 p-4 bg-brand-neutralgreen border border-brand-tertiary rounded-lg">
        <h4 className="font-medium text-brand-primary">Add Blackout Period</h4>
        
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {formError}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={getTodayString()}
              disabled={isAdding}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || getTodayString()}
              disabled={isAdding}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-brand-primary mb-1">
            Reason (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Maintenance, Personal use, Repair"
            disabled={isAdding}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        
        <button
          type="button"
          onClick={(e) => handleAddBlackoutDate(e)}
          disabled={isAdding}
          className="w-full sm:w-auto px-6 py-2 bg-brand-primary text-white rounded-lg font-medium
            hover:bg-brand-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Adding...' : 'Add Blackout Period'}
        </button>
      </div>

      {/* Existing Blackout Dates List */}
      <div>
        <h4 className="font-medium text-brand-primary mb-3">
          Current Blackout Periods ({blackoutDates.length})
        </h4>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            {error}
          </div>
        )}
        
        {blackoutDates.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No blackout dates set</p>
        ) : (
          <div className="space-y-3">
            {blackoutDates.map((blackout) => (
              <div
                key={blackout.id}
                className="flex items-start justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-brand-primary transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-brand-primary">
                      {formatDateRange(blackout.start_date, blackout.end_date)}
                    </span>
                  </div>
                  {blackout.reason && (
                    <p className="text-sm text-gray-600 ml-6">{blackout.reason}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteBlackoutDate(blackout.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove blackout period"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
