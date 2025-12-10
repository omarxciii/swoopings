# Phase 5.4 - Payment Integration Setup Guide

## Overview

Phase 5.4 adds Stripe payment processing to YeahRent, allowing users to securely pay for bookings with their credit cards.

## Environment Variables Required

Add these variables to your `.env.local` file (create it in the root directory if it doesn't exist):

```
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe - Client Side (Safe to expose, use public key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
# OR for production:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here

# Stripe - Server Side (NEVER expose, keep secret)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
# OR for production:
# STRIPE_SECRET_KEY=sk_live_your_live_key_here

# Stripe - Webhook Verification
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# (Optional) For webhook handling via ngrok during local development
# STRIPE_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhooks/stripe
```

## Getting Stripe API Keys

### 1. Create a Stripe Account
- Go to [stripe.com](https://stripe.com)
- Sign up or log in
- Navigate to the Dashboard

### 2. Get Test Keys
- Go to Developers → API keys (left sidebar)
- You'll see two keys:
  - **Publishable Key** (starts with `pk_test_`)
  - **Secret Key** (starts with `sk_test_`)

### 3. Get Webhook Secret
- In the Developers section, find "Webhooks"
- Add a new endpoint for your application
- **For local development**: Use ngrok to create a public URL
  - Install ngrok: https://ngrok.com/download
  - Run: `ngrok http 3000`
  - This gives you a URL like: `https://abc123.ngrok.io`
  - Add webhook endpoint: `https://abc123.ngrok.io/api/webhooks/stripe`
  - Events to monitor: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

- **For production**: Use your actual domain
  - Endpoint: `https://yourdomain.com/api/webhooks/stripe`

- Copy the "Signing secret" (starts with `whsec_`)

### 4. Switch to Live Keys (Production Only)
- Toggle "View test data" switch to OFF
- Copy your live keys (starts with `pk_live_` and `sk_live_`)
- Update `.env.local` with live keys for production

## Testing Payment Flow

### Test Card Numbers

Use these card numbers in the payment modal (Stripe provides test cards):

| Card Number | Status | CVC | Expiry |
|-------------|--------|-----|--------|
| 4242 4242 4242 4242 | Success | Any 3 digits | Any future date |
| 4000 0000 0000 0002 | Declined | Any 3 digits | Any future date |
| 4000 0000 0000 9995 | Insufficient funds | Any 3 digits | Any future date |
| 4000 0000 0000 3220 | Expired card | Any 3 digits | Any future date |

### Testing Steps

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Browse to a listing**
   - Navigate to `/listings` in your app
   - Click on a listing
   - Select check-in and check-out dates

3. **Initiate payment**
   - Click "Book Now"
   - Payment modal will open
   - Enter test card details (use 4242 4242 4242 4242 for success)
   - Click "Pay Now"

4. **Verify payment success**
   - You should be redirected to `/dashboard/bookings/confirmation?bookingId={id}`
   - Booking should be created with status 'pending'
   - Payment intent ID should be stored in the booking

5. **Check webhook processing**
   - Look at your Stripe Dashboard → Events
   - Should see `payment_intent.succeeded` event
   - Webhook handler processes this and updates booking status to 'confirmed'

## Architecture Overview

### Payment Flow

```
1. User selects dates on listing detail page
   ↓
2. Clicks "Book Now" → PaymentModal opens
   ↓
3. Enters card details in Stripe CardElement
   ↓
4. Submits payment form
   ↓
5. Frontend calls POST /api/payments/create-intent
   ↓
6. Server validates amount and creates Stripe PaymentIntent
   ↓
7. Returns clientSecret to frontend
   ↓
8. Frontend calls stripe.confirmCardPayment(clientSecret)
   ↓
9. On success → Backend creates booking with payment_intent_id
   ↓
10. Frontend redirects to confirmation page
    ↓
11. Stripe asynchronously sends webhook event
    ↓
12. Webhook handler updates booking status to 'confirmed'
```

### Key Files

| File | Purpose |
|------|---------|
| `src/components/PaymentModal.tsx` | Stripe card collection and payment UI |
| `src/providers/StripeProvider.tsx` | React provider wrapping app with Stripe context |
| `src/app/api/payments/create-intent/route.ts` | Creates Stripe payment intent |
| `src/app/api/webhooks/stripe/route.ts` | Handles Stripe webhook events |
| `src/app/dashboard/bookings/confirmation/page.tsx` | Confirmation page after successful payment |
| `src/app/api/bookings/[id]/route.ts` | API to fetch booking details |

## Security Considerations

### Client-Side Security ✅
- **CardElement**: Stripe's secure card input (PCI-DSS compliant)
- **Public Key Only**: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is safe to expose
- **No card storage**: Card data is never sent to your server
- **Tokenization**: Stripe returns only the payment intent ID

### Server-Side Security ✅
- **Secret Key Protection**: STRIPE_SECRET_KEY kept in environment variables
- **Webhook Verification**: All webhook events verified with signature
- **Amount Validation**: Server-side validation prevents invalid charges
- **Database RLS**: Supabase Row-Level Security ensures users only access their bookings

### What NOT to Do ❌
- Never expose STRIPE_SECRET_KEY in client code
- Never log full payment intent details
- Never store card information in your database
- Never rely on client-side amount validation

## Troubleshooting

### "Payment system not ready"
- Check browser console for errors
- Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is in `.env.local`
- Ensure StripeProvider is wrapping your app (check root layout)

### "Webhook signature verification failed"
- Verify STRIPE_WEBHOOK_SECRET is correct
- For local development, ensure ngrok URL is up to date
- Check that webhook event types match (payment_intent.*, charge.*)

### Booking not updating to 'confirmed' after payment
- Verify webhook is being received (check Stripe Dashboard → Events)
- Check server logs for webhook processing errors
- Ensure SUPABASE_SERVICE_ROLE_KEY is set for webhook handler
- Verify booking was created with payment_intent_id

### Payment intent amount validation error
- Amount must be between $1 (100 cents) and $10,000 (1,000,000 cents)
- Check that price is correctly calculated and converted to cents

## Next Steps for Production

1. **Get Live Keys**
   - Switch Stripe account to live mode
   - Copy live keys (starts with `pk_live_` and `sk_live_`)

2. **Update Environment**
   - Replace test keys with live keys in production environment
   - Use secure secret management (Netlify Secrets, Vercel Secrets, etc.)

3. **Set Live Webhook**
   - Add webhook endpoint with live domain
   - Stripe will re-verify with live signing secret

4. **Payment Confirmation Emails**
   - Implement email notifications (TODO in webhook handler)
   - Send receipt to renter and notification to owner

5. **Error Handling & Monitoring**
   - Set up Stripe event monitoring
   - Implement retry logic for failed webhooks
   - Add error reporting (e.g., Sentry)

6. **User Support**
   - Document refund process for users
   - Create FAQ for payment issues
   - Set up support contact for billing disputes

## Implementation TODOs

The following items are marked as TODOs for future phases:

- [ ] Email notifications for payment confirmations
- [ ] Refund processing UI
- [ ] Payment history in user dashboard
- [ ] Invoice generation
- [ ] Tax calculation per location
- [ ] Payment method saving (for faster checkout)
- [ ] Subscription/recurring rentals
- [ ] Chargeback prevention and dispute handling

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables-and-secrets)
- [Supabase Webhooks](https://supabase.com/docs/guides/webhooks)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
