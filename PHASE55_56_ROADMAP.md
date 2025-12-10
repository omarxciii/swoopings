# Phase 5.5 & 5.6 Roadmap

## ✅ Completed (Phase 5.5b)
- Calendar UX improvements
- Full rental period visualization
- Booked vs unavailable date visual distinction
- Booking conflict detection and prevention
- Brand color system applied (all blue → brand colors)

---

## 📋 Next Steps

### Phase 5.5c: Blackout Dates UI (Est. 2-3 hours)
**Purpose**: Allow owners to mark vacation/maintenance periods

**Tasks**:
1. **Create BlackoutDatesForm component**
   - Date range picker for start_date and end_date
   - Optional reason field (vacation, maintenance, repairs, etc.)
   - "Add Blackout Period" button
   - "Clear Blackout" quick actions

2. **Create BlackoutDatesList component**
   - Display all existing blackout periods for a listing
   - Show date ranges and reason
   - Delete button for each period
   - Sort by start_date

3. **Integrate into listing edit page**
   - Add tab or section: "Manage Availability"
   - Show current blackout dates
   - Form to add new blackout dates
   - Submit to `addBlackoutDate()` function (already in database.ts)

4. **Database integration**
   - Use `addBlackoutDate(listingId, startDate, endDate, reason)` function
   - Fetch all blackout dates: `getListingBlackoutDates(listingId)`
   - Delete: `deleteBlackoutDate(blackoutDateId)`

5. **Update calendar rendering**
   - Fetch blackout dates alongside booked dates
   - Show as different visual pattern (e.g., diagonal stripes with different color)
   - Include in conflict detection logic

**Files to Create/Modify**:
- `src/components/BlackoutDatesForm.tsx` (new)
- `src/components/BlackoutDatesList.tsx` (new)
- `src/app/listings/[id]/edit.tsx` (new - or modify existing)
- `src/app/dashboard/listings/[id]/availability.tsx` (new owner dashboard)
- `src/components/DateRangePicker.tsx` (update for blackout dates)
- `src/app/listings/[id]/page.tsx` (fetch blackout dates)

---

### Phase 5.6: QR Handover System (Est. 3-4 hours)
**Purpose**: Digital handover verification via QR code

**User Flow**:
1. Owner generates QR code at listing creation (auto-generated)
2. Renter shows QR code at pickup (screenshot from booking confirmation)
3. Owner scans QR code with camera
4. System records: "Handover confirmed on [date/time]"
5. Both users see confirmation in messaging/booking details

**Tasks**:
1. **QR Code Generation**
   - Generate unique QR code per booking (not per listing)
   - QR encodes: `{bookingId}_{secret}`
   - Display on booking confirmation page
   - Downloadable/printable for renter

2. **QR Code Scanner**
   - Camera access on owner's phone
   - Scan during pickup
   - Validate QR matches booking
   - Record handover timestamp

3. **Handover Status Tracking**
   - Add `handover_confirmed_at` to bookings table
   - Add `handover_confirmed_by` (owner_id)
   - Status flow: pending → confirmed → item_returned

4. **UI Components**
   - QR Display component (on confirmation page)
   - QR Scanner component (on owner dashboard)
   - Handover Status badge (on booking cards)
   - Handover History (list of past handovers)

5. **Database Schema**
   - Add columns to bookings table:
     ```sql
     ALTER TABLE bookings ADD COLUMN handover_confirmed_at TIMESTAMP;
     ALTER TABLE bookings ADD COLUMN handover_confirmed_by UUID REFERENCES auth.users(id);
     ALTER TABLE bookings ADD COLUMN handover_scanner_ip VARCHAR(45); -- For logging
     ```

**Files to Create/Modify**:
- `src/components/QRDisplay.tsx` (new)
- `src/components/QRScanner.tsx` (new)
- `src/components/HandoverStatus.tsx` (new)
- `src/app/dashboard/bookings/[id]/scan.tsx` (new owner route)
- `src/app/bookings/[id]/confirmation.tsx` (new renter route)
- `src/utils/database.ts` (new handover functions)

