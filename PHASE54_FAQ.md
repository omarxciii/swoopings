# Phase 5.4 - Frequently Asked Questions

## Setup & Configuration

### Q: Where do I get Stripe API keys?
**A:** Go to [stripe.com/dashboard](https://stripe.com/dashboard):
1. Sign in to your Stripe account
2. Click Developers (left sidebar)
3. Click API keys
4. Copy your Publishable Key (pk_test_...) and Secret Key (sk_test_...)
5. Add to `.env.local`

### Q: What's the difference between test and live keys?
**A:** 
- **Test keys**: For development/testing (pk_test_, sk_test_)
  - Use provided test cards (4242 4242 4242 4242)
  - No real charges
  - Can test all scenarios
  
- **Live keys**: For production (pk_live_, sk_live_)
  - Real payments processed
  - Real charges to cards
  - Only use after thorough testing

### Q: Can I use test keys and live keys at the same time?
**A:** No. Your app uses one or the other based on environment variables.
- Local: Use test keys
- Production: Use live keys
- Never mix them

### Q: My .env.local is not being recognized
**A:** 
1. Make sure file is in root directory (same level as package.json)
2. Restart dev server after creating file (`Ctrl+C` then `npm run dev`)
3. Check file is named exactly `.env.local` (not .env or .env.development)

---

## Payment Processing

### Q: Why does my payment fail with "Payment system not ready"?
**A:** Likely causes:
1. Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local
2. Stripe not initialized yet (add to StripeProvider)
3. Browser JavaScript errors (check console with F12)
4. Page reload needed after .env.local changes

### Q: Can I use real cards for testing?
**A:** No, never use real cards with test keys. Use Stripe's provided test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- See full list: `PHASE54_PAYMENT_SETUP.md`

### Q: What CVC and expiry should I use for test cards?
**A:** Any values:
- CVC: Any 3 digits (e.g., 123)
- Expiry: Any future date (e.g., 12/25)

### Q: Why does my booking show status 'pending' instead of 'confirmed'?
**A:** The webhook hasn't processed yet. This happens asynchronously:
1. Payment succeeds → Booking created as 'pending'
2. Stripe sends webhook event
3. Backend processes webhook
4. Booking updates to 'confirmed'

This may take a few seconds in local testing. In production, usually < 1 second.

### Q: Can users see their payment_intent_id?
**A:** Currently no, it's stored in database for webhook matching. Could be added to booking details in future.

---

## Webhook Testing (Local Development)

### Q: Do I need to set up webhooks locally?
**A:** Optional - for testing webhook processing:
- ✅ Webhooks are optional for core payment functionality
- ✅ Payment succeeds without webhooks (booking created)
- ✅ Webhook updates booking status to 'confirmed' (nice-to-have)

### Q: How do I test webhooks locally?
**A:** Use ngrok to expose your local server:
1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Get public URL (e.g., https://abc123.ngrok.io)
4. In Stripe Dashboard → Webhooks → Add Endpoint
5. URL: `https://abc123.ngrok.io/api/webhooks/stripe`
6. Select events: payment_intent.*, charge.refunded
7. Copy signing secret
8. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Q: Webhook signature verification failed - what's wrong?
**A:** Likely causes:
1. STRIPE_WEBHOOK_SECRET is wrong or missing
2. webhook_secret in code doesn't match
3. Using different Stripe account for keys vs webhook

**Solution**:
1. Verify STRIPE_WEBHOOK_SECRET is correct (starts with whsec_)
2. Confirm it matches the webhook in Stripe Dashboard
3. Restart dev server

### Q: Can I test webhooks without ngrok?
**A:** Yes, partially:
1. Payment processing works fine (user sees success)
2. Database update (booking status to 'confirmed') requires webhook
3. For basic testing, ngrok is optional

For production deployment, webhooks are required.

---

## Error Handling

### Q: Payment failed with "Amount out of acceptable range"
**A:** The booking price is too high or too low:
- Minimum: $1.00 (100 cents)
- Maximum: $10,000.00 (1,000,000 cents)

Check your DateRangePicker for the calculated price.

### Q: "Booking creation failed" - what went wrong?
**A:** Multiple possible causes:
1. Supabase connection issue
2. Missing renter_id or owner_id
3. Invalid date range
4. Database RLS policy blocking

**Debug**:
1. Check browser console (F12)
2. Check server logs
3. Verify Supabase credentials
4. Check booking doesn't already exist

### Q: "Webhook signature verification failed"
**A:** See webhook section above.

### Q: Card processing error "generic_decline"
**A:** Generic decline - could be:
1. Using a real card (use test card instead)
2. Issuing bank decline
3. Card doesn't support payments

Use test card 4242 4242 4242 4242 for testing.

---

## Database & Data

### Q: Where is the payment_intent_id stored?
**A:** In the `bookings` table:
- Column: `payment_intent_id`
- Type: TEXT
- Used for: Webhook matching

Example: `pi_1234567890abcdef`

### Q: How do I check booking status in database?
**A:** Via Supabase Dashboard:
1. Go to your Supabase project
2. Click Table Editor
3. Click "bookings" table
4. Look for "status" column (pending, confirmed, cancelled, completed)

### Q: Can I delete a booking?
**A:** Database allows deletion via RLS policies:
- Renter can delete own bookings
- Owner can delete own bookings

Use caution - deleted bookings can't be recovered.

### Q: Does the confirmation page work without webhooks?
**A:** Yes! The confirmation page:
1. ✅ Works immediately after payment
2. ✅ Displays booking details
3. ✅ Shows next steps
4. ✅ Links to messaging

The only difference is booking status (pending vs confirmed), which is cosmetic.

---

## Production Deployment

### Q: How do I go live with Stripe?
**A:** 
1. Finish testing with test keys
2. Get live keys from Stripe (switch to live mode)
3. Update `.env.local` with live keys
4. Deploy to production
5. Configure live webhook endpoint in Stripe
6. Test with live environment

### Q: Should I keep test and live keys separate?
**A:** Yes, best practice:
- Development environment: Use test keys
- Production environment: Use live keys
- Never mix them

### Q: Do I need to enable Stripe 3D Secure?
**A:** Not required, but recommended:
- Optional: Basic card payments work without it
- Recommended: 3D Secure increases security
- Choose in Stripe Dashboard settings

### Q: How do I handle refunds?
**A:** Currently not implemented (marked TODO):
1. Manual refunds via Stripe Dashboard
2. Webhook handles refund notification
3. Future: Build refund UI in dashboard

---

## Troubleshooting

### Q: Everything fails - where do I start?
**A:** In order:
1. Check `.env.local` exists and has correct keys
2. Restart dev server (`Ctrl+C` then `npm run dev`)
3. Check browser console (F12) for errors
4. Check server logs in terminal
5. Try test card 4242 4242 4242 4242

### Q: How do I see detailed error messages?
**A:** 
1. **Frontend**: Open browser DevTools (F12) → Console tab
2. **Backend**: Check terminal where npm run dev is running
3. **Stripe**: Go to Stripe Dashboard → Events tab
4. **Database**: Check Supabase logs

### Q: Payment works but booking isn't created
**A:** 
1. Check browser console for API errors
2. Check server logs
3. Verify Supabase is accessible
4. Try reloading page

### Q: Confirmation page shows "Unable to load booking"
**A:** 
1. Verify bookingId is in URL correctly
2. Check that booking exists in database
3. Verify user is logged in
4. Check API endpoint authorization

---

## Performance & Optimization

### Q: Why is payment confirmation slow?
**A:** Payment processing takes:
- Creating intent: ~100ms
- Confirming payment: ~500-2000ms (Stripe processing)
- Creating booking: ~100ms
- Redirecting: ~200ms
- Total: Usually 1-3 seconds

This is normal. Stripe adds delay for security processing.

### Q: Can I pre-create payment intents?
**A:** Not recommended. Current flow:
1. User sees total price
2. Click "Pay" → Create intent immediately
3. Confirm payment

Alternatives add complexity without much benefit.

### Q: Should I cache booking data?
**A:** For confirmation page:
- No caching needed (data just created)
- Could cache for dashboard view (future optimization)

---

## Integration with Other Features

### Q: Does payment integrate with messaging?
**A:** Indirectly:
1. User pays for booking
2. Confirmation page has "Message Owner" button
3. Opens messaging with owner
4. Currently no automatic message sent

Could be improved in future to send initial message automatically.

### Q: Does payment track inventory/availability?
**A:** Not yet (Phase 5.5 feature):
- Currently: No availability checking
- Users can book same dates multiple times (would need refund)
- Phase 5.5: Will add calendar availability system

### Q: Does payment send email notifications?
**A:** Not yet (marked TODO):
- Booking created but no email sent
- Future: Send confirmation to renter and notification to owner
- Currently: Users must check dashboard

---

## Security & Compliance

### Q: Is this PCI-DSS compliant?
**A:** Yes, because:
1. Use Stripe CardElement (PCI-DSS compliant)
2. Card data never touches your server
3. Only payment intent ID stored
4. Industry-standard encryption

### Q: Can users see others' payments?
**A:** No:
1. RLS policies restrict database access
2. Users only see their own bookings
3. Payment IDs are just internal identifiers

### Q: Is webhook processing secure?
**A:** Yes:
1. Signature verification prevents spoofing
2. Only Stripe can send valid webhooks
3. All events verified with secret key

---

## Common Integration Questions

### Q: How do I add payment to other booking types?
**A:** Payment is already integrated into:
- Listing detail page → clicking "Book Now"

To add elsewhere:
1. Import PaymentModal component
2. Manage modal state (showPaymentModal)
3. Call handlePaymentSuccess on success
4. Create booking same way

---

## Still Have Questions?

### Reference Documents
- **Quick Setup**: `PHASE54_QUICKSTART.md`
- **Complete Guide**: `PHASE54_PAYMENT_SETUP.md`
- **Architecture**: `PHASE54_CODE_REFERENCE.md`
- **All Docs**: `DOCUMENTATION_INDEX.md`

### Getting Help
1. Check console errors (F12)
2. Review relevant documentation
3. Check Stripe Dashboard for event details
4. Verify all environment variables are set
5. Restart dev server after changes

---

**Last Updated**: December 7, 2025  
**Version**: 1.0
