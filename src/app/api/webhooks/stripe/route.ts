/**
 * Stripe Webhook Handler
 * 
 * File Purpose:
 * - Handle Stripe webhook events
 * - Confirm payments and update bookings
 * - Handle payment failures and refunds
 * 
 * Route: POST /api/webhooks/stripe
 * 
 * Handled Events:
 * - payment_intent.succeeded: Payment successful, update booking
 * - payment_intent.payment_failed: Payment failed, mark booking
 * - charge.refunded: Refund processed, update booking
 * 
 * Security:
 * - Verify webhook signature with STRIPE_WEBHOOK_SECRET
 * - Prevents spoofed webhook calls
 * - Only processes verified events
 * 
 * Database Updates:
 * - Store payment_intent_id in bookings table
 * - Update booking status based on payment result
 * 
 * History:
 * - 2025-12-07: Initial creation for Phase 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// This should match your Stripe dashboard webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Supabase client with service role (for webhook processing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 401 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await handleRefund(charge.payment_intent as string);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 * Update booking status to 'confirmed'
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const paymentIntentId = paymentIntent.id;

    // Find and update booking with this payment_intent_id
    const { data: bookings, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntentId)
      .select('id, renter_id, owner_id, listing_id');

    if (error) {
      console.error('Error updating booking status:', error);
      return;
    }

    if (bookings && bookings.length > 0) {
      const booking = bookings[0];
      console.log('Booking confirmed:', {
        bookingId: booking.id,
        paymentIntentId,
      });

      // TODO: Send confirmation emails to renter and owner
      // TODO: Create notification records in database
    } else {
      console.log('No booking found for payment intent:', paymentIntentId);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 * Log failure and potentially send notification
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const paymentIntentId = paymentIntent.id;
    const lastError = paymentIntent.last_payment_error;

    // Find booking with this payment_intent_id
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, renter_id')
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error('Error querying booking:', error);
      return;
    }

    if (bookings && bookings.length > 0) {
      console.log('Payment failed:', {
        bookingId: bookings[0].id,
        paymentIntentId,
        error: lastError?.message,
      });

      // TODO: Send notification to user about failed payment
      // Booking remains in 'pending' status, user can retry
    } else {
      console.log('No booking found for failed payment:', paymentIntentId);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle refund
 * Update booking status and notify parties
 */
async function handleRefund(paymentIntentId: string) {
  try {
    // Find and update booking with this payment_intent_id
    const { data: bookings, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntentId)
      .select('id, renter_id, owner_id');

    if (error) {
      console.error('Error updating booking for refund:', error);
      return;
    }

    if (bookings && bookings.length > 0) {
      const booking = bookings[0];
      console.log('Booking refunded:', {
        bookingId: booking.id,
        paymentIntentId,
      });

      // TODO: Send refund confirmation to renter and owner
      // TODO: Create notification records
    } else {
      console.log('No booking found for refunded payment:', paymentIntentId);
    }
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}