**Dependencies**:
- `qrcode.react` - QR generation
- `html5-qrcode` - QR scanning
- `uuid` - Generate secret tokens

---

### Phase 5.7: Owner Dashboard - Availability Management (Est. 2-3 hours)
**Purpose**: Dedicated owner interface for managing all availability settings

**Features**:
1. **Availability Overview**
   - Current availability settings (days allowed)
   - Next 30 days: show bookings + blackout dates
   - Suggested availability based on usage

2. **Quick Actions**
   - "Open all days" button
   - "Close all days" button
   - "Enable weekends only"
   - "Enable weekdays only"

3. **Manage Pickups**
   - Current day-of-week settings
   - Visual day picker
   - Save changes

4. **Manage Blackout Dates**
   - Calendar view of blackout periods
   - Add new periods
   - Edit existing (change date/reason)
   - Delete

5. **Analytics**
   - Booking frequency by day
   - Most popular pickup days
   - Time between bookings

**Layout**:
```
Dashboard → Listings → [Select Listing] → Availability
├── Availability Overview
├── Days Available (Sun-Sat toggle)
├── Blackout Dates (calendar)
├── Next 30 Days Preview
└── Analytics
```

---

### Phase 5.8: Message Improvements (Est. 1-2 hours)
**Purpose**: Enhanced messaging around availability

**Features**:
1. **Auto-reply templates**
   - When listing unavailable: auto-reply with next available dates
   - Message preview before sending

2. **Availability in messages**
   - Show next 5 available dates in conversation
   - Link to listing calendar

3. **Booking context**
   - Show booking details in messages
   - Quick "Book again" button for renters

---

## 🎯 Priority Order (Recommended)

1. **Phase 5.5c (High Priority)** - Blackout dates needed immediately for real-world use
2. **Phase 5.6 (High Priority)** - QR handover unique selling point
3. **Phase 5.7 (Medium)** - Improves UX for owners managing availability
4. **Phase 5.8 (Low)** - Nice-to-have polish

---

## ⚠️ Known Issues / Tech Debt

- Image optimization (all pages using `<img>` instead of Next.js `<Image>`)
- Button component prop mismatch (`loading` vs `isLoading`)
- Unused imports/variables in various files
- Tailwind CSS linting errors (not functional issues)

---

## 🧪 Testing Requirements

Each phase needs:
- [ ] Happy path testing (main user flow)
- [ ] Edge cases (boundary dates, timezone)
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard, screen reader)
- [ ] Browser compatibility
- [ ] Performance testing

---

## 📦 Dependencies to Install

When you start Phase 5.6:
```bash
npm install qrcode.react html5-qrcode
```

---

## 🚀 Deployment Checklist

Before production deployment:
- [ ] All test scenarios pass
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Environment variables set
- [ ] Stripe test/live keys configured
- [ ] Email notifications working (if implemented)
- [ ] Performance monitoring setup
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Database backups configured

---

## 💡 Quick Reference: Key Database Functions

**Availability**:
- `getListingAvailability(listingId)` - Get available days [0-6]
- `setListingAvailability(listingId, availableDays)` - Save available days
- `getUnavailableDates(listingId, startDate, endDate)` - Get greyed-out dates

**Blackout Dates**:
- `getListingBlackoutDates(listingId)` - Get all blackout periods
- `addBlackoutDate(listingId, startDate, endDate, reason)` - Add vacation/maintenance
- `deleteBlackoutDate(blackoutDateId)` - Remove blackout

**Bookings**:
- `getListingBookings(listingId)` - Get all bookings for a listing
- `checkDateAvailability(listingId, checkIn, checkOut)` - Validate date range
- `createBooking(...)` - Create new booking

---

## 📝 Notes for Future Development

- Color changes: Update `tailwind.config.ts` → automatically applies everywhere
- Calendar logic: All in DateRangePicker.tsx component
- Database: All utility functions in `src/utils/database.ts`
- API routes: `src/app/api/` for backend operations
- Authentication: Supabase auth via `useAuthContext()`
