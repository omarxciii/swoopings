/**
 * Application Type Definitions
 * 
 * File Purpose:
 * - Centralized TypeScript interfaces and types for the entire application
 * - Ensures type consistency across all features
 * - Documents database schema structure
 * 
 * Dependencies:
 * - None (pure TypeScript)
 * 
 * Types Include:
 * - Profile - User profile information
 * - Listing - Rental listing with details
 * - Booking - Reservation record
 * - Message - Communication between users
 * - Payment - Stripe payment metadata
 * 
 * Assumptions:
 * - All timestamps are in ISO 8601 format
 * - User IDs match Supabase auth.users.id
 * - All nullable fields must be explicitly optional (?)
 * 
 * History:
 * - 2025-12-06: Initial creation with core types
 */

/**
 * User Profile - Extends Supabase auth user with rental marketplace data
 */
export interface Profile {
  id: string; // Matches auth.users.id
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  rating: number | null; // Average review rating
  total_reviews: number; // Count of reviews
  created_at: string;
  updated_at: string;
}

/**
 * Rental Listing - Item available for rent
 */
export interface Listing {
  id: string;
  owner_id: string; // FK to profiles.id
  title: string;
  description: string;
  price_per_day: number;
  location: string;
  city: string;
  image_urls: string[]; // Array of Supabase storage URLs
  status: 'active' | 'inactive' | 'archived'; // Controls visibility
  created_at: string;
  updated_at: string;
}

/**
 * Booking/Reservation Record
 */
export interface Booking {
  id: string;
  listing_id: string; // FK to listings.id
  renter_id: string; // FK to profiles.id (who is renting)
  owner_id: string; // FK to profiles.id (who owns the listing)
  check_in_date: string; // ISO date YYYY-MM-DD
  check_out_date: string; // ISO date YYYY-MM-DD
  total_price: number; // Price in cents (stored as integer in DB, convert to dollars)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // Booking lifecycle
  payment_intent_id: string | null; // Stripe payment intent ID
  created_at: string;
  updated_at: string;
}

/**
 * Conversation Thread between two users
 */
export interface Conversation {
  id: string;
  user1_id: string; // FK to profiles.id
  user2_id: string; // FK to profiles.id
  listing_id: string | null; // FK to listings.id (optional context)
  created_at: string;
  updated_at: string;
  user1_last_read: string | null; // ISO timestamp when user1 last read
  user2_last_read: string | null; // ISO timestamp when user2 last read
}

/**
 * Message within a conversation
 */
export interface Message {
  id: string;
  conversation_id: string; // FK to conversations.id
  sender_id: string; // FK to profiles.id
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Conversation with related data for display
 */
export interface ConversationWithData extends Conversation {
  otherUser?: Profile; // The other person in the conversation
  lastMessage?: Message; // Most recent message
  unreadCount?: number; // Number of unread messages for current user
}

/**
 * Payment Information - Metadata about Stripe transactions
 */
export interface Payment {
  id: string;
  booking_id: string; // FK to bookings.id
  payment_intent_id: string; // Stripe payment_intent.id
  amount: number; // Amount in cents
  currency: string; // Usually 'usd'
  status: 'succeeded' | 'processing' | 'requires_action' | 'canceled';
  created_at: string;
  updated_at: string;
}

/**
 * API Response wrapper for consistency
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
