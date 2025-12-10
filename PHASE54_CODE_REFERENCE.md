# Phase 5.4 - Code Reference & Architecture

## Payment Processing Architecture

### Component Hierarchy
```
App (root layout)
├── StripeProvider
│   └── Elements (from @stripe/react-stripe-js)
│       ├── Pages
│       │   └── Listing Detail (/listings/[id])
│       │       └── PaymentModal
│       │           └── CardElement (from Stripe)
│       └── API Routes
│           ├── /api/payments/create-intent
│           ├── /api/webhooks/stripe
│           └── /api/bookings/[id]
```

## Data Flow

### 1. Payment Creation

```
User Input (Listing Detail Page)
    ↓
handleBookingClick()
    ↓ (state update)
    ↓
showPaymentModal = true
    ↓
PaymentModal opens with:
  - listingTitle
  - amount (in dollars)
  - checkInDate
  - checkOutDate
```

### 2. Payment Processing

```
User submits card in PaymentModal
    ↓
handleSubmit() in PaymentModal
    ↓
convert amount to cents: Math.round(amount * 100)
    ↓
POST /api/payments/create-intent
    ├── Server validates: 100 ≤ cents ≤ 1,000,000
    ├── Creates Stripe PaymentIntent
    └── Returns { clientSecret, paymentIntentId }
    ↓
Frontend: stripe.confirmCardPayment(clientSecret)
    ├── Stripe processes card securely
    └── Returns payment result
    ↓
        ├─ ON SUCCESS
        │   └─ onSuccess(paymentIntentId)
        │       └─ handlePaymentSuccess()
        │           └─ createBooking() with payment_intent_id
        │               └─ redirect to /dashboard/bookings/confirmation?bookingId={id}
        │
        └─ ON ERROR
            └─ onError(errorMessage)
                └─ handlePaymentError()
                    └─ setPaymentError()
                        └─ Display error in modal
```

### 3. Webhook Processing

```
Stripe sends payment_intent.succeeded event
    ↓
POST /api/webhooks/stripe
    ├── Verify signature with STRIPE_WEBHOOK_SECRET
    ├── Extract paymentIntentId
    └── Query bookings WHERE payment_intent_id = ?
        ├── Found booking
        │   ├── Update status to 'confirmed'
        │   └── Log success
        └── Not found
            └── Log warning (booking might not exist yet)
```

## Key Files Explained

### PaymentModal.tsx
**Purpose**: Secure card collection and payment UI

**Key Functions**:
- `handleSubmit(e)` - Payment form submission
  1. Prevent default
  2. Create payment intent on backend
  3. Confirm payment with Stripe
  4. Call success/error callbacks

**Key Hooks**:
- `useStripe()` - Access Stripe instance
- `useElements()` - Access Elements instance
- `useState(isProcessing, errorMessage)` - UI state

**Props**:
- `isOpen: boolean` - Modal visibility
- `bookingDetails: BookingDetails` - Summary info
- `onSuccess: (paymentIntentId) => void` - Success callback
- `onError: (error) => void` - Error callback
- `onClose: () => void` - Close callback

**Security Notes**:
- Uses Stripe's secure CardElement (never touches card data)
- Only sends amount in cents, description to backend
- Receives only clientSecret back (safe to use)

### StripeProvider.tsx
**Purpose**: Initialize Stripe and provide context to children

**Key Elements**:
- `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` - Load Stripe instance
- `Elements provider` - Wraps app with Stripe context
- Makes CardElement available throughout app

**Import in layout.tsx**:
```tsx
<AuthProvider>
  <StripeProvider>
    <Navbar />
    <main>{children}</main>
  </StripeProvider>
</AuthProvider>
```

### create-intent/route.ts
**Purpose**: Server-side payment intent creation

**Function**: `POST /api/payments/create-intent`

**Request Body**:
```typescript
{
  amount: number,      // in cents (e.g., 15000 for $150)
  description: string, // booking details
  currency?: string    // default 'usd'
}
```

**Validation**:
- amount must be number
- amount >= 100 (min $1)
- amount <= 1,000,000 (max $10,000)

**Response**:
```typescript
{
  success: true,
  clientSecret: string,
  paymentIntentId: string
}
```

**Security**:
- Uses `STRIPE_SECRET_KEY` (never exposed)
- Validates all inputs server-side
- Only returns safe values to client

### webhooks/stripe/route.ts
**Purpose**: Handle Stripe webhook events asynchronously

**Function**: `POST /api/webhooks/stripe`

