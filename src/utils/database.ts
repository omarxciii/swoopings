/**
 * Supabase API Helper Functions
 * 
 * File Purpose:
 * - Wraps Supabase database operations
 * - Provides consistent error handling
 * - Centralized database query logic
 * - Type-safe database access
 * 
 * Dependencies:
 * - @supabase/supabase-js
 * - src/lib/supabase.ts
 * - src/types/index.ts
 * 
 * High-Level Logic:
 * - Each function handles specific database operations
 * - All functions return typed responses
 * - Error handling is centralized
 * - RLS policies handle authorization
 * 
 * Assumptions:
 * - Supabase tables are created via DATABASE_SCHEMA.sql
 * - RLS policies are enabled and properly configured
 * - User is authenticated before calling these functions
 * 
 * Notes to Future Developer:
 * - Never bypass RLS - all queries are filtered by user ID
 * - For new queries, add them here and export
 * - Type all database responses with interfaces from types/index.ts
 * - Handle errors gracefully with try-catch
 * 
 * Areas Needing Work:
 * - Add offline fallback/caching
 * - Add query retry logic for transient failures
 * - Add batch operations for performance
 * 
 * History:
 * - 2025-12-06: Initial creation with common queries
 */

import { supabase } from '@/lib/supabase';
import type { Profile, Listing, Booking, Message, Conversation, ApiResponse } from '@/types';

/**
 * Get user's own profile
 */
export const getProfile = async (userId: string): Promise<ApiResponse<Profile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, data: null, error: 'Failed to fetch profile' };
  }
};

/**
 * Get another user's public profile
 */
export const getPublicProfile = async (userId: string): Promise<ApiResponse<Profile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data: data as Profile, error: null };
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return { success: false, data: null, error: 'Failed to fetch profile' };
  }
};

/**
 * Update user's profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<ApiResponse<Profile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, data: null, error: 'Failed to update profile' };
  }
};

/**
 * Create initial user profile (during signup)
 * This is called after Supabase Auth user is created
 */
export const createProfile = async (
  userId: string,
  email: string,
  username: string,
  fullName?: string,
  bio?: string
): Promise<ApiResponse<Profile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          username,
          full_name: fullName || null,
          bio: bio || null,
          total_reviews: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error creating profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
    return { success: false, data: null, error: errorMessage };
  }
};

/**
 * Get all active listings (for browsing)
 */
export const getListings = async (limit = 50, offset = 0): Promise<ApiResponse<Listing[]>> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return { success: false, data: null, error: 'Failed to fetch listings' };
  }
};

/**
 * Get listings with filters and search
 * Supports: search by title/description, price range, location, sorting
 */
export const getListingsWithFilters = async (
  search?: string,
  minPrice?: number,
  maxPrice?: number,
  city?: string,
  sortBy?: 'newest' | 'cheapest' | 'expensive',
  limit = 50,
  offset = 0
): Promise<ApiResponse<Listing[]>> => {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active');

    // Note: Search and city filters use client-side word-start matching
    // (applied after fetching in the filter section below)

    // Apply price range filters
    if (minPrice !== undefined && minPrice >= 0) {
      query = query.gte('price_per_day', minPrice);
    }
    if (maxPrice !== undefined && maxPrice > 0) {
      query = query.lte('price_per_day', maxPrice);
    }

    // Apply sorting
    switch (sortBy) {
      case 'cheapest':
        query = query.order('price_per_day', { ascending: true });
        break;
      case 'expensive':
        query = query.order('price_per_day', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    // Client-side filtering for search and location
    // Use word-start matching: only match if search term starts a word
    let results = data || [];
    
    // Filter by search term (title and description)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const wordStartRegex = new RegExp(`(^|\\s|[^a-z0-9])${searchTerm}`, 'i');
      
      results = results.filter(
        (listing) =>
          wordStartRegex.test(listing.title) ||
          wordStartRegex.test(listing.description)
      );
    }

    // Filter by city (location)
    if (city && city.trim()) {
      const cityTerm = city.trim().toLowerCase();
      const wordStartRegex = new RegExp(`(^|\\s|[^a-z0-9])${cityTerm}`, 'i');
      
      results = results.filter((listing) =>
        wordStartRegex.test(listing.city)
      );
    }

    return { success: true, data: results, error: null };
  } catch (error) {
    console.error('Error fetching filtered listings:', error);
    return { success: false, data: null, error: 'Failed to fetch listings' };
  }
};

