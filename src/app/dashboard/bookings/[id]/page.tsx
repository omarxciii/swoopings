/**
 * Booking Detail Page
 * 
 * File Purpose:
 * - View detailed information about a specific booking
 * - Allow owners to scan QR code for handover confirmation
 * - Show handover status for both renters and owners
 * 
 * Route: /dashboard/bookings/[id]
 * 
 * Features:
 * - Complete booking information
 * - QR scanner for owners (pickup handover)
 * - Handover status tracking
 * - Message integration
 * 
 * History:
 * - 2025-12-07: Created for Phase 5.6 QR Handover System
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import QRScanner from '@/components/QRScanner';
import QRDisplay from '@/components/QRDisplay';
import { getOrCreateConversation } from '@/utils/database';

interface BookingDetail {
  id: string;
  listing_id: string;
  renter_id: string;
  listing: {
    title: string;
    owner_id: string;
    owner: {
      username: string;
      email: string;
    };
  };
  renter: {
    username: string;
    email: string;
  };
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  created_at: string;
  qr_secret: string | null;
  handover_confirmed_at: string | null;
  handover_confirmed_by: string | null;
}

export default function BookingDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  const isOwner = booking && user && booking.listing.owner_id === user.id;
  const isRenter = booking && user && booking.renter_id === user.id;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!bookingId) {
      router.push('/dashboard/bookings');
      return;
    }

    fetchBooking();
  }, [user, authLoading, bookingId, router]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load booking details');
      }

      const data = await response.json();
      setBooking(data);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Unable to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = async () => {
    setShowScanner(false);
    // Refresh booking to show updated handover status
    await fetchBooking();
  };

  const handleScanError = (error: string) => {
    alert(`Scan failed: ${error}`);
  };

  const handleMessageUser = async () => {
    if (!user || !booking) return;

    const otherUserId = isOwner ? booking.renter_id : booking.listing.owner_id;

    try {
      setIsMessaging(true);
      const response = await getOrCreateConversation(user.id, otherUserId, booking.listing_id);
      
      if (response.success && response.data) {
        router.push(`/messages/${response.data.id}`);
      } else {
        alert('Failed to start conversation. Please try again.');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsMessaging(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading booking...</p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Error Loading Booking</h1>
            <p className="text-red-700 mb-6">{error || 'Booking not found'}</p>
            <Link
              href="/dashboard/bookings"
              className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-medium
                hover:bg-red-700 transition-colors"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isOwner && !isRenter) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h1>
            <p className="text-red-700 mb-6">You don&rsquo;t have permission to view this booking.</p>
            <Link
              href="/dashboard/bookings"
              className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-medium
                hover:bg-red-700 transition-colors"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const checkInDate = new Date(booking.check_in_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const checkOutDate = new Date(booking.check_out_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handoverDate = booking.handover_confirmed_at
    ? new Date(booking.handover_confirmed_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Booking Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{booking.listing.title}</h1>
            <p className="text-brand-secondary mt-2">
              {isOwner ? `Renter: ${booking.renter.username}` : `Owner: ${booking.listing.owner.username}`}
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Dates and Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Check-in</p>
                <p className="text-lg font-semibold text-gray-900">{checkInDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Check-out</p>
                <p className="text-lg font-semibold text-gray-900">{checkOutDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Price</p>
                <p className="text-lg font-semibold text-brand-tertiary">
                  ${booking.total_price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Booking Status</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
                {booking.handover_confirmed_at ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Handed Over ✓
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Pending Handover
                  </span>
                )}
              </div>
            </div>

            {/* Booking ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Booking ID</p>
              <p className="font-mono text-sm text-gray-900">{booking.id}</p>
            </div>
          </div>
        </div>

        {/* Handover Status */}
        {booking.handover_confirmed_at && handoverDate && (
          <div className="bg-brand-secondary border border-brand-tertiary rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-tertiary rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-1">Item Handed Over</h3>
                <p className="text-brand-primary">Confirmed on {handoverDate}</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Display (Renter Only, Confirmed Booking, Not Yet Handed Over) */}
        {isRenter && booking.status === 'confirmed' && !booking.handover_confirmed_at && booking.qr_secret && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Pickup QR Code</h3>
            
            {!showQR ? (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Show this QR code to the owner at pickup. They will scan it to confirm the handover and start your rental.
                </p>
                <button
                  onClick={() => setShowQR(true)}
                  className="px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
                    hover:opacity-90 transition-opacity"
                >
                  Display QR Code to Start Booking
                </button>
              </div>
            ) : (
              <div>
                <QRDisplay
                  bookingId={booking.id}
                  qrSecret={booking.qr_secret}
                  listingTitle={booking.listing.title}
                  checkInDate={booking.check_in_date}
                  isHandedOver={false}
                />
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-4 w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium
                    hover:bg-gray-200 transition-colors"
                >
                  Hide QR Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* QR Scanner (Owner Only, Confirmed Booking, Not Yet Handed Over) */}
        {isOwner && booking.status === 'confirmed' && !booking.handover_confirmed_at && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Pickup Handover</h3>
            
            {!showScanner ? (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  When the renter arrives for pickup, ask them to show their QR code and scan it to confirm the handover.
                </p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
                    hover:opacity-90 transition-opacity"
                >
                  Scan QR Code to Start Booking
                </button>
              </div>
            ) : (
              <div>
                <QRScanner
                  bookingId={booking.id}
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
                <button
                  onClick={() => setShowScanner(false)}
                  className="mt-4 w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium
                    hover:bg-gray-200 transition-colors"
                >
                  Cancel Scanning
                </button>
              </div>
            )}
          </div>
        )}

        {/* Waiting for Confirmation Message */}
        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                  {isOwner ? 'Pending Your Confirmation' : 'Waiting for Owner Confirmation'}
                </h3>
                <p className="text-yellow-800">
                  {isOwner 
                    ? 'Please review and confirm this booking. QR code will be available once confirmed.'
                    : 'The owner needs to confirm your booking. QR code will be available once confirmed.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={handleMessageUser}
            disabled={isMessaging}
            className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
              hover:opacity-90 disabled:opacity-50 transition-opacity text-center cursor-pointer"
          >
            {isMessaging ? 'Loading...' : `Message ${isOwner ? 'Renter' : 'Owner'}`}
          </button>
          <Link
            href="/dashboard/bookings"
            className="flex-1 px-6 py-3 bg-brand-neutralgreen text-brand-primary rounded-lg font-semibold
              hover:opacity-90 transition-opacity text-center"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    </main>
  );
}
