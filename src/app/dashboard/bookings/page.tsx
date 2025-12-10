/**
 * Dashboard Bookings Page
 * 
 * File Purpose:
 * - Display user's bookings (both as renter and owner)
 * - Show bookings in different tabs/sections
 * - Allow filtering by status (pending, confirmed, completed)
 * - Integration with booking management
 * 
 * Features:
 * - Dual-view: Items I'm renting vs My items rented
 * - Real-time status updates
 * - Fetch associated listings and profiles
 * - Empty state messaging with relevant CTAs
 * 
 * High-Level Logic:
 * - Fetch user bookings (as renter and owner)
 * - Fetch associated listing and profile data
 * - Display bookings in organized layout
 * - Handle booking status updates
 * 
 * History:
 * - 2025-12-07: Replaced placeholder with full implementation
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserBookingsAsRenter,
  getUserBookingsAsOwner,
  getListing,
  getPublicProfile,
  updateBookingStatus,
} from '@/utils/database';
import BookingCard from '@/components/BookingCard';
import type { Booking, Listing, Profile } from '@/types';

export default function DashboardBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [renterBookings, setRenterBookings] = useState<Booking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'renting' | 'lending'>('renting');

  const [listingCache, setListingCache] = useState<Record<string, Listing>>({});
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both renter and owner bookings
        const [renterRes, ownerRes] = await Promise.all([
          getUserBookingsAsRenter(user.id),
          getUserBookingsAsOwner(user.id),
        ]);

        if (renterRes.success) {
          setRenterBookings(renterRes.data || []);
        }

        if (ownerRes.success) {
          setOwnerBookings(ownerRes.data || []);
        }

        // Fetch all associated listings and profiles
        const allBookings = [...(renterRes.data || []), ...(ownerRes.data || [])];
        const listingIds = new Set(allBookings.map(b => b.listing_id));
        const userIds = new Set(
          allBookings.map(b => (b.renter_id === user.id ? b.owner_id : b.renter_id))
        );

        const listings: Record<string, Listing> = {};
        const profiles: Record<string, Profile> = {};

        // Fetch listings
        for (const listingId of listingIds) {
          const listingRes = await getListing(listingId);
          if (listingRes.success && listingRes.data) {
            listings[listingId] = listingRes.data;
          }
        }

        // Fetch profiles
        for (const userId of userIds) {
          const profileRes = await getPublicProfile(userId);
          if (profileRes.success && profileRes.data) {
            profiles[userId] = profileRes.data;
          }
        }

        setListingCache(listings);
        setProfileCache(profiles);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, loading, router]);

  const handleStatusChange = async (
    bookingId: string,
    newStatus: 'confirmed' | 'cancelled' | 'completed'
  ) => {
    try {
      const response = await updateBookingStatus(bookingId, newStatus);

      if (response.success) {
        // Update local state
        setRenterBookings(renterBookings.map(b =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        ));
        setOwnerBookings(ownerBookings.map(b =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        ));
      } else {
        setError('Failed to update booking. Please try again.');
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const bookingsToShow = activeTab === 'renting' ? renterBookings : ownerBookings;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your rentals and listings</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('renting')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'renting'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Items I&apos;m Renting ({renterBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('lending')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'lending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Items Rented ({ownerBookings.length})
          </button>
        </div>

        {/* Bookings list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          </div>
        ) : bookingsToShow.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {activeTab === 'renting' ? "You haven't rented anything yet" : 'No one has rented your items yet'}
            </p>
            <a
              href={activeTab === 'renting' ? '/listings' : '/dashboard/listings'}
              className="inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              {activeTab === 'renting' ? 'Browse Listings' : 'Manage Listings'}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingsToShow.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                listing={listingCache[booking.listing_id] || { title: 'Loading...', city: '', id: '', owner_id: '', description: '', price_per_day: 0, location: '', image_urls: [], status: 'active', created_at: '', updated_at: '' }}
                otherUser={
                  activeTab === 'renting'
                    ? profileCache[booking.owner_id] || null
                    : profileCache[booking.renter_id] || null
                }
                isOwner={activeTab === 'lending'}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