/**
 * Get listing by ID
 */
export const getListing = async (listingId: string): Promise<ApiResponse<Listing>> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return { success: false, data: null, error: 'Failed to fetch listing' };
  }
};

/**
 * Get user's own listings
 */
export const getUserListings = async (userId: string): Promise<ApiResponse<Listing[]>> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return { success: false, data: null, error: 'Failed to fetch your listings' };
  }
};

/**
 * Create a new listing
 */
export const createListing = async (
  listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Listing>> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert([listing])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error creating listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create listing';
    return { success: false, data: null, error: errorMessage };
  }
};

/**
 * Update a listing
 */
export const updateListing = async (
  listingId: string,
  updates: Partial<Listing>
): Promise<ApiResponse<Listing>> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error updating listing:', error);
    return { success: false, data: null, error: 'Failed to update listing' };
  }
};

/**
 * Delete a listing
 */
export const deleteListing = async (listingId: string): Promise<ApiResponse<null>> => {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) throw error;
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error deleting listing:', error);
    return { success: false, data: null, error: 'Failed to delete listing' };
  }
};

/**
 * Get user's bookings (as renter)
 */
export const getUserBookingsAsRenter = async (userId: string): Promise<ApiResponse<Booking[]>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('renter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching renter bookings:', error);
    return { success: false, data: null, error: 'Failed to fetch your bookings' };
  }
};

/**
 * Get user's bookings (as owner)
 */
export const getUserBookingsAsOwner = async (userId: string): Promise<ApiResponse<Booking[]>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    return { success: false, data: null, error: 'Failed to fetch bookings for your listings' };
  }
};

/**
 * Create a booking
 */
export const createBooking = async (
  booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Booking>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, data: null, error: 'Failed to create booking' };
  }
};

/**
 * Get a specific booking by ID
 */
export const getBooking = async (bookingId: string): Promise<ApiResponse<Booking>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return { success: false, data: null, error: 'Failed to fetch booking' };
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<ApiResponse<Booking>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { success: false, data: null, error: 'Failed to update booking' };
  }
};

/**
 * Get all bookings for a listing
 */
export const getListingBookings = async (listingId: string): Promise<ApiResponse<Booking[]>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('listing_id', listingId)
      .order('check_in_date', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching listing bookings:', error);
    return { success: false, data: null, error: 'Failed to fetch bookings' };
  }
};

/**
 * Check if dates are available for a listing
 * Returns true if no conflicting bookings exist
 */
export const checkDateAvailability = async (
  listingId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('check_in_date, check_out_date')
      .eq('listing_id', listingId)
      .in('status', ['confirmed', 'pending'])
      .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`);

    if (error) throw error;

    // If there are any overlapping bookings, dates are NOT available
    const isAvailable = (data || []).length === 0;
    return { success: true, data: isAvailable, error: null };
  } catch (error) {
    console.error('Error checking date availability:', error);
    return { success: false, data: null, error: 'Failed to check availability' };
  }
};

/**
 * Calculate total price for booking based on days and price per day
 */
export const calculateBookingPrice = (checkInDate: string, checkOutDate: string, pricePerDay: number): number => {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * pricePerDay;
};

/**
 * Get all messages for a user
 */
export const getUserMessages = async (userId: string): Promise<ApiResponse<Message[]>> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, data: null, error: 'Failed to fetch messages' };
  }
};

/**
 * Get or create a conversation between two users
 * Returns existing conversation if it exists, creates new one if not
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string,
  listingId?: string
): Promise<ApiResponse<Conversation>> => {
  try {
    // Normalize user IDs so order doesn't matter
    const [user1, user2] = [userId1, userId2].sort();

    // Check if conversation already exists
    const { data: existing, error: selectError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${user1},user2_id.eq.${user2}),and(user1_id.eq.${user2},user2_id.eq.${user1})`)
      .single();

    // If found, return existing conversation
    if (existing) {
      return { success: true, data: existing, error: null };
    }

    // If not found (404 is expected), create new conversation
    if (selectError && selectError.code === 'PGRST116') {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user1,
          user2_id: user2,
          listing_id: listingId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    }

    // Other database errors
    if (selectError) throw selectError;

    return { success: false, data: null, error: 'Unexpected error' };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return { success: false, data: null, error: 'Failed to get or create conversation' };
  }
};

