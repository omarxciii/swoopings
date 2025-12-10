/**
 * Payment Intent Creation Endpoint
 * 
 * File Purpose:
 * - Create Stripe payment intent for bookings
 * - Server-side validation of payment amount
 * - Return client secret for frontend payment confirmation
 * 
 * Route: POST /api/payments/create-intent
 * 
 * Request Body:
 * {
 *   amount: number (in cents),
 *   description: string,
 *   currency: string (default: 'usd')
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   clientSecret: string,
 *   paymentIntentId: string,
 *   error?: string
 * }
 * 
 * Security:
 * - Validates amount is reasonable (between $1-$10,000)
 * - Uses server-side secret key (never exposed to client)
 * - Returns only clientSecret to frontend
 * 
 * History:
 * - 2025-12-07: Initial creation for Phase 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, currency = 'usd' } = body;

    // Validate input
    if (!amount || typeof amount !== 'number') {
      console.error('Invalid amount provided:', amount);
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate amount range (prevent accidental high charges)
    // Min: $1 (100 cents), Max: $10,000 (1,000,000 cents)
    if (amount < 100 || amount > 1000000) {
      console.error('Amount out of range:', amount);
      return NextResponse.json(
        { success: false, error: `Amount out of acceptable range ($1-$10,000). Received: ${(amount / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || 'Swoopings Booking Payment',
      metadata: {
        platform: 'swoopings',
        type: 'booking',
      },
    });

    // Return only the client secret and payment intent ID
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