**Signature Verification**:
```typescript
stripe.webhooks.constructEvent(
  body,      // raw request body as string
  signature, // from stripe-signature header
  webhookSecret // STRIPE_WEBHOOK_SECRET
)
```

**Handled Events**:
1. `payment_intent.succeeded`
   - Find booking by payment_intent_id
   - Update status to 'confirmed'
   - TODO: Send confirmation email

2. `payment_intent.payment_failed`
   - Log failure details
   - TODO: Send failure notification

3. `charge.refunded`
   - Find booking by payment_intent_id
   - Update status to 'cancelled'
   - TODO: Send refund confirmation

**Database Integration**:
- Uses Supabase service role key for database updates
- Updates bookings table based on payment_intent_id

### bookings/[id]/route.ts
**Purpose**: Fetch booking details for confirmation page

**Function**: `GET /api/bookings/[id]`

**Query Flow**:
1. Verify authorization via Bearer token
2. Query bookings table with authentication
3. Select booking + listing + owner data
4. Return transformed response

**Response**:
```typescript
{
  id: string,
  listing_id: string,
  check_in_date: string,
  check_out_date: string,
  total_price: number,
  status: string,
  listing: {
    id: string,
    title: string,
    owner: {
      username: string,
      full_name: string | null,
      avatar_url: string | null
    }
  }
}
```

**Authorization**: 
- User must be authenticated (Bearer token)
- RLS policies ensure user can only see their bookings

### confirmation/page.tsx
**Purpose**: Display payment success and next steps

**Key Features**:
- Success checkmark icon
- Booking details (dates, price, listing)
- Booking ID display
- Next steps for renter (4-step process)
- Action buttons (Message owner, View bookings, Continue shopping)

**Hooks**:
- `useSearchParams()` - Get bookingId from URL
- `useRouter()` - Redirect on errors
- `useAuth()` - Check user is logged in
- `useState()` - Manage booking data and loading

**Page Flow**:
1. Extract bookingId from query params
2. Verify user is authenticated
3. Fetch booking details from GET /api/bookings/[id]
4. Transform dates to readable format
5. Display confirmation page

## Environment Variables

### Required for Development
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Optional for Local Webhook Testing
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Already Configured (Supabase)
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (for webhooks)
```

## Error Handling

### Frontend Errors

**Payment Modal Level**:
```typescript
try {
  // Create intent
  // Confirm payment
  // Call success
} catch (error) {
  setErrorMessage(error.message)
  // User sees error in modal, can retry
}
```

**Page Level**:
```typescript
handlePaymentError(error: string) {
  setPaymentError(error)
  // User sees error message below date picker
}
```

### Backend Errors

**Intent Creation**:
- Invalid amount → 400 error
- Stripe API error → 500 with message
- Missing auth → 401

**Webhooks**:
- Signature verification fails → 401
- Supabase query fails → Logged, continues processing
- Event handling error → Logged, webhook still returns 200

## Testing Scenarios

### Successful Payment
1. Use card: 4242 4242 4242 4242
2. Any future expiry, any CVC
3. Expected: Redirect to confirmation page
4. Booking created with payment_intent_id
5. Webhook updates status to 'confirmed'

### Failed Payment
1. Use card: 4000 0000 0000 0002
2. Expected: Error message in modal
3. Booking NOT created
4. User can retry with different card

### Amount Validation
1. Test with price < $1
2. Test with price > $10,000
3. Expected: Backend validation error

### Webhook Testing
1. Use ngrok to expose local API
2. Configure Stripe webhook to ngrok URL
3. Monitor webhook events in Stripe Dashboard
4. Check database updates in Supabase

## Development Notes

### Adding New Payment Features
1. **New event type**: Add handler in webhooks/stripe/route.ts
2. **New validation**: Add to create-intent/route.ts
3. **New UI element**: Add to PaymentModal.tsx

### Debugging Tips
1. Check browser console for frontend errors
2. Check server logs for backend errors
3. Monitor Stripe Dashboard → Events for webhooks
4. Use Supabase Dashboard to verify database updates
5. Look for payment_intent_id in bookings table

### Performance Considerations
1. Payment intent creation is fast (< 100ms)
2. Webhook processing is asynchronous (user doesn't wait)
3. Confirmation page fetches booking details (should be < 200ms)
4. Consider caching for repeated API calls

### Security Checklist
- [ ] STRIPE_SECRET_KEY never logged
- [ ] Amount always validated server-side
- [ ] Webhook signature always verified
- [ ] Database RLS policies in place
- [ ] No payment data stored locally
- [ ] HTTPS only in production

---

**Last Updated**: December 7, 2025  
**Version**: 1.0  
**Status**: Complete and tested
