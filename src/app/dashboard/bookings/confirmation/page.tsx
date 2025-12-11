/**
 * Booking Confirmation Page
 * 
 * File Purpose:
 * - Display payment and booking confirmation
 * - Show booking details and next steps
 * - Provide links to manage booking
 * 
 * Route: GET /dashboard/bookings/confirmation?bookingId={id}
 * 
 * Query Parameters:
 * - bookingId: UUID of the newly created booking
 * 
 * Features:
 * - Shows booking summary with dates and total price
 * - Displays confirmation message
 * - Shows next steps for renter
 * - Links to messaging and booking management
 * 
 * History:
 * - 2025-12-07: Initial creation for Phase 5.4
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { getOrCreateConversation } from '@/utils/database';

interface BookingConfirmation {
  id: string;
  listing_id: string;
  listing: {
    title: string;
    owner_id: string;
    owner: {
      username: string;
    };
  };
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  created_at: string;
  qr_secret: string | null;
  handover_confirmed_at: string | null;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);

  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    // Wait for auth to load before doing anything
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!bookingId) {
      router.push('/dashboard/bookings');
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Get auth token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`/api/bookings/${bookingId}`, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        clearTimeout(timeoutId);

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

    fetchBooking();
  }, [user, authLoading, bookingId, router]);

  const handleMessageOwner = async () => {
    if (!user || !booking) return;

    try {
      setIsMessaging(true);
      const response = await getOrCreateConversation(user.id, booking.listing.owner_id, booking.listing_id);
      
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
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Error Loading Confirmation</h1>
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

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-brand-secondary border border-brand-tertiary rounded-lg p-8 text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-brand-tertiary"
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
          </div>
          <h1 className="text-3xl font-bold text-brand-tertiary mb-2">Booking Confirmed!</h1>
          <p className="text-brand-tertiary">Your payment was successful and your booking is confirmed.</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary px-8 py-6">
            <h2 className="text-2xl font-bold text-white">{booking.listing.title}</h2>
            <p className="text-brand-secondary mt-2">Owner: {booking.listing.owner.username}</p>
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
                {/* TODO: Future currency switch - RON: RON {(booking.total_price * exchangeRate).toFixed(2)} */}
              </div>
            </div>

            {/* Booking ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Booking ID</p>
              <p className="font-mono text-sm text-gray-900">{booking.id}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-brand-secondary border border-brand-tertiary rounded-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-brand-primary mb-4">What&rsquo;s Next?</h3>
          <ol className="space-y-3 text-brand-primary">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span>Check your email for booking confirmation and owner details</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span>Message the owner to coordinate pickup and handover details</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span>Once confirmed, view your booking to access your QR code for pickup verification</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <span>Return by check-out date and confirm with owner</span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={handleMessageOwner}
            disabled={isMessaging}
            className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
              hover:opacity-90 disabled:opacity-50 transition-opacity text-center cursor-pointer"
          >
            {isMessaging ? 'Loading...' : 'Message Owner'}
          </button>
          <Link
            href="/dashboard/bookings"
            className="flex-1 px-6 py-3 bg-brand-neutralgreen text-brand-primary rounded-lg font-semibold
              hover:opacity-90 transition-opacity text-center"
          >
            View All Bookings
          </Link>
          <Link
            href="/listings"
            className="flex-1 px-6 py-3 bg-brand-neutralgreen text-brand-primary rounded-lg font-semibold
              hover:opacity-90 transition-opacity text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
