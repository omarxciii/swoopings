/**
 * Edit Listing Page
 * 
 * File Purpose:
 * - Allow listing owner to edit their listing details
 * - Update availability settings (day-of-week availability)
 * - Manage blackout dates (vacation/maintenance periods)
 * - Update photos, pricing, description, location
 * 
 * Features:
 * - Load existing listing data
 * - Form with all editable fields
 * - AvailabilityForm for day-of-week settings
 * - BlackoutDateManager for blocking specific date ranges
 * - Image upload/update
 * - Save changes button
 * - Success/error messaging
 * 
 * Route: /dashboard/listings/[id]/edit
 * 
 * Dependencies:
 * - getListingById, updateListing from database.ts
 * - AvailabilityForm component
 * - BlackoutDateManager component
 * - useAuthContext from AuthProvider
 * 
 * History:
 * - 2025-12-11: Created for Phase 5.5c blackout dates feature
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthContext } from '@/providers/AuthProvider';
import { getListing, updateListing, getListingAvailability, setListingAvailability } from '@/utils/database';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AvailabilityForm from '@/components/AvailabilityForm';
import BlackoutDateManager from '@/components/BlackoutDateManager';
import type { Listing } from '@/types';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user } = useAuthContext();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  
  // Availability state (array of day numbers: 0=Sunday, 6=Saturday)
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  useEffect(() => {
    loadListing();
  }, [listingId]);

  const loadListing = async () => {
    setLoading(true);
    setError(null);
    
    // Load listing basic info
    const listingResponse = await getListing(listingId);
    
    if (listingResponse.success && listingResponse.data) {
      const listingData = listingResponse.data;
      
      // Check if user owns this listing
      if (listingData.owner_id !== user?.id) {
        setError('You do not have permission to edit this listing');
        setLoading(false);
        return;
      }
      
      setListing(listingData);
      
      // Populate form fields
      setTitle(listingData.title);
      setDescription(listingData.description || '');
      setPricePerDay(listingData.price_per_day.toString());
      setLocation(listingData.location || '');
      setCity(listingData.city || '');
      
      // Load availability separately
      const availabilityResponse = await getListingAvailability(listingId);
      if (availabilityResponse.success && availabilityResponse.data) {
        setAvailableDays(availabilityResponse.data);
      }
    } else {
      setError(listingResponse.error || 'Failed to load listing');
    }
    
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!listing) return;
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      setSaving(false);
      return;
    }
    
    const price = parseFloat(pricePerDay);
    if (isNaN(price) || price <= 0) {
      setError('Price must be a positive number');
      setSaving(false);
      return;
    }
    
    // Update listing basic info
    const listingResponse = await updateListing(listingId, {
      title: title.trim(),
      description: description.trim(),
      price_per_day: price,
      location: location.trim(),
      city: city.trim(),
    });
    
    if (!listingResponse.success) {
      setError(listingResponse.error || 'Failed to update listing');
      setSaving(false);
      return;
    }
    
    // Update availability separately
    const availabilityResponse = await setListingAvailability(listingId, availableDays);
    
    if (!availabilityResponse.success) {
      setError(availabilityResponse.error || 'Failed to update availability');
      setSaving(false);
      return;
    }
    
    setSuccessMessage('Listing updated successfully!');
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
    
    setSaving(false);
  };

  const handleBlackoutDatesUpdate = () => {
    // Callback when blackout dates change
    // Could refresh listing data or just show a message
    setSuccessMessage('Blackout dates updated!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error && !listing) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push('/dashboard/listings')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to My Listings
              </button>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard/listings')}
              className="text-brand-primary hover:text-brand-tertiary mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to My Listings
            </button>
            <h1 className="text-3xl font-bold text-brand-primary">Edit Listing</h1>
            <p className="text-gray-600 mt-2">Update your listing details, availability, and blackout dates</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-brand-primary mb-4">Basic Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mountain Bike - Trek X-Caliber"
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                    disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item, its condition, and any special features..."
                  disabled={saving}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                    disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1">
                    Price per Day *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      placeholder="50"
                      disabled={saving}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                        disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., 123 Main St"
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                      disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., San Francisco"
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none
                      disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Availability Settings */}
            <AvailabilityForm
              availableDays={availableDays}
              onChange={setAvailableDays}
            />

            {/* Blackout Dates */}
            <BlackoutDateManager
              listingId={listingId}
              onUpdate={handleBlackoutDatesUpdate}
            />

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/listings')}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium
                  hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-3 bg-brand-primary text-white rounded-lg font-medium
                  hover:bg-brand-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
