# Future Enhancement Features - Phase 5+ Planning

## Overview
This document outlines two critical features needed for a more realistic and user-friendly rental system:
1. **Availability Management** - Item availability and booking conflicts
2. **Specific Handover Timing** - Scheduled exchange windows instead of all-day events

---

## Feature 1: Availability Management

### Problem Statement
Currently, the system treats bookings as all-day events with no consideration for:
- Item owner's desired availability (what days/hours they're willing to rent)
- Double-booking prevention (multiple users can book same dates)
- Visibility of booked dates to other renters

### Proposed Solution

#### A. Listing Availability Template
When creating a listing, the owner should specify:

**Availability Pattern:**
- Days of week available: (checkboxes) Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Example: Owner only rents Mon-Wed and weekends (item used Thu-Fri)

**Recurring Hours (optional):**
- Start hour: 09:00 AM
- End hour: 06:00 PM
- (Default: 00:00 - 23:59 for all-day)

**Blackout Dates (optional):**
- Date ranges unavailable (vacations, maintenance)
- Example: Dec 20-26 (holidays)

#### B. Database Schema Updates

**New table: `listing_availability`**
```sql
CREATE TABLE listing_availability (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  day_of_week INTEGER (0-6, 0=Sunday),
  start_hour INTEGER (0-23),
  end_hour INTEGER (0-23),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE listing_blackout_dates (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  start_date DATE,
  end_date DATE,
  reason VARCHAR,
  created_at TIMESTAMP
);
```

**Modify `bookings` table:**
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS (
  handover_start_time TIME,  -- 09:00
  handover_end_time TIME,    -- 10:00
  return_start_time TIME,    -- 18:00
  return_end_time TIME       -- 19:00
);
```

#### C. Calendar Display Logic

**When renter views listing detail:**

1. **Fetch availability rules:**
   - Get `listing_availability` for this listing
   - Get `listing_blackout_dates` for this listing
   - Get all confirmed bookings for this listing

2. **Calculate unavailable dates:**
   - Loop through calendar dates
   - Check if day_of_week matches availability pattern
   - Check if date is in blackout_dates range
   - Check if date overlaps with existing bookings
   - Mark as unavailable if ANY condition true

3. **Visual distinction:**
   - Available dates: Normal color (clickable)
   - Unavailable dates: Gray/crossed out (disabled)
   - Already booked dates: Different shade (shows as taken)
   - Handover time windows: Show as time slots (see Feature 2)

**Example Calendar:**
```
December 2025

S  M  T  W  T  F  S
      X  ✓  X  ✓  X    (Mon=available, Wed=unavailable)
   7  8  9 10 11 12 13
      ✓  X  ✓  ✓  X  
  14 15 16 17 18 19 20
      ✓  X  ✓  ✓  X     (20-24 = Blackout dates)
  21 22 23 24 25 26 27
      X  X  X  X  X  ✓   (20-26 = Holiday blackout)
  28 29 30 31
      ✓  X  ✓  ✓

Legend:
✓ = Available (clickable)
X = Unavailable (grayed out)
━ = Booked (crossed out)
```

#### D. Implementation Steps

**Step 1: Database Migration (30 min)**
- Create listing_availability table
- Create listing_blackout_dates table
- Add columns to bookings table

**Step 2: Listing Creation UI (1.5-2 hours)**
- Add availability form to listing create page
- Day of week checkboxes (Mon-Sun)
- Blackout date range picker
- Save to database

**Step 3: Database Functions (1 hour)**
- `getListingAvailability(listingId)` → Fetch all rules
- `getListingBlackoutDates(listingId)` → Fetch blackouts
- `checkDateAvailability(listingId, startDate, endDate)` → Already exists, enhance it
- `getUnavailableDates(listingId, month)` → Calculate all unavailable dates

**Step 4: Update DateRangePicker (1.5-2 hours)**
- Accept `unavailableDates` array (already does this!)
- Accept `blackoutDates` array
- Calculate combined unavailable list
- Disable dates based on availability rules
- Update visual styling

**Step 5: Booking Creation Logic (1 hour)**
- When renter selects dates, verify availability
- Check against listing_availability rules
- Check against blackout_dates
- Check against existing bookings
- Return helpful error if unavailable

**Step 6: Renter View Update (1 hour)**
- Show booking owner's availability pattern
- Display blackout dates on calendar
- Display existing bookings
- Clear visual distinction between unavailable types

**Total Estimated Time: 6-8 hours**

#### E. Data Flow Example

**Listing Created:**
```
Owner: "I rent Mon/Tue/Wed/Thu only"
→ Creates listing_availability records:
   - Monday: 09:00-22:00
   - Tuesday: 09:00-22:00
   - Wednesday: 09:00-22:00
   - Thursday: 09:00-22:00

