# Phase 5 - Booking System Implementation Notes

## Current Status
Phase 5.1-5.3 (Database, UI Components, Pages) - **COMPLETE & FUNCTIONAL**
Phase 5.4 (Payment Integration) - **NOT STARTED**

---

## Issues & Known Bugs

### 1. ⚠️ Price Display Bug (Priority: HIGH)
**Location:** `src/components/BookingCard.tsx` and/or `src/app/listings/[id]/page.tsx`

**Issue:** 
- Total price shown in BookingCard is incorrect (divided by 100)
- Total price shown on "Book Now" button is correct
- Root cause: Inconsistent price formatting - booking stores price in cents but display logic may have double conversion

**Symptoms:**
- Button shows: "Book Now - $150.00" ✓ (correct)
- BookingCard shows: "$1.50" ✗ (wrong - should be $150.00)
- Dashboard shows: ??? (user needs to verify)

**Investigation Steps:**
1. Check database directly: `SELECT total_price FROM bookings LIMIT 1;`
   - If price is 150: Multiplying by 100 in handleBooking is MISSING
   - If price is 15000: Database is correct, display has double-division issue
2. Trace the calculation:
   - DateRangePicker returns: $150 (in dollars)
   - handleBooking should store: 15000 (cents)
   - BookingCard should display: $150 (dividing 15000 by 100)
3. Check if any other component is displaying price with extra /100

**Code Paths to Check:**
- Line 178 in `/src/app/listings/[id]/page.tsx`: `Math.round(totalPrice * 100)` - ensure 100 multiplier is there
- Line 138 in `/src/components/BookingCard.tsx`: `${(booking.total_price / 100).toFixed(2)}` - this looks correct
- Check if price displayed anywhere else in /bookings page

**Fix Needed:**
- Verify multiplier by 100 exists in handleBooking
- OR verify division by 100 doesn't happen twice

---

## Pending Features & Improvements

### 2. ⚠️ Navigation Structure (Priority: MEDIUM)
**Current Issue:**
- `/bookings` page created but not linked in navigation/dashboard
- `/dashboard/bookings` mentioned in dashboard but doesn't exist
- User can only access `/bookings` by manually typing URL
- Inconsistent URL structure

**Recommended Fix:**
- Unify to single location: `/dashboard/bookings` (matches dashboard structure)
- OR: Link `/bookings` from dashboard nav
- Add Bookings link to Navbar alongside Messages link
- Show notification badge on Bookings link (see #3)

---

### 3. 📱 Notifications System (Priority: MEDIUM)
**Feature:** Add notification badges for pending booking requests

**Implementation Plan:**
- Create badge component showing unread booking notifications count
- Add to Navbar next to Messages badge
- Display in dashboard
- Badge triggers when:
  - Owner receives new booking request (status = pending)
  - Renter's booking is confirmed/cancelled by owner
  - Booking status changes

**Database function needed:**
- `getPendingBookingCount(userId)` - Count pending bookings for owner

**UI components:**
- Add badge to Navbar (similar to unread messages)
- Show notification count next to Bookings menu item
- Clear notification when viewing /bookings page

---

### 4. 🔐 QR Code Handover System (Priority: LOW - Future Enhancement)
**Feature:** Secure item handover tracking with QR code scanning

**Purpose:**
- Build trust in the platform
- Create verifiable record of item handover
- Trigger rental period start/end automatically
- Prevent disputes about condition/timing

**Implementation Components:**

#### Backend:
1. Create `handovers` table:
   ```sql
   - id (UUID)
   - booking_id (FK)
   - handover_type ('pickup' | 'return')
   - qr_code (text)
   - scanned_at (timestamp)
   - scanned_by (FK to profiles)
   - photos (array of image URLs)
   - notes (text)
   - created_at
   ```

2. Database functions:
   - `generateQRCode(bookingId)` - Generate unique QR for pickup/return
   - `recordHandover(bookingId, type, scannedBy)` - Record handover scan
   - `getHandoverHistory(bookingId)` - Get handover records

#### Frontend:
1. Components:
   - `QRCodeDisplay.tsx` - Show QR code for pickup/return
   - `QRScanner.tsx` - Scan QR code with camera/file upload
   - `HandoverModal.tsx` - Capture handover with photo + notes
   - `HandoverTimeline.tsx` - Show pickup/return history

2. Pages:
   - `/bookings/[id]/pickup` - Pickup handover page
   - `/bookings/[id]/return` - Return handover page

3. Workflows:
   - **Pickup Flow:**
     - Renter sees "Ready for Pickup" button
     - Owner generates QR code 
     - Renter scans QR, takes photo, adds notes
     - Booking status → 'confirmed' → 'active'
     - Rental period officially starts
   
   - **Return Flow:**
     - After check-out date, shows "Mark as Returned"
     - Renter/Owner can initiate return handover
     - QR code scan confirms return
     - Photos document item condition
     - Booking status → 'completed'
     - Enable reviews/ratings

#### Security Considerations:
- QR codes are one-time use per handover event
- Both parties must confirm handover
- Photos timestamped and encrypted
- Cannot mark complete without handover scan
- Creates immutable audit trail

#### Phase Recommendation:
- Phase 5.5 or Phase 6 (after payment is working)
- Requires camera permissions and photo upload infrastructure
- High trust-building impact for peer-to-peer rental

---

## Phase 5.4 - Payment Integration (NEXT STEP)

**Requirements:**
- [ ] Stripe API keys setup
- [ ] Create `payments` table for transaction records
- [ ] Payment modal component
- [ ] Process payment on booking creation
- [ ] Handle payment success/failure
- [ ] Payment webhook for Stripe events
- [ ] Order confirmation page
- [ ] Invoice generation
- [ ] Refund handling (if booking cancelled)

**Suggested Approach:**
1. Setup Stripe account and get API keys
2. Create payment database functions
3. Add Stripe SDK to project
4. Create payment modal component
5. Integrate with booking flow
6. Test with Stripe test mode

---

## Code Quality Notes

### Areas for Refactoring (Future):
- `DateRangePicker.tsx` - formatDateISO could be util function
- `BookingCard.tsx` - Status color logic could be extracted to util
- Booking functions could use common error handling wrapper
- Consider pagination for listings with many bookings

### Performance Optimizations Needed:
- Bookings page loads all user bookings at once (add pagination)
- DateRangePicker re-renders calendar unnecessarily (memoize)
- Profile/Listing cache could use React Query for better state management

---

## Testing Checklist

- [ ] Book item as user A with dates
- [ ] Verify correct total price shown everywhere
- [ ] Owner (user B) confirms booking
- [ ] Both users see updated status in /bookings
- [ ] Test overlapping date bookings (should prevent)
- [ ] Test cancelling pending booking
- [ ] Test past bookings show "completed" status
- [ ] Navigation to /bookings from all entry points works

---

## File Summary

**Modified Files:**
- `src/utils/database.ts` - Added 6 booking functions
- `src/app/listings/[id]/page.tsx` - Added booking interface
- `src/components/DateRangePicker.tsx` - NEW
- `src/components/BookingCard.tsx` - NEW
- `src/app/bookings/page.tsx` - NEW

**Next Session TODO:**
- [ ] Fix price display bug (#1)
- [ ] Consolidate booking page navigation (#2)
- [ ] Implement Stripe payment (#5.4)
