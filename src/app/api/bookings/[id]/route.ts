/**
 * Booking Details API Endpoint
 * 
 * File Purpose:
 * - Fetch booking details with related listing and owner information
 * - Used by confirmation page to display booking summary
 * 
 * Route: GET /api/bookings/[id]
 * 
 * Response:
 * {
 *   id: string,
 *   listing_id: string,
 *   renter_id: string,
 *   owner_id: string,
 *   check_in_date: string,
 *   check_out_date: string,
 *   total_price: number,
 *   status: string,
 *   created_at: string,
 *   listing: {
 *     id: string,
 *     title: string,
 *     owner_id: string,
 *     owner: {
 *       username: string,
 *       full_name: string | null,
 *       avatar_url: string | null
 *     }
 *   }
 * }
 * 
 * Security:
 * - Verifies user is either renter or owner of the booking
 * - Uses RLS policies for authorization
 * 
 * History:
 * - 2025-12-07: Initial creation for Phase 5.4 confirmation page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    // Get the session to check authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create authenticated client
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Fetch booking with related data
    const { data: booking, error } = await authenticatedSupabase
      .from('bookings')
      .select(`
        id,
        listing_id,
        renter_id,
        owner_id,
        check_in_date,
        check_out_date,
        total_price,
        status,
        payment_intent_id,
        created_at,
        qr_secret,
        handover_confirmed_at,
        handover_confirmed_by,
        listing: listings (
          id,
          title,
          owner_id
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch owner and renter details separately
    const { data: ownerData, error: ownerError } = await authenticatedSupabase
      .from('profiles')
      .select('username, full_name, avatar_url, email')
      .eq('id', booking.owner_id)
      .single();

    if (ownerError) {
      console.error('Error fetching owner:', ownerError);
      return NextResponse.json(
        { error: 'Unable to fetch owner details' },
        { status: 500 }
      );
    }

    const { data: renterData, error: renterError } = await authenticatedSupabase
      .from('profiles')
      .select('username, full_name, avatar_url, email')
      .eq('id', booking.renter_id)
      .single();

    if (renterError) {
      console.error('Error fetching renter:', renterError);
      return NextResponse.json(
        { error: 'Unable to fetch renter details' },
        { status: 500 }
      );
    }

    // Transform the response to include owner and renter data
    const transformedBooking = {
      ...booking,
      listing: {
        ...booking.listing,
        owner: ownerData,
      },
      renter: renterData,
    };

    return NextResponse.json(transformedBooking);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
