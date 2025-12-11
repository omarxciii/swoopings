/**
 * Handover Confirmation API Endpoint
 * 
 * File Purpose:
 * - Handle QR code verification and handover confirmation
 * - Called by QRScanner component when owner scans renter's QR
 * 
 * Route: POST /api/bookings/[id]/handover
 * 
 * Request Body:
 * {
 *   qr_secret: string,
 *   confirmed_by: string (user_id of owner)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   booking?: Booking
 * }
 * 
 * Security:
 * - Verifies QR secret matches booking
 * - Verifies caller is the listing owner
 * - Uses RLS policies for authorization
 * 
 * History:
 * - 2025-12-07: Created for Phase 5.6 QR Handover System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    const { qr_secret, confirmed_by } = body;

    // Get the session to check authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!qr_secret || !confirmed_by) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
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

    // Fetch booking to verify QR secret and ownership
    const { data: booking, error: fetchError } = await authenticatedSupabase
      .from('bookings')
      .select(`
        id,
        qr_secret,
        handover_confirmed_at,
        owner_id
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user is the owner
    if (booking.owner_id !== confirmed_by) {
      return NextResponse.json(
        { success: false, message: 'Only the listing owner can confirm handover' },
        { status: 403 }
      );
    }

    // Verify QR secret matches
    if (booking.qr_secret !== qr_secret) {
      return NextResponse.json(
        { success: false, message: 'Invalid QR code' },
        { status: 400 }
      );
    }

    // Check if already confirmed
    if (booking.handover_confirmed_at) {
      return NextResponse.json(
        { success: false, message: 'Handover already confirmed' },
        { status: 400 }
      );
    }

    // Update booking with handover confirmation
    const { data: updatedBooking, error: updateError } = await authenticatedSupabase
      .from('bookings')
      .update({
        handover_confirmed_at: new Date().toISOString(),
        handover_confirmed_by: confirmed_by,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to confirm handover' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Handover confirmed successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