Owner: "Not available Dec 20-26 (holidays)"
→ Creates blackout date:
   - 2025-12-20 to 2025-12-26
```

**Renter Browses:**
```
Renter views calendar for this item:
- Friday/Saturday/Sunday: Grayed out (not available)
- Dec 20-26: Crossed out (blackout)
- Dec 15-18 (booked by someone): Dark crossed out (reserved)
- Dec 1-19 (available): Normal, clickable

Renter: "I want Dec 8-10"
System: "Dec 8=Mon✓, Dec 9=Tue✓, Dec 10=Wed✓, all available"
→ Allows booking
```

#### F. Edge Cases to Handle

1. **Overlapping Bookings:**
   - Check before creating booking
   - Error message: "Dates unavailable, item booked [dates]"

2. **Availability Change Mid-Booking:**
   - Once confirmed, dates are locked
   - Owner can't reduce availability for confirmed booking

3. **Timezone Issues:**
   - Store dates in UTC
   - Display in user's timezone

4. **Recurring Availability:**
   - Weekly pattern (Mon-Wed) works well
   - For complex patterns, need more sophisticated system

---

## Feature 2: Specific Handover Timing

### Problem Statement
Currently, bookings span entire days with no defined exchange times:
- Renter books Dec 10-12 (3 full days)
- Owner doesn't know when to expect pickup/return
- Renter must guess when owner is available
- Scheduling conflicts common

### Proposed Solution

#### A. Listing Handover Windows
When creating listing, owner specifies ideal handover times:

**Pickup Time Slot:**
- Day preference (same day, next day, flexible)
- Time window: "09:00 AM - 11:00 AM" or "flexible"
- Example options:
  - "Weekday evenings: 6-8 PM"
  - "Weekend mornings: 9-11 AM"
  - "By appointment only"

**Return Time Slot:**
- Day preference (last day, next day, flexible)
- Time window: "06:00 PM - 08:00 PM"
- Before work, after work, weekend, etc.

#### B. Renter Booking Flow

**Before:** 
```
Renter selects dates (Dec 10-12)
→ Booking created immediately
→ Owner/renter unsure when to exchange
```

**After:**
```
Renter selects dates (Dec 10-12)
→ System shows owner's available pickup slots for Dec 10
   - Morning (9-11 AM) ✓ Available
   - Afternoon (2-4 PM) ✓ Available
   - Evening (6-8 PM) ✓ Available
   
→ Renter selects "Morning (9-11 AM)"

→ System shows available return slots for Dec 12
   - Morning (8-10 AM) ✓ Available
   - Evening (6-8 PM) ✓ Available
   
→ Renter selects "Evening (6-8 PM)"

→ Booking created with:
   - check_in_date: 2025-12-10
   - check_in_time: 09:00-11:00
   - check_out_date: 2025-12-12
   - check_out_time: 18:00-20:00