/**
 * Get all conversations for a user
 * Returns conversations sorted by most recent first
 */
export const getUserConversations = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<ApiResponse<Conversation[]>> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return { success: false, data: null, error: 'Failed to fetch conversations' };
  }
};

/**
 * Get conversation with all messages
 */
export const getConversationWithMessages = async (
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<ApiResponse<{ conversation: Conversation; messages: Message[] }>> => {
  try {
    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (msgError) throw msgError;

    // Reverse to show oldest first
    const sortedMessages = (messages || []).reverse();

    return { 
      success: true, 
      data: { conversation, messages: sortedMessages }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching conversation with messages:', error);
    return { success: false, data: null, error: 'Failed to fetch conversation' };
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<ApiResponse<Message>> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, data: null, error: 'Failed to send message' };
  }
};

/**
 * Mark conversation as read for a user
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<ApiResponse<null>> => {
  try {
    const timestamp = new Date().toISOString();

    // First, get the conversation to see which user is which
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (fetchError) throw fetchError;

    // Update the appropriate last_read timestamp
    if (conversation.user1_id === userId) {
      const { error } = await supabase
        .from('conversations')
        .update({ user1_last_read: timestamp })
        .eq('id', conversationId);
      if (error) throw error;
    } else if (conversation.user2_id === userId) {
      const { error } = await supabase
        .from('conversations')
        .update({ user2_last_read: timestamp })
        .eq('id', conversationId);
      if (error) throw error;
    }

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return { success: false, data: null, error: 'Failed to mark conversation as read' };
  }
};

/**
 * Get unread message count for a user in a specific conversation
 */
export const getUnreadMessageCount = async (
  conversationId: string,
  userId: string
): Promise<ApiResponse<number>> => {
  try {
    // Get conversation to see when user last read and who the other user is
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user1_last_read, user2_id, user2_last_read')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    const lastReadTime = conversation.user1_id === userId 
      ? conversation.user1_last_read 
      : conversation.user2_last_read;

    // Determine the OTHER user (the one who sent the messages we want to count)
    const otherUserId = conversation.user1_id === userId 
      ? conversation.user2_id 
      : conversation.user1_id;

    // Count messages from the OTHER user, created after last read time
    const query = supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('sender_id', otherUserId); // Only count messages from the OTHER user

    if (lastReadTime) {
      query.gt('created_at', lastReadTime);
    }

    const { count, error } = await query;

    if (error) throw error;
    return { success: true, data: count || 0, error: null };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, data: null, error: 'Failed to get unread count' };
  }
};

/**
 * Get count of pending bookings for a user (as owner)
 * Returns the number of bookings awaiting owner confirmation
 */
export const getPendingBookingCount = async (ownerId: string): Promise<ApiResponse<number>> => {
  try {
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('owner_id', ownerId)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true, data: count || 0, error: null };
  } catch (error) {
    console.error('Error getting pending booking count:', error);
    return { success: false, data: null, error: 'Failed to get pending booking count' };
  }
};

/**
 * =============================================
 * AVAILABILITY MANAGEMENT FUNCTIONS (Phase 5.5a)
 * =============================================
 */

/**
 * Get all availability settings for a listing
 * Returns array of day-of-week numbers (0=Sunday, 6=Saturday)
 */
export const getListingAvailability = async (listingId: string): Promise<ApiResponse<number[]>> => {
  try {
    const { data, error } = await supabase
      .from('listing_availability')
      .select('day_of_week')
      .eq('listing_id', listingId);

    if (error) {
      console.warn(`[getListingAvailability] Query error for listing ${listingId}:`, error);
      throw error;
    }
    
    const availableDays = (data || []).map(row => row.day_of_week).sort();
    console.warn(`%c[getListingAvailability] For listing ${listingId}: ${availableDays.length > 0 ? availableDays.join(',') : 'NONE (empty array!)'}`, 'background: orange; color: black; font-weight: bold;');
    if (data) {
      console.table(data);
    }
    return { success: true, data: availableDays, error: null };
  } catch (error) {
    console.error('Error getting listing availability:', error);
    return { success: false, data: null, error: 'Failed to get availability' };
  }
};

