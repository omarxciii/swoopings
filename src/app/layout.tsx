/**
 * Root Layout Component
 * 
 * File Purpose:
 * - Top-level layout for the entire application
 * - Provides global providers (authentication, HTTP client)
 * - Manages header/navigation visible on all pages
 * 
 * Dependencies:
 * - React 18
 * - Next.js 14+ App Router
 * - globals.css (Tailwind styles)
 * - Navbar component
 * - AuthProvider
 * 
 * High-Level Logic:
 * - Wraps all pages with metadata and HTML structure
 * - Initializes global CSS and Tailwind
 * - Provides auth context to child components
 * - Shows Navbar on all pages
 * 
 * Assumptions:
 * - AuthProvider is at root level
 * - Navbar handles auth state and route navigation
 * - All pages inherit this layout
 * 
 * History:
 * - 2025-12-06: Initial creation
 * - 2025-12-06: Added AuthProvider and Navbar
 */

import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { StripeProvider } from '@/providers/StripeProvider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'YeahRent - Peer-to-Peer Rental Marketplace',
  description: 'Rent and share items with your community',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>
          <StripeProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
          </StripeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
