/**
 * Navbar Component
 * 
 * File Purpose:
 * - Top navigation bar visible on all pages
 * - Shows YeahRent logo and user menu
 * - Navigation links (for logged-in users)
 * - Sign in/Sign up buttons (for guests)
 * 
 * Dependencies:
 * - React
 * - next/link
 * - next/navigation
 * - src/providers/AuthProvider
 * - src/components/FormComponents
 * 
 * High-Level Logic:
 * - Get user from auth context
 * - If authenticated, show user menu and dashboard link
 * - If not authenticated, show sign in/up buttons
 * - Handle logout
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/providers/AuthProvider';
import { getUserConversations, getUnreadMessageCount, getPendingBookingCount } from '@/utils/database';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const router = useRouter();
  const { user, signOut, loading } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingBookingCount, setPendingBookingCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setPendingBookingCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        // Fetch all conversations for this user
        const convResponse = await getUserConversations(user.id, 100, 0);
        if (!convResponse.success || !convResponse.data) {
          return;
        }

        // Calculate total unread count across all conversations
        // Only count messages from the OTHER user, not from current user
        let total = 0;
        for (const conversation of convResponse.data) {
          // Get the other user ID
          const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
          
          // Get last message to check if it's from the other user
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          // Only count unread if the last message is from the OTHER user
          if (lastMsg && lastMsg.sender_id === otherUserId) {
            const unreadResponse = await getUnreadMessageCount(conversation.id, user.id);
            if (unreadResponse.success && unreadResponse.data) {
              total += unreadResponse.data;
            }
          }
        }
        setUnreadCount(total);
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    const loadPendingBookingCount = async () => {
      try {
        const bookingResponse = await getPendingBookingCount(user.id);
        if (bookingResponse.success && bookingResponse.data !== null) {
          setPendingBookingCount(bookingResponse.data);
        }
      } catch (err) {
        console.error('Error loading pending booking count:', err);
      }
    };

    loadUnreadCount();
    loadPendingBookingCount();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
      loadPendingBookingCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/swoopings-logo-lightmode3x.png" 
              alt="Swoopings" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Center Navigation (only for authenticated users) */}
          {user && (
            <div className="hidden md:flex gap-8">
              <Link href="/listings" className="text-gray-700 hover:text-brand-primary">
                Browse
              </Link>
              <Link href="/listings/create" className="text-gray-700 hover:text-brand-primary">
                Create Listing
              </Link>
              <Link href="/messages" className="text-gray-700 hover:text-brand-primary relative">
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/dashboard/bookings" className="text-gray-700 hover:text-brand-primary relative">
                Bookings
                {pendingBookingCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingBookingCount > 9 ? '9+' : pendingBookingCount}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
            ) : user ? (
              // Authenticated User Menu
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-b-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Guest Navigation
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-tertiary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
