/**
 * ProtectedRoute Component
 * 
 * File Purpose:
 * - Wraps pages that require authentication
 * - Redirects to login if user not authenticated
 * - Shows loading state while checking auth
 * - Prevents access to private pages for non-users
 * 
 * Dependencies:
 * - React
 * - next/navigation
 * - src/providers/AuthProvider.tsx
 * 
 * High-Level Logic:
 * - Get user from auth context
 * - If loading, show loading component
 * - If no user, redirect to login
 * - If user exists, render children
 * 
 * Usage:
 * <ProtectedRoute>
 *   <MyPrivatePage />
 * </ProtectedRoute>
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/providers/AuthProvider';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
