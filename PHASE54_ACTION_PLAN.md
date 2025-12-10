# Phase 5 - Next Session Action Plan

## Quick Summary
✅ **Completed This Session:**
- Fixed price display bug ($1.50 → $150)
- Consolidated navigation to /dashboard/bookings
- Added pending booking notifications badge
- All 3 high-priority issues resolved

---

## 🎯 Next Priority: Phase 5.4 Payment Integration

### What Needs to Be Done:
Payment processing is the final critical feature for Phase 5. Currently, bookings are created with `payment_intent_id: null` - no actual payment is processed.

### Implementation Roadmap:

#### Step 1: Stripe Setup (30 min)
- [ ] Create Stripe account (if not already done)
- [ ] Get API keys (publishable + secret)
- [ ] Add to `.env.local`: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY
- [ ] Install Stripe packages: `npm install stripe @stripe/react-stripe-js @stripe/stripe-js`

#### Step 2: Payment Modal Component (1-1.5 hours)
- [ ] Create `src/components/PaymentModal.tsx`
- [ ] Features:
  - Display booking amount
  - Stripe card element
  - Process button
  - Loading state
  - Error handling
- [ ] Accept props: booking details, onSuccess callback, onError callback
- [ ] Return payment intent ID on success

#### Step 3: Create Payment Endpoint (1 hour)
- [ ] Create `src/app/api/create-payment-intent/route.ts`
- [ ] Accepts: bookingId, amount
- [ ] Creates Stripe payment intent
- [ ] Returns: clientSecret
- [ ] Error handling and validation

#### Step 4: Integrate with Booking Flow (1 hour)
- [ ] Modify booking creation flow:
  - Show payment modal instead of immediate booking creation
  - Process payment first
  - Then create booking with payment_intent_id
- [ ] Update `src/app/listings/[id]/page.tsx`:
  - Add payment modal state
  - Call payment endpoint
  - Create booking on success
  - Show error on failure

#### Step 5: Handle Webhook Events (1-1.5 hours)
- [ ] Create `src/app/api/webhooks/stripe/route.ts`
- [ ] Listen for payment_intent.succeeded
- [ ] Listen for payment_intent.payment_failed
- [ ] Update booking status accordingly
- [ ] Handle customer notifications

#### Step 6: Order Confirmation Page (1 hour)
- [ ] Create `src/app/dashboard/bookings/[bookingId]/confirmation/page.tsx`
- [ ] Display booking confirmation
- [ ] Show receipt details
- [ ] Payment confirmation
- [ ] Next steps for renter/owner

**Total Estimated Time: 5-6 hours**

---

## 📋 Detailed Implementation Guide

### Environment Setup
```bash
# Install dependencies
npm install stripe @stripe/react-stripe-js @stripe/stripe-js

# Add to .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Key Files to Create/Modify:
1. `src/components/PaymentModal.tsx` - New
2. `src/app/api/create-payment-intent/route.ts` - New
3. `src/app/api/webhooks/stripe/route.ts` - New
4. `src/app/dashboard/bookings/[bookingId]/confirmation/page.tsx` - New
5. `src/app/listings/[id]/page.tsx` - Modify (add payment flow)
6. `src/utils/database.ts` - Modify (add payment-related functions)

### Database Considerations:
- `bookings` table already has `payment_intent_id` field ✓
- No schema changes needed
- Just populate payment_intent_id on successful payment

### Testing Strategy:
- Use Stripe test keys (pk_test_*, sk_test_*)
- Test card numbers available in Stripe docs
- Test success: 4242 4242 4242 4242
- Test failure: 4000 0000 0000 0002
- Test 3D Secure: 4000 0025 0000 3155

---

## 🔗 Related Documentation

### Reference Files:
- `PHASE5_IMPROVEMENTS_SUMMARY.md` - Today's completed work
- `PHASE5_NOTES.md` - Original implementation notes
- `SESSION_SUMMARY_2025-12-07.md` - Full context
- `FEATURE_QR_HANDOVER_DESIGN.md` - Future feature (Phase 5.5)

### Stripe Documentation:
- https://stripe.com/docs/payments/payment-intents
- https://stripe.com/docs/stripe-js/react
- https://stripe.com/docs/webhooks

---

## 💡 Architecture Notes

### Payment Flow:
```
User clicks "Book Now"
  ↓
