/**
 * Home Page - Landing/Index Page
 * 
 * File Purpose:
 * - Main entry point for the application
 * - Displays featured listings and call-to-action for unauthenticated users
 * - Shows dashboard link for authenticated users
 * - Links to key user actions (browse, create listing, sign up)
 * 
 * Dependencies:
 * - React
 * - Next.js Link component
 * - src/providers/AuthProvider
 * 
 * High-Level Logic:
 * - Show welcome message
 * - If authenticated, show dashboard link
 * - If not authenticated, show sign up CTA
 * - Display search box
 * - Show featured listings
 * 
 * Status: Basic landing page - featured listings to come in Phase 3
 * 
 * History:
 * - 2025-12-06: Created minimal landing page
 * - 2025-12-06: Added auth-aware navigation
 */

'use client';

import Link from 'next/link';
import { useAuthContext } from '@/providers/AuthProvider';

export default function Home() {
  const { user, loading } = useAuthContext();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <img 
            src="/swoopings-logo-darkmode3x.png" 
            alt="Swoopings" 
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold mb-6 text-brand-secondary">Welcome to Swoopings</h1>
          <p className="text-xl mb-8 opacity-90">
            Rent items from your neighbors. Share what you own. Join the community.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {loading ? (
              <div className="animate-pulse h-10 w-48 bg-white rounded-lg opacity-30"></div>
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="btn-primary bg-white text-brand-primary hover:bg-brand-accent"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/listings"
                  className="btn-secondary bg-brand-accent text-brand-primary hover:bg-brand-secondary hover:text-brand-accent"
                >
                  Browse Listings
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup" className="btn-primary bg-white text-brand-primary hover:bg-brand-secondary">
                  Get Started
                </Link>
                <Link
                  href="/listings"
                  className="btn-secondary bg-brand-accent text-brand-primary hover:bg-brand-secondary hover:text-brand-accent"
                >
                  Browse Listings
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Browse', desc: 'Find items available for rent near you' },
            { title: 'Book', desc: 'Select dates and complete payment securely' },
            { title: 'Enjoy', desc: 'Pick up your item and enjoy your rental' },
          ].map((step, idx) => (
            <div key={idx} className="card p-6 text-center">
              <div className="text-4xl font-bold text-brand-primary mb-4">{idx + 1}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listings Placeholder */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Listings</h2>
          <div className="text-center">
            <p className="text-gray-600 mb-6">Featured listings coming in Phase 2</p>
            <Link href="/listings" className="btn-primary">
              Browse All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section for Non-Authenticated Users */}
      {!loading && !user && (
        <section className="bg-brand-accent py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-brand-primary">Ready to start sharing?</h2>
            <p className="text-lg mb-8 text-brand-primary">
              Create an account to list your items and earn money
            </p>
            <Link href="/auth/signup" className="inline-block bg-brand-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-tertiary">
              Sign Up Now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