```

#### C. Database Schema

**New table: `listing_handover_windows`**
```sql
CREATE TABLE listing_handover_windows (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  window_type VARCHAR, -- 'pickup' or 'return'
  day_type VARCHAR,    -- 'same_day', 'next_day', 'flexible'
  start_time TIME,     -- 09:00
  end_time TIME,       -- 11:00
  available_days JSON, -- ["monday", "tuesday", "wednesday"]
  label VARCHAR,       -- "Morning" or "Weekend Evening"
  created_at TIMESTAMP
);
```

**Modify `bookings` table:**
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS (
  pickup_window_id UUID REFERENCES listing_handover_windows(id),
  return_window_id UUID REFERENCES listing_handover_windows(id),
  pickup_time TIME,    -- Exact time agreed on
  return_time TIME,    -- Exact time agreed on
  pickup_confirmed_at TIMESTAMP,
  return_confirmed_at TIMESTAMP
);
```

#### D. Calendar UI for Handover Selection

**Step 1: Renter selects check-in date (Dec 10)**
```
Owner's available pickup times:
┌─────────────────────────────────┐
│ Morning (9:00 - 11:00 AM)  [✓] │
│ Afternoon (2:00 - 4:00 PM) [✓] │
│ Evening (6:00 - 8:00 PM)   [✓] │
└─────────────────────────────────┘
```

**Step 2: Renter selects check-out date (Dec 12)**
```
Owner's available return times:
┌─────────────────────────────────┐
│ Morning (8:00 - 10:00 AM)  [✓] │
│ Evening (6:00 - 8:00 PM)   [✓] │
└─────────────────────────────────┘
```

**Step 3: Confirmation shows**
```
Pickup: Dec 10, 9:00 - 11:00 AM
Return: Dec 12, 6:00 - 8:00 PM
Price: $150
[Proceed to Payment]
```

#### E. Implementation Steps

**Step 1: Database Changes (30 min)**
- Create listing_handover_windows table
- Add columns to bookings table
- Create index on listing_id

**Step 2: Listing Creation UI (1.5-2 hours)**
- Add handover window form
- Pickup time selection (start/end times)
- Return time selection
- Day preference selector
- Label field ("Morning", "Evening", etc.)
- Multiple windows per window type

**Step 3: Database Functions (1 hour)**
- `getListingHandoverWindows(listingId)` → Get all windows
- `getAvailableHandoverSlots(listingId, dateType)` → For booking UI
- `selectHandoverWindow(bookingId, windowId)` → Record selection

**Step 4: DateRangePicker Enhancement (1.5-2 hours)**
- After date selection, show available windows
- Display start/end times for each window
- Let renter select preferred window
- Store selection in booking

**Step 5: Booking Flow Update (1.5 hours)**
- After dates selected, show window selector
- Validate window selection
- Update booking with window info
- Display confirmation with times

**Step 6: Bookings Dashboard Update (1 hour)**
- Show pickup and return times
- Mark as pending, confirmed, completed
- Communication about timing changes

**Total Estimated Time: 7-9 hours**

#### F. Data Flow Example

**Listing Created:**
```
Owner: Creates handover windows:
- Pickup - Morning: Mon-Fri, 9-11 AM
- Pickup - Evening: Mon-Fri, 6-8 PM
- Return - Evening: Mon-Sun, 6-8 PM

Window data saved:
[
  {id: "win_1", type: "pickup", label: "Morning", start: "09:00", end: "11:00"},
  {id: "win_2", type: "pickup", label: "Evening", start: "18:00", end: "20:00"},
  {id: "win_3", type: "return", label: "Evening", start: "18:00", end: "20:00"}
]
```

**Renter Books:**
```
Renter selects: Dec 10 (pickup), Dec 12 (return)
System checks: Dec 10 is Monday (matches pickup Mon-Fri ✓)

Available pickup windows:
- Morning (9-11 AM) ✓
- Evening (6-8 PM) ✓

Renter selects: Morning (9-11 AM)
→ pickup_window_id = "win_1"

System checks: Dec 12 is Wednesday (return available all days ✓)

Available return windows:
- Evening (6-8 PM) ✓

Renter selects: Evening (6-8 PM)
→ return_window_id = "win_3"

Booking created:
{
  check_in_date: "2025-12-10",
  check_out_date: "2025-12-12",
  pickup_window_id: "win_1",
  return_window_id: "win_3",
  status: "pending"
}
```

