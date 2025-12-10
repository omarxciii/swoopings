/**
 * Dashboard Page
 * 
 * File Purpose:
 * - Main authenticated user dashboard
 * - Shows tabs for listings, bookings, messages
 * - Hub for all user activities
 * 
 * Dependencies:
 * - React
 * - next/navigation
 * - src/providers/AuthProvider
 * - src/components/ProtectedRoute
 * 
 * High-Level Logic:
 * - Protect page with ProtectedRoute
 * - Fetch user data
 * - Display tabs/links to features
 * 
 * Areas Needing Work:
 * - Add actual content for each tab
 * - Add statistics (listings count, booking count, etc.)
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthContext } from '@/providers/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const emailConfirmed = user?.email_confirmed_at != null;

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Email Confirmation Banner */}
        {!emailConfirmed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-brand-primary">Confirm your email</p>
                  <p className="text-sm text-brand-primary mt-1">
                    Check your inbox for a confirmation email. You&apos;ll be able to create and publish listings once confirmed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Manage your listings, bookings, and messages</p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* My Listings */}
          <Link
            href="/dashboard/listings"
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl font-bold text-brand-primary mb-2">📋</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">My Listings</h3>
            <p className="text-gray-600 mb-4">View and manage your rental items</p>
            <button className="text-brand-primary font-medium hover:underline">
              Go to listings →
            </button>
          </Link>

          {/* My Bookings */}
          <Link
            href="/dashboard/bookings"
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl font-bold text-brand-accent mb-2">📅</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">My Bookings</h3>
            <p className="text-gray-600 mb-4">See your rental reservations</p>
            <button className="text-brand-primary font-medium hover:underline">
              Go to bookings →
            </button>
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl font-bold text-brand-secondary mb-2">💬</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Messages</h3>
            <p className="text-gray-600 mb-4">Chat with renters and owners</p>
            <button className="text-brand-primary font-medium hover:underline">
              Go to messages →
            </button>
          </Link>
        </div>

        {/* Create New Listing CTA */}
        <div className="bg-gradient-to-r from-brand-primary to-[#0B2D29] rounded-lg p-8 text-[#C0FFA3] text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to list something?</h2>
          <p className="mb-6 opacity-90">Earn money by sharing items with your community</p>
          <Link
            href="/listings/create"
            className="inline-block bg-white text-brand-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Create Your First Listing
          </Link>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 opacity-50">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reviews</h3>
            <p className="text-gray-600">Your ratings and reviews (coming soon)</p>
          </div>
          <div className="card p-6 opacity-50">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Earnings</h3>
            <p className="text-gray-600">View your payout history (coming soon)</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