Show Payment Modal
  ↓
User enters card details
  ↓
Call /api/create-payment-intent
  ↓
Stripe creates payment intent
  ↓
Stripe.confirmCardPayment()
  ↓
Payment successful
  ↓
Create booking with payment_intent_id
  ↓
Redirect to confirmation page
  ↓
Webhook confirms payment_intent.succeeded
  ↓
Booking ready for owner review
```

### Security Considerations:
- Use server-side payment intent creation (not client-side)
- Never store card details (Stripe handles this)
- Validate amount on server before creating intent
- Verify webhook signatures
- Use HTTPS in production

### Business Logic:
- Owner receives 80%, YeahRent takes 20% (or set custom split)
- Payment captured immediately (not just authorized)
- Refunds handled in disputes (future feature)
- Payment records stored for accounting

---

## ⚠️ Known Issues / Considerations

### Already Fixed This Session:
- ✅ Price display bug ($1.50 → $150)
- ✅ Navigation to bookings page
- ✅ Notification badge for pending bookings

### Not Yet Addressed:
- Refund mechanism (needed for cancellations)
- Multi-currency support (future enhancement)
- Invoice generation (optional nice-to-have)
- Tax calculation (depends on jurisdiction)

---

## 📅 Session Checklist

### Before Starting Phase 5.4:
- [ ] Have Stripe account ready
- [ ] Have API keys available
- [ ] Review Stripe documentation
- [ ] Understand payment intent flow
- [ ] Have test card numbers ready

### During Implementation:
- [ ] Create PaymentModal component first (modular)
- [ ] Test payment endpoint independently
- [ ] Wire up UI to payment flow
- [ ] Test with Stripe test cards
- [ ] Implement webhook handling
- [ ] Create confirmation page
- [ ] Test full flow end-to-end

### After Implementation:
- [ ] Verify all error cases handled
- [ ] Check database stores payment_intent_id
- [ ] Test webhook signature verification
- [ ] Manual test with multiple bookings
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Final production test

---

## 🎯 Success Criteria for Phase 5.4

- [ ] Users can pay for bookings via Stripe card
- [ ] Payment intent ID stored in database
- [ ] Webhook confirms successful payments
- [ ] Confirmation page shows receipt
- [ ] Users redirected appropriately
- [ ] Errors handled gracefully
- [ ] No sensitive data logged
- [ ] Security best practices followed
- [ ] 0 lint/TypeScript errors
- [ ] All 3 user types (renter, owner, admin) tested

---

## 📞 Quick Reference

### Files Created So Far (Phase 5):
1. `src/components/DateRangePicker.tsx` - Calendar date selector
2. `src/components/BookingCard.tsx` - Booking display component
3. `src/app/dashboard/bookings/page.tsx` - Bookings dashboard
4. `src/utils/database.ts` functions:
   - createBooking
   - getBooking
   - updateBookingStatus
   - getUserBookingsAsRenter
   - getUserBookingsAsOwner
   - getListingBookings
   - checkDateAvailability
   - calculateBookingPrice
   - getPendingBookingCount (NEW)

### Modified This Session:
1. `src/components/DateRangePicker.tsx` - Price display fix
2. `src/components/Navbar.tsx` - Navigation + badge
3. `src/app/listings/[id]/page.tsx` - Redirect + booking flow
4. `src/utils/database.ts` - Added getPendingBookingCount

---

**Last Updated:** December 7, 2025  
**Current Status:** Ready for Phase 5.4  
**Estimated Next Duration:** 5-6 hours