**Owner Reviews:**
```
Pending booking:
- Item: "Sony Projector"
- Renter: "John Smith"
- Pickup: Dec 10, 9-11 AM ✓
- Return: Dec 12, 6-8 PM ✓
- Amount: $150

[Confirm] [Decline]
```

#### G. Integration with QR Handover (Phase 5.5)

These handover windows are critical for QR handover feature:

```
Owner confirms booking
→ System generates QR code
→ On pickup day at 9-11 AM window:
   - Renter scans QR code
   - Takes photo of item
   - System marks as "ACTIVE"
   
→ On return day at 6-8 PM window:
   - Renter scans QR code
   - Takes photo of returned item
   - System marks as "COMPLETED"
   
Both parties have proof of condition + timing
```

---

## Implementation Priority & Dependencies

### Phase 5.5 (After Payment)
- Feature 1: Availability Management (6-8 hours)
- Feature 2: Handover Timing (7-9 hours)
- **Total: 13-17 hours, approximately 2-3 sessions**

### Why After Payment?
1. Payment integration is core blocker
2. Availability prevents double-booking (critical)
3. Handover timing improves UX significantly
4. Both features enhance QR system (Phase 5.6)

### Interdependencies
```
Phase 5.4 (Payment)
    ↓
Phase 5.5a (Availability)
    ↓
Phase 5.5b (Handover Timing)
    ↓
Phase 5.6 (QR Handover)
```

---

## Benefits When Implemented

### For Renters:
- ✓ Can't accidentally double-book
- ✓ See exactly when they need to pickup/return
- ✓ Plan around their schedule
- ✓ No confusion about timing

### For Owners:
- ✓ Control availability (don't rent certain days)
- ✓ Avoid unscheduled pickups
- ✓ Time exchanges conveniently
- ✓ Better booking predictability

### For Platform:
- ✓ Better user experience
- ✓ Fewer disputes about timing
- ✓ More trust between users
- ✓ More bookings (reliability increases)

---

## Acceptance Criteria

### Availability Feature Complete When:
- [ ] Owners can set day-of-week availability
- [ ] Owners can set blackout date ranges
- [ ] Calendar shows unavailable dates grayed out
- [ ] Double-booking impossible
- [ ] Renters see helpful error messages
- [ ] Confirmed bookings locked (owner can't remove)
- [ ] No TypeScript/lint errors
- [ ] E2E tested with multiple bookings

### Handover Timing Feature Complete When:
- [ ] Owners can create pickup/return windows
- [ ] Windows have time slots and day preferences
- [ ] Renters see available windows when booking
- [ ] Renters can select preferred window
- [ ] Booking displays selected times
- [ ] Owner sees timing details
- [ ] No conflicts with availability windows
- [ ] No TypeScript/lint errors
- [ ] E2E tested with various schedules

---

## Quick Reference for Developers

### What to Implement First:
1. Database schema (both features)
2. Availability rules (Feature 1)
3. DateRangePicker enhancement
4. Handover window selection UI
5. Booking display updates

### Reusable Components:
- TimeSlotSelector - Pick time windows
- DateRangeWithTimeSlots - Combined date+time picker
- AvailabilityGrid - Visual calendar with rules

### API Endpoints Needed:
- POST `/api/listings/:id/availability` - Create rules
- GET `/api/listings/:id/availability` - Get rules
- POST `/api/listings/:id/handover-windows` - Create windows
- GET `/api/listings/:id/handover-windows` - Get windows
- POST `/api/bookings/validate` - Check availability before booking

---

**Status:** Documented for future implementation  
**Priority:** After Phase 5.4 (Payment)  
**Complexity:** Medium-High (13-17 hours total)  
**Impact:** High (greatly improves UX and prevents double-booking)
