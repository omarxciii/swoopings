/**
 * Browse Listings Page
 * 
 * File Purpose:
 * - Display grid of all available rental listings
 * - Allows users to browse and search listings
 * - Click on listing to view details and booking form
 * - Shows owner ratings and reviews
 * 
 * Features:
 * - Grid layout responsive across devices
 * - Listings fetched from database
 * - Error handling and loading states
 * - Link to create listing (authenticated users)
 * - Empty state message if no listings
 * - Placeholder for search/filters (Phase 3)
 * 
 * Dependencies:
 * - React hooks (useEffect, useState)
 * - getListings, getPublicProfile from database.ts
 * - ListingCard component
 * - src/types/index.ts
 * 
 * Data Flow:
 * 1. Page loads and fetches active listings
 * 2. For each listing, fetch owner's public profile
 * 3. Display in grid with ListingCard components
 * 4. Handle loading and error states
 * 5. Users can click to view details
 * 
 * Notes:
 * - Only shows listings with status='active'
 * - Owner data fetched to show ratings
 * - Could add caching in future for performance
 * - Search/filters added in Phase 3
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import SearchFilters, { FilterState } from '@/components/SearchFilters';
import { getListingsWithFilters, getPublicProfile } from '@/utils/database';
import { useAuthContext } from '@/providers/AuthProvider';
import type { Listing, Profile } from '@/types';

interface ListingWithOwner extends Listing {
  owner?: Profile;
}

function ListingsContent() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<ListingWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    city: searchParams.get('city') || '',
    sortBy: (searchParams.get('sort') as 'newest' | 'cheapest' | 'expensive') || 'newest',
  });

  // Fetch listings whenever filters change
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert filter strings to numbers
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : undefined;
        const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : undefined;

        // Fetch listings with filters
        const response = await getListingsWithFilters(
          filters.search || undefined,
          minPrice,
          maxPrice,
          filters.city || undefined,
          filters.sortBy,
          100,
          0
        );

        if (!response.success || !response.data) {
          setError(response.error || 'Failed to fetch listings');
          setListings([]);
          return;
        }

        // Fetch owner profile for each listing
        const listingsWithOwners = await Promise.all(
          response.data.map(async (listing) => {
            try {
              const ownerResponse = await getPublicProfile(listing.owner_id);
              return {
                ...listing,
                owner: ownerResponse.data || undefined,
              };
            } catch (err) {
              console.error('Error fetching owner profile:', err);
              return listing;
            }
          })
        );

        setListings(listingsWithOwners);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [filters]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    
    // Update URL parameters for shareable/bookmarkable filters
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.sortBy !== 'newest') params.set('sort', newFilters.sortBy);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/listings${newUrl}`);
  };

  return (
    <main className="min-h-screen bg-brand-neutralpink">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Listings</h1>
            <p className="text-gray-600">
              Discover items available to rent in your area
            </p>
          </div>
          {user && (
            <Link
              href="/listings/create"
              className="px-6 py-2 bg-brand-accent text-brand-primary rounded-lg font-bold
                hover:bg-brand-lightpink transition-colors whitespace-nowrap"
            >
              Create Listing
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <SearchFilters 
            filters={filters} 
            onChange={handleFiltersChange} 
            isLoading={isLoading}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-brand-accent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading listings...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error Loading Listings</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className="bg-brand-neutralgreen border border-brand-tertiary rounded-lg p-12 text-center">
            <p className="text-brand-primary font-medium text-lg">
              {Object.values(filters).some(v => v) 
                ? 'No listings match your filters' 
                : 'No listings yet'}
            </p>
            <p className="text-brand-tertiary text-sm mt-2">
              {Object.values(filters).some(v => v) 
                ? 'Try adjusting your search criteria' 
                : 'Be the first to create a listing!'}
            </p>
            {Object.values(filters).some(v => v) && (
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    minPrice: '',
                    maxPrice: '',
                    city: '',
                    sortBy: 'newest',
                  });
                  window.history.replaceState({}, '', '/listings');
                }}
                className="inline-block mt-4 px-6 py-2 bg-brand-tertiary text-white rounded-lg font-medium
                  hover:bg-brand-primary hover:text-brand-secondary transition-colors"
              >
                Clear All Filters
              </button>
            )}
            {!Object.values(filters).some(v => v) && user && (
              <Link
                href="/listings/create"
                className="inline-block mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg font-medium
                  hover:bg-brand-secondary transition-colors"
              >
                Create First Listing
              </Link>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {!isLoading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                ownerName={listing.owner?.username || 'Unknown'}
                ownerRating={listing.owner?.rating || undefined}
                showOwner={true}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && listings.length > 0 && (
          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>
              Showing {listings.length} listing{listings.length !== 1 ? 's' : ''}
              {Object.values(filters).some(v => v) && ' (filtered)'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}