/**
 * Set availability for a listing (day-of-week)
 * availableDays: Array of day numbers (0-6) that should be available
 * This will replace any existing availability settings
 */
export const setListingAvailability = async (
  listingId: string, 
  availableDays: number[]
): Promise<ApiResponse<void>> => {
  try {
    console.warn(`%c[setListingAvailability] SAVING: listing ${listingId} with days: ${availableDays.join(',')}`, 'background: cyan; color: black; font-weight: bold;');

    // First, delete all existing availability for this listing
    const { error: deleteError } = await supabase
      .from('listing_availability')
      .delete()
      .eq('listing_id', listingId);

    if (deleteError) {
      console.error(`[setListingAvailability] Delete error:`, deleteError);
      throw deleteError;
    }

    console.log(`[setListingAvailability] Deleted old availability records for listing ${listingId}`);

    // If no days provided, just delete and return
    if (!availableDays || availableDays.length === 0) {
      console.warn(`[setListingAvailability] No days provided, skipping insert`);
      return { success: true, data: undefined, error: null };
    }

    // Insert new availability records
    const rows = availableDays.map(day => ({
      listing_id: listingId,
      day_of_week: day,
    }));

    console.log(`[setListingAvailability] Inserting ${rows.length} rows:`, rows);

    const { error: insertError, data: insertData } = await supabase
      .from('listing_availability')
      .insert(rows)
      .select();

    if (insertError) {
      console.error(`%c[setListingAvailability] INSERT FAILED:`, 'background: red; color: white; font-weight: bold;', insertError);
      throw insertError;
    }

    console.warn(`%c[setListingAvailability] SUCCESS! Inserted ${insertData?.length || 0} rows`, 'background: green; color: white; font-weight: bold;');
    console.table(insertData);
    return { success: true, data: undefined, error: null };
  } catch (error) {
    console.error('Error setting listing availability:', error);
    return { success: false, data: undefined, error: 'Failed to set availability' };
  }
};

/**
 * Get all blackout dates for a listing
 */
interface BlackoutDate {
  id: string;
  listing_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason?: string;
  created_at: string;
}

