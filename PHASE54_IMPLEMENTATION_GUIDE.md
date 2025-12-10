# Phase 5.4 Payment Integration - Action Plan

## Current Status: Ready to Start ✓

All prerequisites complete:
- ✅ Bookings page fully functional at `/dashboard/bookings`
- ✅ DateRangePicker displays correct prices
- ✅ Bookings stored with correct price in cents
- ✅ Navigation consolidated and working
- ✅ Pending booking badges working

## Implementation Steps

### Step 1: Setup Stripe (30 min)
```bash
# Install Stripe packages
npm install stripe @stripe/react-stripe-js @stripe/stripe-js
```

**Then add to `.env.local`:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_... (get from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (after webhook setup)
```

### Step 2: Create Payment Modal Component (1-1.5 hours)

**File:** `src/components/PaymentModal.tsx`

Key features:
- Display booking amount and details
- Stripe card element for secure input
- Loading state while processing
- Error messages with user-friendly text
- Success callback to parent component
- Modal overlay with close button

Props:
```typescript
interface PaymentModalProps {
  isOpen: boolean;
  bookingDetails: {
    listingTitle: string;
    amount: number;
    checkInDate: string;
    checkOutDate: string;
  };
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}
```

### Step 3: Create Payment Intent Endpoint (1 hour)

**File:** `src/app/api/payments/create-intent/route.ts`

```typescript
// POST /api/payments/create-intent
Request body:
{
  bookingId: string;
  amount: number;
  description: string;
}

Response:
{
  success: true/false;
  clientSecret: string;
  paymentIntentId: string;
  error?: string;
}
```

Logic:
1. Validate amount and bookingId
2. Create Stripe payment intent
3. Return clientSecret for frontend

### Step 4: Integrate Payment into Booking Flow (1 hour)

**Modify:** `src/app/listings/[id]/page.tsx`

Current flow:
```
User selects dates → Clicks "Book Now" → Booking created → Redirects
```

New flow:
```
User selects dates → Clicks "Book Now" → Payment modal opens → 
User enters card → Stripe processes → On success: Create booking → Redirect
```

Changes:
- Add payment modal state
- Show modal instead of direct booking
- Call payment endpoint
- Update booking creation to include payment_intent_id
- Error handling for declined cards

### Step 5: Implement Webhook Handler (1-1.5 hours)

**File:** `src/app/api/webhooks/stripe/route.ts`

Handle events:
- `payment_intent.succeeded` → Update booking status
- `payment_intent.payment_failed` → Mark booking as failed
- `charge.refunded` → Handle refunds

Logic:
1. Verify webhook signature
2. Parse event data
3. Update database accordingly
4. Send notifications (future feature)

### Step 6: Create Order Confirmation Page (1 hour)

**File:** `src/app/dashboard/bookings/[bookingId]/confirmation/page.tsx`

Display:
- Booking confirmation number
- Payment receipt
- Dates and amount
- Next steps for renter and owner
- Contact information

### Step 7: Test & Debug (1 hour)

Test cases:
- Successful payment (card: 4242 4242 4242 4242)
- Declined payment (card: 4000 0000 0000 0002)
- Card error handling
- Webhook signature verification
- Database updates

---

## Key Implementation Details

### Price Handling
```typescript
// Frontend (already correct):
totalPrice = days × pricePerDay  // Result: 150 (dollars)

// For Stripe (cents):
stripeAmount = Math.round(totalPrice × 100)  // 15000 cents

// Database stores:
booking.total_price = 15000  // in cents

// Display (divide by 100):
displayPrice = (15000 / 100).toFixed(2)  // $150.00
```

### Security Checklist
- [ ] Never expose secret key in frontend code
- [ ] Validate amount on server before creating intent
- [ ] Verify webhook signatures with STRIPE_WEBHOOK_SECRET
- [ ] Use HTTPS in production
- [ ] Don't store raw card data (Stripe handles this)
- [ ] Validate bookingId belongs to current user

### Database Changes
No new tables needed! Just populate existing `payment_intent_id` field:
```typescript
// Before payment:
payment_intent_id: null

// After successful payment:
payment_intent_id: "pi_1234567890"
```

---

## Test Card Numbers (Stripe)

### Success Cases:
- Standard charge: `4242 4242 4242 4242`
- 3D Secure required: `4000 0025 0000 3155`

### Failure Cases:
- Generic decline: `4000 0000 0000 0002`
- Lost card: `4000 0000 0000 9995`
- Stolen card: `4000 0000 0000 9987`

Expiry: Any future date
CVC: Any 3 digits

---

## Component Dependencies

### New Components:
- `PaymentModal.tsx` - Reusable payment modal
- Confirmation page - Display receipt

### Modified Components:
- `src/app/listings/[id]/page.tsx` - Add payment flow
- `src/components/Navbar.tsx` - No changes needed (already has badge)

### New API Routes:
- `src/app/api/payments/create-intent/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

### Database Functions (add to `database.ts`):
- `updateBookingPaymentIntent(bookingId, paymentIntentId)`
- `getBookingByPaymentIntent(paymentIntentId)`

---

## Error Handling Strategy

### User-Facing Errors:
- Card declined → Show message, suggest trying different card
- Network error → Retry button
- Invalid amount → Validation before modal opens
- Webhook timeout → Email user confirmation, retry webhook

### Logging:
- Log all payment attempts (sanitized, no full card numbers)
- Log webhook events and signatures
- Log database errors for debugging

---

## Deployment Checklist

### Before Deployment:
- [ ] All test cases pass with test cards
- [ ] Webhook signature verification works
- [ ] Error messages are user-friendly
- [ ] No TypeScript/lint errors
- [ ] Sensitive data not logged
- [ ] HTTPS enforced in production

### Deployment Steps:
1. Add Stripe keys to production environment
2. Deploy code
3. Test with production test keys
4. Switch webhook to production endpoint
5. Monitor for errors

### Post-Deployment:
- [ ] Verify payments process correctly
- [ ] Check database stores payment_intent_id
- [ ] Confirm webhook receives events
- [ ] Test refund flow (if applicable)
- [ ] Monitor error logs

---

## Stripe Documentation Links
- Payment Intents: https://stripe.com/docs/payments/payment-intents
- Stripe.js React: https://stripe.com/docs/stripe-js/react
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

---

## Success Criteria

When Phase 5.4 is complete:
- ✅ Users can pay for bookings with Stripe card
- ✅ Payment intent ID stored in database
- ✅ Webhook confirms successful payments
- ✅ Confirmation page shows receipt
- ✅ Users get error feedback if payment fails
- ✅ Owner sees booking only after payment succeeds
- ✅ Renter gets receipt/confirmation
- ✅ No sensitive data exposed
- ✅ 0 lint/TypeScript errors
- ✅ Full user flow tested

---

## Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Setup Stripe | 30 min | Ready |
| Payment Modal | 1-1.5h | Ready |
| Payment Endpoint | 1h | Ready |
| Booking Integration | 1h | Ready |
| Webhook Handler | 1-1.5h | Ready |
| Confirmation Page | 1h | Ready |
| Testing & Debug | 1h | Ready |
| **TOTAL** | **5-6h** | **Ready to Start** |

---

**Next Step:** Begin with Stripe setup and create payment modal component.
