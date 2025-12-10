/**
 * Payment Modal Component
 * 
 * File Purpose:
 * - Secure payment collection using Stripe
 * - Modal overlay for payment during booking flow
 * - Handles card input and payment processing
 * - Shows loading states and error messages
 * 
 * Dependencies:
 * - @stripe/react-stripe-js
 * - @stripe/stripe-js
 * - stripe (backend processing)
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - bookingDetails: Object with listingTitle, amount, dates
 * - onSuccess: Callback when payment succeeds with paymentIntentId
 * - onError: Callback when payment fails with error message
 * - onClose: Callback when modal is closed/canceled
 * 
 * Features:
 * - Stripe card element for secure input
 * - Real-time card validation
 * - Loading state during processing
 * - Error messages with retry option
 * - Responsive modal overlay
 * 
 * History:
 * - 2025-12-07: Initial creation for Phase 5.4
 */

'use client';

import { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface BookingDetails {
  listingTitle: string;
  amount: number;
  checkInDate: string;
  checkOutDate: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  bookingDetails: BookingDetails;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function PaymentModal({
  isOpen,
  bookingDetails,
  onSuccess,
  onError,
  onClose,
}: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system not ready. Please try again.');
      return;
    }

    // Validate amount
    const amountInCents = Math.round(bookingDetails.amount * 100);
    if (amountInCents === 0 || amountInCents < 100) {
      setErrorMessage('Invalid booking amount. Please select valid dates.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Step 1: Create payment intent on the server
      const createIntentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents, // Convert to cents
          description: `Booking: ${bookingDetails.listingTitle}`,
          currency: 'usd',
        }),
      });

      if (!createIntentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await createIntentResponse.json();

      // Step 2: Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {},
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment successful
        onSuccess(paymentIntentId);
        // Reset form
        elements.getElement(CardElement)?.clear();
        setErrorMessage(null);
      } else {
        setErrorMessage('Payment could not be completed. Please try again.');
        onError('Payment not completed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-brand-primary">Complete Payment</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Booking Details */}
          <div className="mb-6 p-4 bg-brand-neutralgreen rounded-lg">
            <h3 className="font-semibold text-brand-primary mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Item:</span>
                <span className="font-medium text-gray-900">{bookingDetails.listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium text-gray-900">{bookingDetails.checkInDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium text-gray-900">{bookingDetails.checkOutDate}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                <span className="text-gray-900 font-semibold">Total:</span>
                <span className="text-lg font-bold text-brand-primary">
                  ${bookingDetails.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Card Information
            </label>
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement options={cardElementOptions} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Your card information is processed securely by Stripe
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-brand-accent border border-brand-accent rounded-lg">
              <p className="text-sm text-white font-medium">{errorMessage}</p>
              <p className="text-xs text-brand-neutralpink mt-1">Please check your card details and try again</p>
            </div>
          )}

          {/* Payment Button */}
          <button
            type="submit"
            disabled={isProcessing || !stripe || !elements}
            className="w-full py-3 bg-brand-primary text-white font-semibold rounded-lg
              hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-opacity flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              `Pay $${bookingDetails.amount.toFixed(2)}`
            )}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full mt-3 py-3 border border-brand-primary text-brand-primary font-semibold rounded-lg
              hover:bg-brand-neutralgreen disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          {/* Security Info */}
          <div className="mt-4 p-3 bg-brand-secondary border border-brand-tertiary rounded-lg">
            <p className="text-xs text-brand-tertiary flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Secure payment encrypted by Stripe
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
