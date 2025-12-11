/**
 * User's Listings Dashboard
 * 
 * File Purpose:
 * - Display user's own rental listings
 * - Allow editing and deleting listings
 * - Show listing statistics (views, bookings)
 * - Create new listing button
 * - Status management (active/inactive/archived)
 * 
 * Features:
 * - Grid/table view of user's listings
 * - Edit button to update listing details
 * - Delete button with confirmation
 * - Show listing status
 * - Quick links to listing detail pages
 * - Empty state if no listings
 * - Loading and error states
 * - Protected route (requires authentication)
 * 
 * Dependencies:
 * - React hooks (useEffect, useState)
 * - getUserListings, updateListing, deleteListing from database.ts
 * - useAuthContext from AuthProvider
 * - ProtectedRoute component
 * 
 * Data Flow:
 * 1. Fetch user's listings
 * 2. Display in table/grid
 * 3. Show edit/delete actions
 * 4. Edit updates listing in database
 * 5. Delete removes listing after confirmation
 * 6. Success message on changes
 * 
 * Notes:
 * - RLS policies ensure users only see their own listings
 * - Delete requires confirmation to prevent accidents
 * - Status changes allow deactivating without deleting
 * - Links to edit page added in Phase 3
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/providers/AuthProvider';
import { getUserListings, deleteListing, updateListing } from '@/utils/database';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types';

export default function DashboardListingsPage() {
  const { user } = useAuthContext();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await getUserListings(user.id);

        if (!response.success || !response.data) {
          setError(response.error || 'Failed to fetch listings');
          setListings([]);
          return;
        }

        setListings(response.data);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [user?.id]);

  const handleToggleStatus = async (listing: Listing) => {
    if (!user?.id) return;

    const newStatus = listing.status === 'active' ? 'inactive' : 'active';

    try {
      const response = await updateListing(listing.id, { status: newStatus });

      if (!response.success) {
        setError(response.error || 'Failed to update listing status');
        return;
      }

      // Update local state
      setListings(listings.map((l) =>
        l.id === listing.id ? { ...l, status: newStatus } : l
      ));

      setSuccessMessage(
        `Listing ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating listing:', err);
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!user?.id) return;

    setDeletingId(listingId);

    try {
      const response = await deleteListing(listingId);

      if (!response.success) {
        setError(response.error || 'Failed to delete listing');
        setDeletingId(null);
        return;
      }

      // Update local state
      setListings(listings.filter((l) => l.id !== listingId));
      setConfirmDeleteId(null);

      setSuccessMessage('Listing deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
              <p className="text-gray-600">
                Manage your rental items and track bookings
              </p>
            </div>
            <Link
              href="/listings/create"
              className="px-6 py-2 bg-brand-primary text-white rounded-lg font-medium
                hover:bg-brand-tertiary transition-colors whitespace-nowrap"
            >
              Create Listing
            </Link>
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-600">Loading your listings...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && listings.length === 0 && (
            <div className="bg-brand-secondary border border-brand-tertiary rounded-lg p-12 text-center">
              <p className="text-brand-primary font-medium text-lg">No listings yet</p>
              <p className="text-brand-primary text-sm mt-2">
                Create your first listing to start earning
              </p>
              <Link
                href="/listings/create"
                className="inline-block mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg font-medium
                  hover:bg-blue-700 transition-colors"
              >
                Create First Listing
              </Link>
            </div>
          )}

          {/* Listings Grid */}
          {!isLoading && !error && listings.length > 0 && (
            <div className="space-y-8">
              {/* Active Listings */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Active Listings ({listings.filter((l) => l.status === 'active').length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {listings
                    .filter((l) => l.status === 'active')
                    .map((listing) => (
                      <div key={listing.id} className="relative group">
                        <ListingCard listing={listing} />
                        {/* Action Buttons */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 rounded-lg transition-colors duration-200 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2 w-full">
                            <Link
                              href={`/listings/${listing.id}`}
                              className="flex-1 px-3 py-2 bg-white text-gray-900 rounded font-medium text-sm
                                hover:bg-gray-100 transition-colors text-center"
                            >
                              View
                            </Link>
                            <Link
                              href={`/dashboard/listings/${listing.id}/edit`}
                              className="flex-1 px-3 py-2 bg-brand-primary text-white rounded font-medium text-sm
                                hover:bg-brand-tertiary transition-colors text-center"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(listing)}
                              className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded font-medium text-sm
                                hover:bg-yellow-600 transition-colors"
                            >
                              Deactivate
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(listing.id)}
                              className="flex-1 px-3 py-2 bg-red-500 text-white rounded font-medium text-sm
                                hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Inactive Listings */}
              {listings.some((l) => l.status === 'inactive') && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Inactive Listings ({listings.filter((l) => l.status === 'inactive').length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings
                      .filter((l) => l.status === 'inactive')
                      .map((listing) => (
                        <div key={listing.id} className="relative group opacity-75">
                          <ListingCard listing={listing} />
                          <div className="absolute top-2 left-2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Inactive
                          </div>
                          {/* Action Buttons */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 rounded-lg transition-colors duration-200 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2 w-full">
                              <Link
                                href={`/dashboard/listings/${listing.id}/edit`}
                                className="flex-1 px-3 py-2 bg-brand-primary text-white rounded font-medium text-sm
                                  hover:bg-brand-tertiary transition-colors text-center"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(listing)}
                                className="flex-1 px-3 py-2 bg-green-500 text-white rounded font-medium text-sm
                                  hover:bg-green-600 transition-colors"
                              >
                                Activate
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(listing.id)}
                                className="flex-1 px-3 py-2 bg-red-500 text-white rounded font-medium text-sm
                                  hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Archived Listings */}
              {listings.some((l) => l.status === 'archived') && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Archived Listings ({listings.filter((l) => l.status === 'archived').length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings
                      .filter((l) => l.status === 'archived')
                      .map((listing) => (
                        <div key={listing.id} className="relative group opacity-50">
                          <ListingCard listing={listing} />
                          <div className="absolute top-2 left-2 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Archived
                          </div>
                          {/* Action Buttons */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 rounded-lg transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Link
                                href={`/dashboard/listings/${listing.id}/edit`}
                                className="px-4 py-2 bg-brand-primary text-white rounded font-medium text-sm
                                  hover:bg-brand-tertiary transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => setConfirmDeleteId(listing.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded font-medium text-sm
                                  hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Listing?</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this listing? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId === confirmDeleteId}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium
                    hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium
                    hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

