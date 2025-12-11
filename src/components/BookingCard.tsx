/**
 * Booking Card Component
 * 
 * File Purpose:
 * - Display a single booking with details
 * - Show listing info, dates, price, and status
 * - Allow owner/renter to manage booking (confirm, cancel, complete)
 * 
 * Props:
 * - booking: Booking object
 * - listing: Associated listing info
 * - otherUser: The other party in booking (renter or owner)
 * - isOwner: Whether current user is the owner
 * - onStatusChange: Callback when booking status is updated
 * 
 * Features:
 * - Color-coded status badges
 * - Action buttons based on user role and status
 * - Display dates and total price
 * - Show user avatars and names
 * 
 * History:
 * - 2025-12-07: Initial creation
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Booking, Listing, Profile } from '@/types';

interface BookingCardProps {
  booking: Booking;
  listing: Listing;
  otherUser: Profile | null;
  isOwner: boolean;
  onStatusChange?: (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => void;
}

export default function BookingCard({
  booking,
  listing,
  otherUser,
  isOwner,
  onStatusChange,
}: BookingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-brand-secondary text-brand-primary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    if (onStatusChange && !isUpdating) {
      setIsUpdating(true);
      try {
        onStatusChange(booking.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const checkInDate = new Date(booking.check_in_date);
  const checkOutDate = new Date(booking.check_out_date);
  const isUpcoming = checkInDate > new Date();
  const isOngoing = checkInDate <= new Date() && checkOutDate > new Date();
  const isPast = checkOutDate <= new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with listing and status */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
            <p className="text-sm text-gray-600">{listing.city}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* User info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherUser?.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                {otherUser?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{otherUser?.username || 'Unknown User'}</p>
              <p className="text-xs text-gray-500">{isOwner ? 'Renter' : 'Owner'}</p>
            </div>
          </div>
          
          {/* Handover status badge */}
          {booking.handover_confirmed_at ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Handed Over ✓
            </span>
          ) : booking.status === 'confirmed' ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Handover
            </span>
          ) : null}
        </div>
      </div>

      {/* Dates and pricing */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Check-in</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(booking.check_in_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Check-out</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(booking.check_out_date)}</p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Total Price</p>
            <p className="text-2xl font-bold text-brand-primary">${booking.total_price.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {onStatusChange && (
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex gap-3 mb-3">
            {isOwner && booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isUpdating}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Decline
                </button>
              </>
            )}

            {booking.status === 'confirmed' && isOngoing && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
                className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-brand-tertiary disabled:opacity-50 transition-colors"
              >
                Mark as Completed
              </button>
            )}

            {booking.status === 'pending' && (
              <p className="text-sm text-gray-600 py-2">
                {isOwner ? 'Waiting for you to confirm' : 'Waiting for owner to confirm'}
              </p>
            )}

            {booking.status === 'cancelled' && (
              <p className="text-sm text-red-600 py-2">This booking was cancelled</p>
            )}
          </div>
          
          {/* View Details Button */}
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="block w-full text-center py-2 px-4 bg-brand-neutralgreen text-brand-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            View Details
            {isOwner && !booking.handover_confirmed_at && booking.status === 'confirmed' && ' & Scan QR'}
            {!isOwner && !booking.handover_confirmed_at && booking.status === 'confirmed' && ' & Show QR'}
          </Link>
        </div>
      )}

      {/* Timeline indicator */}
      <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-600">
        {isUpcoming && '📅 Upcoming'}
        {isOngoing && '🔄 Ongoing'}
        {isPast && '✓ Past'}
      </div>
    </div>
  );
}