export const getListingBlackoutDates = async (listingId: string): Promise<ApiResponse<BlackoutDate[]>> => {
  try {
    const { data, error } = await supabase
      .from('listing_blackout_dates')
      .select('*')
      .eq('listing_id', listingId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Error getting blackout dates:', error);
    return { success: false, data: null, error: 'Failed to get blackout dates' };
  }
};

/**
 * Add a blackout date range for a listing
 */
export const addBlackoutDate = async (
  listingId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  reason?: string
): Promise<ApiResponse<BlackoutDate>> => {
  try {
    const { data, error } = await supabase
      .from('listing_blackout_dates')
      .insert([
        {
          listing_id: listingId,
          start_date: startDate,
          end_date: endDate,
          reason: reason || null,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as BlackoutDate, error: null };
  } catch (error) {
    console.error('Error adding blackout date:', error);
    return { success: false, data: null, error: 'Failed to add blackout date' };
  }
};

/**
 * Delete a blackout date entry
 */
export const deleteBlackoutDate = async (blackoutDateId: string): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('listing_blackout_dates')
      .delete()
      .eq('id', blackoutDateId);

    if (error) throw error;
    return { success: true, data: undefined, error: null };
  } catch (error) {
    console.error('Error deleting blackout date:', error);
    return { success: false, data: undefined, error: 'Failed to delete blackout date' };
  }
};

/**
 * Check if a specific date is available for a CHECK-IN
 * Considers:
 * 1. Day-of-week availability (must be available for check-in)
 * 2. Blackout dates (vacation/maintenance)
 * 3. Existing bookings (date must not be booked)
 * 
 * NOTE: Only checks if date is suitable for CHECK-IN. 
 * Check-out dates can be any day (no day-of-week restriction).
 * 
 * Returns true if date is available for check-in, false if unavailable
 */
export const isDateAvailable = async (
  listingId: string,
  date: Date
): Promise<ApiResponse<boolean>> => {
  try {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check 1: Is this day of week available for CHECK-IN?
    const availabilityResponse = await getListingAvailability(listingId);
    if (availabilityResponse.success && availabilityResponse.data && availabilityResponse.data.length > 0) {
      // If availability is explicitly set, check if this day is in the list
      if (!availabilityResponse.data.includes(dayOfWeek)) {
        return { success: true, data: false, error: null }; // Day not available for check-in
      }
    }
    // If availability is not set, assume all days are available for check-in

    // Check 2: Is this date in a blackout period?
    const blackoutResponse = await getListingBlackoutDates(listingId);
    if (blackoutResponse.success && blackoutResponse.data) {
      const isBlackedOut = blackoutResponse.data.some(
        blackout => dateString >= blackout.start_date && dateString <= blackout.end_date
      );
      if (isBlackedOut) {
        return { success: true, data: false, error: null }; // Blacked out
      }
    }

    // Check 3: Is this date already booked (in an existing booking)?
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('listing_id', listingId)
      .lte('check_in_date', dateString)
      .gte('check_out_date', dateString)
      .in('status', ['pending', 'active', 'completed']); // Don't count cancelled bookings

    if (error) throw error;
    if (count && count > 0) {
      return { success: true, data: false, error: null }; // Already booked
    }

    return { success: true, data: true, error: null }; // Available!
  } catch (error) {
    console.error('Error checking date availability:', error);
    return { success: false, data: null, error: 'Failed to check availability' };
  }
};

/**
 * Get all unavailable dates for a listing in a date range
 * Returns array of date strings (YYYY-MM-DD) that are unavailable as CHECK-IN dates
 * Used to gray out calendar dates in the UI
 * 
 * Logic:
 * 1. If availableDays is set, gray out all days NOT in availableDays (for check-in only)
 * 2. Always gray out dates in blackout periods
 * 3. Always gray out existing booking check-in dates (dates already booked)
 * 
 * NOTE: This returns UNAVAILABLE CHECK-IN dates only. Check-out dates have no restrictions.
 */
export const getUnavailableDates = async (
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<string[]>> => {
  try {
    const unavailableDates: Set<string> = new Set();

    // Get availability and blackout data
    const [availRes, blackoutRes, bookingsRes] = await Promise.all([
      getListingAvailability(listingId),
      getListingBlackoutDates(listingId),
      supabase
        .from('bookings')
        .select('check_in_date, check_out_date')
        .eq('listing_id', listingId)
        .gte('check_out_date', startDate.toISOString().split('T')[0])
        .lte('check_in_date', endDate.toISOString().split('T')[0])
        .in('status', ['pending', 'active', 'completed'])
    ]);

    // Get available days of week for CHECK-IN only
    const availableDays = availRes.data || [];
    const blackoutDates = blackoutRes.data || [];
    const bookings = bookingsRes.data || [];

    // Console log for debugging
    console.log(`[getUnavailableDates] listing ${listingId}:`, {
      availableDaysForCheckIn: availableDays,
      blackoutDatesCount: blackoutDates.length,
      existingBookingsCount: bookings.length,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
    });

    // Loop through each date in range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      let isUnavailable = false;

      // Check 1: Day not in available days for CHECK-IN (only if availability is explicitly set)
      if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
        isUnavailable = true;
      }

      // Check 2: Date is in blackout range
      if (!isUnavailable && blackoutDates.some(b => dateString >= b.start_date && dateString <= b.end_date)) {
        isUnavailable = true;
      }

      // Check 3: Date is already booked (check-in or within booking range)
      if (!isUnavailable && bookings.some(b => dateString >= b.check_in_date && dateString < b.check_out_date)) {
        isUnavailable = true;
      }

      if (isUnavailable) {
        unavailableDates.add(dateString);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { success: true, data: Array.from(unavailableDates), error: null };
  } catch (error) {
    console.error('Error getting unavailable dates:', error);
    return { success: false, data: null, error: 'Failed to get unavailable dates' };
  }
};
