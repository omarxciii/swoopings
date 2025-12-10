/**
 * Stripe Provider Component
 * 
 * File Purpose:
 * - Wraps application with Stripe context
 * - Initializes Stripe.js with publishable key
 * - Required for PaymentModal and card elements
 * 
 * Usage:
 * - Wrap main layout or specific page with <StripeProvider>
 * - PaymentModal must be inside StripeProvider
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Public key from Stripe
 * 
 * History:
 * - 2025-12-07: Initial creation for Phase 5.4
 */

'use client';

import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
