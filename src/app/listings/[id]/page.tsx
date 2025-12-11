/**
 * Listing Detail Page
 * 
 * File Purpose:
 * - Display full details of a single rental listing
 * - Shows owner information and booking interface
 * - Dynamic route based on listing ID
 * - Allows authenticated users to make bookings
 * 
 * Features:
 * - Image gallery/carousel
 * - Full listing details (title, description, price)
 * - Owner profile with rating and reviews
 * - Location map placeholder (Phase 4)
 * - Booking form with date picker (Phase 4)
 * - Contact owner button (Phase 5)
 * - Safety/Trust information
 * - Similar listings suggestions
 * 
 * Dependencies:
 * - React hooks (useEffect, useState)
 * - getListing, getPublicProfile from database.ts
 * - useAuthContext from AuthProvider
 * - src/types/index.ts
 * 
 * Data Flow:
 * 1. Route receives listing ID from URL params
 * 2. Fetch listing from database
 * 3. Fetch owner's public profile
 * 4. Display all details
 * 5. Show booking form (authenticated users only)
 * 
 * Notes:
 * - Check if listing is active/exists
 * - Show error if listing not found or inactive
 * - Owner info public (profile viewable by all)
 * - Booking form added in Phase 4
 * - Map integration in Phase 4
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getListing, getPublicProfile, getOrCreateConversation, createBooking, getUnavailableDates, getListingBookings, getListingBlackoutDates } from '@/utils/database';
import { useAuthContext } from '@/providers/AuthProvider';
import DateRangePicker from '@/components/DateRangePicker';
import { PaymentModal } from '@/components/PaymentModal';
import type { Listing, Profile } from '@/types';

interface BookingRange {
  check_in_date: string;
  check_out_date: string;
  status: 'confirmed' | 'pending';
}

interface ListingDetailProps {
  params: {
    id: string;
  };
}

export default function ListingDetailPage({ params }: ListingDetailProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<BookingRange[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<Array<{start_date: string; end_date: string}>>([]);
  const [isMessaging, setIsMessaging] = useState(false);
  
  // Booking states
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isBooking, setIsBooking] = useState(false);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch listing
        const listingResponse = await getListing(params.id);

        if (!listingResponse.success || !listingResponse.data) {
          setError(listingResponse.error || 'Listing not found');
          setListing(null);
          return;
        }

        const listingData = listingResponse.data;

        // Check if listing is active
        if (listingData.status !== 'active') {
          setError('This listing is no longer available');
          return;
        }

        setListing(listingData);

        // Fetch unavailable dates for next 2 months
        try {
          const today = new Date();
          const futureDate = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
          const unavailRes = await getUnavailableDates(listingData.id, today, futureDate);
          if (unavailRes.success && unavailRes.data) {
            console.log(`[ListingDetailPage] Unavailable dates for listing ${listingData.id}:`, unavailRes.data);
            setUnavailableDates(unavailRes.data);
          }
        } catch (err) {
          console.error('Error fetching unavailable dates:', err);
        }

        // Fetch existing bookings for the listing
        try {
          const bookingsRes = await getListingBookings(listingData.id);
          if (bookingsRes.success && bookingsRes.data) {
            // Filter to only confirmed and pending bookings
            const confirmedPending = bookingsRes.data
              .filter(booking => booking.status === 'confirmed' || booking.status === 'pending')
              .map(booking => ({
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
                status: booking.status as 'confirmed' | 'pending'
              }));
            console.log(`[ListingDetailPage] Booked dates for listing ${listingData.id}:`, confirmedPending);
            setBookedDates(confirmedPending);
          }
        } catch (err) {
          console.error('Error fetching bookings:', err);
        }

        // Fetch blackout dates for the listing
        try {
          const blackoutRes = await getListingBlackoutDates(listingData.id);
          if (blackoutRes.success && blackoutRes.data) {
            console.log(`[ListingDetailPage] Blackout dates for listing ${listingData.id}:`, blackoutRes.data);
            setBlackoutDates(blackoutRes.data);
          }
        } catch (err) {
          console.error('Error fetching blackout dates:', err);
        }

        // Fetch owner profile
        try {
          const ownerResponse = await getPublicProfile(listingData.owner_id);
          if (ownerResponse.success) {
            setOwner(ownerResponse.data);
          }
        } catch (err) {
          console.error('Error fetching owner profile:', err);
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch listing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [params.id]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const handlePrevImage = () => {
    if (listing && listing.image_urls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? listing.image_urls.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (listing && listing.image_urls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === listing.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleMessageOwner = async () => {
    if (!user || !listing) return;

    try {
      setIsMessaging(true);
      const response = await getOrCreateConversation(user.id, listing.owner_id, listing.id);
      
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

  const handleDateRangeChange = (checkIn: string, checkOut: string, price: number) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setTotalPrice(price);
  };

  const handleBookingClick = () => {
    if (!user || !listing || !checkInDate || !checkOutDate) return;
    // Show payment modal instead of directly booking
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!user || !listing || !checkInDate || !checkOutDate) return;

    try {
      setIsBooking(true);
      
      // Create booking with payment_intent_id
      // total_price is stored in dollars in the database (DECIMAL(10,2))
      const bookingResponse = await createBooking({
        listing_id: listing.id,
        renter_id: user.id,
        owner_id: listing.owner_id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_price: Math.round(totalPrice * 100) / 100, // Round to cents (dollars with 2 decimals)
        status: 'pending',
        payment_intent_id: paymentIntentId,
      });

      if (bookingResponse.success && bookingResponse.data) {
        // Payment and booking successful
        setShowPaymentModal(false);
        // Redirect to confirmation page with booking ID
        router.push(`/dashboard/bookings/confirmation?bookingId=${bookingResponse.data.id}`);
      } else {
        setPaymentError('Booking creation failed. Please contact support.');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setPaymentError('An error occurred. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Unable to Load Listing</h1>
            <p className="text-red-700 mb-4">{error || 'Listing not found'}</p>
            <Link
              href="/listings"
              className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-medium
                hover:bg-red-700 transition-colors"
            >
              Back to Listings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const mainImage = listing.image_urls[currentImageIndex];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-tertiary mb-6 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Listings
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image Gallery */}
          <div className="relative bg-gray-200 h-96 sm:h-[500px]">
            {mainImage ? (
              <img
                src={mainImage}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <span className="text-gray-500">No image</span>
              </div>
            )}

            {/* Image Navigation - Only show if multiple images */}
            {listing.image_urls.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 
                    text-white p-2 rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 
                    text-white p-2 rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {listing.image_urls.length}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-brand-primary">
                  {formatPrice(listing.price_per_day)}
                </span>
                <span className="text-gray-600">per day</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-gray-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-lg font-medium text-gray-900">
                  {listing.location}, {listing.city}
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About this item</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Owner Information */}
            {owner && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About the owner</h2>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{owner.username}</p>
                    {owner.full_name && (
                      <p className="text-sm text-gray-600">{owner.full_name}</p>
                    )}
                    {owner.city && (
                      <p className="text-sm text-gray-600">📍 {owner.city}</p>
                    )}
                    {owner.bio && (
                      <p className="text-sm text-gray-700 mt-2">{owner.bio}</p>
                    )}
                  </div>
                  {owner.rating && (
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-lg font-semibold text-gray-900">
                          {owner.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {owner.total_reviews} review{owner.total_reviews !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Booking Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Book this listing</h2>
              {user && user.id !== listing.owner_id ? (
                <div className="space-y-4">
                  <DateRangePicker
                    pricePerDay={listing.price_per_day}
                    unavailableDates={unavailableDates}
                    bookedDates={bookedDates}
                    blackoutDates={blackoutDates}
                    onDateRangeChange={handleDateRangeChange}
                  />
                  
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{paymentError}</p>
                    </div>
                  )}
                  
                  {checkInDate && checkOutDate && (
                    <button
                      onClick={handleBookingClick}
                      disabled={isBooking}
                      className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
                        hover:bg-brand-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isBooking ? 'Processing...' : `Book Now - $${(totalPrice).toFixed(2)}`}
                    </button>
                  )}
                </div>
              ) : user ? (
                <p className="text-gray-600">You can&apos;t book your own listing</p>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-block px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
                    hover:bg-brand-tertiary transition-colors"
                >
                  Sign in to book
                </Link>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Contact Owner Placeholder */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h2>
              <p className="text-gray-700 mb-4">
                Contact the owner to ask about availability, condition, or anything else
              </p>
              {user ? (
                <button
                  onClick={handleMessageOwner}
                  disabled={isMessaging}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium
                    hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMessaging ? 'Starting conversation...' : 'Message Owner'}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg font-medium
                    hover:bg-gray-700 transition-colors"
                >
                  Sign In to Message
                </Link>
              )}
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">Safety Tips</h2>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex gap-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>Inspect the item thoroughly before renting</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>Communicate through Swoopings&apos; messaging system</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>Use the payment system for protection</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>Check the owner&apos;s reviews and ratings</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation - Only if multiple images */}
        {listing.image_urls.length > 1 && (
          <div className="mt-8 space-y-3">
            <p className="text-sm font-medium text-gray-700">Photos</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.image_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? 'border-brand-primary'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {listing && user && (
          <PaymentModal
            isOpen={showPaymentModal}
            bookingDetails={{
              listingTitle: listing.title,
              amount: totalPrice,
              checkInDate: checkInDate || '',
              checkOutDate: checkOutDate || '',
            }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </div>
    </main>
  );
}
