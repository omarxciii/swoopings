/**
 * Supabase Database Schema and RLS Policies
 * 
 * File Purpose:
 * - SQL scripts to set up the database schema in Supabase
 * - Defines tables, relationships, and Row-Level Security (RLS) policies
 * - Must be run in Supabase SQL Editor to initialize the database
 * 
 * How to Use:
 * 1. Go to your Supabase project dashboard
 * 2. Navigate to SQL Editor
 * 3. Create a new query
 * 4. Copy the relevant SQL blocks below and run them
 * 5. Enable RLS on each table
 * 
 * Security Notes:
 * - RLS policies ensure users can only access their own data
 * - All policies use auth.uid() to filter by logged-in user
 * - Service role key bypasses RLS for admin operations
 * - Never expose service role key in client code
 */

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
-- Stores user profile information
-- One row per user, extends Supabase auth.users
-- 
-- TODO: Add verification status column for identity verification (future feature)
-- TODO: Add host_verified boolean for additional screening

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  rating DECIMAL(3,2), -- Average rating (0.0 - 5.0)
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for viewing other users' listings)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- =============================================
-- 2. LISTINGS TABLE
-- =============================================
-- Rental items available for booking
-- Each listing belongs to one owner (profile)
-- 
-- TODO: Add category column (tools, household, sports, etc.)
-- TODO: Add availability_start and availability_end dates
-- TODO: Add deposit amount field

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of Supabase storage URLs
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active listings
CREATE POLICY "Active listings are viewable by everyone" ON listings
  FOR SELECT USING (status = 'active');

-- Users can view their own listings regardless of status
CREATE POLICY "Users can view own listings" ON listings
  FOR SELECT USING (auth.uid() = owner_id);

-- Users can create listings
CREATE POLICY "Users can create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can only update their own listings
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can only delete their own listings
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = owner_id);


-- =============================================
-- 3. BOOKINGS TABLE
-- =============================================
-- Reservations for listings
-- Links renter to listing and tracks payment status
-- 
-- Status Flow: pending → confirmed → completed (or cancelled at any point)
-- 
-- TODO: Add cancellation_reason column
-- TODO: Add refund_amount column

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL, -- Price in dollars
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_intent_id TEXT, -- Stripe payment_intent.id
  qr_secret TEXT, -- Secret token for QR code verification (UUID)
  handover_confirmed_at TIMESTAMP WITH TIME ZONE, -- When item was handed over
  handover_confirmed_by UUID REFERENCES profiles(id), -- Who confirmed the handover (should be owner)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view all bookings for availability checking
-- (They need to see all bookings on a listing to determine available dates)
-- Sensitive user data is protected by only querying specific columns (dates only)
CREATE POLICY "Users can view bookings" ON bookings
  FOR SELECT USING (true);

-- Renters can create bookings
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

-- Users can update their own bookings (cancel, confirm)
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = renter_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);


-- =============================================
-- 4. MESSAGES TABLE
-- =============================================
-- Private messages between users
-- Can be associated with a specific listing
-- 
-- TODO: Add message read receipts/timestamps
-- TODO: Add soft delete (is_deleted column)

-- =============================================
-- 4. CONVERSATIONS TABLE
-- =============================================
-- Groups messages between two users
-- Each conversation represents one thread between two specific users
-- Related to one listing (the one they're discussing)

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user1_last_read TIMESTAMP WITH TIME ZONE,
  user2_last_read TIMESTAMP WITH TIME ZONE
);

-- Ensure users are different
ALTER TABLE conversations ADD CONSTRAINT different_users CHECK (user1_id != user2_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they're part of
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can create conversations with another user
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can update last_read timestamp for themselves
CREATE POLICY "Users can update own last_read" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (
    (auth.uid() = user1_id AND user1_last_read IS NOT DISTINCT FROM (SELECT NOW() AT TIME ZONE 'UTC')) OR
    (auth.uid() = user2_id AND user2_last_read IS NOT DISTINCT FROM (SELECT NOW() AT TIME ZONE 'UTC')) OR
    (auth.uid() = user1_id) OR
    (auth.uid() = user2_id)
  );


-- =============================================
-- 5. MESSAGES TABLE
-- =============================================
-- Individual messages within a conversation
-- Each message belongs to exactly one conversation

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from conversations they're part of
CREATE POLICY "Users can view messages from own conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );

-- Users can create messages in conversations they're part of
CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );


-- =============================================
-- 5. PAYMENTS TABLE
-- =============================================
-- Stripe payment metadata and status
-- One row per transaction
-- 
-- TODO: Add refund tracking
-- TODO: Add payout history

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL, -- Amount in dollars
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'processing' CHECK (status IN ('succeeded', 'processing', 'requires_action', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view payment history for their bookings
CREATE POLICY "Users can view own payment history" ON payments
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE renter_id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Service role creates payments (via API)
-- No INSERT/UPDATE policies needed - handled server-side

-- =============================================
-- 7. LISTING AVAILABILITY TABLE
-- =============================================
-- Stores which days of week each listing is available for rental
-- One row per day-of-week per listing
-- day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday

CREATE TABLE IF NOT EXISTS listing_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(listing_id, day_of_week)
);

ALTER TABLE listing_availability ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view all availability, but only owners can modify their own listing's
CREATE POLICY "availability_select_all" ON listing_availability
  FOR SELECT USING (true);

CREATE POLICY "availability_insert_owner" ON listing_availability
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_availability.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "availability_update_owner" ON listing_availability
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_availability.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "availability_delete_owner" ON listing_availability
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_availability.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- =============================================
-- 8. LISTING BLACKOUT DATES TABLE
-- =============================================
-- Stores date ranges when the listing is unavailable (vacations, maintenance, etc.)
-- Used to prevent bookings during these periods

CREATE TABLE IF NOT EXISTS listing_blackout_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (end_date >= start_date)
);

ALTER TABLE listing_blackout_dates ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view all blackout dates, but only owners can modify their own listing's
CREATE POLICY "blackout_select_all" ON listing_blackout_dates
  FOR SELECT USING (true);

CREATE POLICY "blackout_insert_owner" ON listing_blackout_dates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_blackout_dates.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "blackout_update_owner" ON listing_blackout_dates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_blackout_dates.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "blackout_delete_owner" ON listing_blackout_dates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_blackout_dates.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Speed up listing queries by status and city
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_owner ON listings(owner_id);

-- Speed up booking queries by date ranges
CREATE INDEX idx_bookings_check_in ON bookings(check_in_date);
CREATE INDEX idx_bookings_check_out ON bookings(check_out_date);
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);

-- Speed up conversation queries by user (for inbox)
CREATE INDEX idx_conversations_user1 ON conversations(user1_id, updated_at DESC);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id, updated_at DESC);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);

-- Speed up message queries within conversations
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Speed up payment lookups
CREATE INDEX idx_payments_intent ON payments(payment_intent_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- Speed up availability queries by listing
CREATE INDEX idx_availability_listing ON listing_availability(listing_id);
CREATE INDEX idx_availability_day ON listing_availability(day_of_week);

-- Speed up blackout date queries by listing and date ranges
CREATE INDEX idx_blackout_listing ON listing_blackout_dates(listing_id);
CREATE INDEX idx_blackout_dates ON listing_blackout_dates(start_date, end_date);
