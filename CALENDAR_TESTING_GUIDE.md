# Testing Guide: Calendar UX Improvements

## Setup for Testing

### Test Listing Setup
1. Create a test listing (or use existing)
2. Set availability to specific days (e.g., Friday only for easy testing)
3. Set price to something round like $50/day for easy math
4. Create 2-3 test bookings with specific date ranges

### Test Bookings to Create
For January 2025:
- **Booking 1**: Dec 15 - Dec 20 (existing booking)
- **Booking 2**: Dec 25 - Dec 28 (after first booking)
- **Booking 3**: Jan 10 - Jan 15 (in January for calendar viewing)

---

## Test Scenarios

### Test 1: Visual Legend Appears
**Steps**:
1. Navigate to a listing's detail page
2. Scroll to "Select Dates" calendar
3. Look for the legend box at the top

**Expected Result**: ✅
- Legend box appears with light blue background
- Shows 4 color examples:
  - Gray square = "Past dates or non-available pickup days"
  - Diagonal lines = "Already booked by someone else"
  - Dark blue square = "Your check-in/check-out dates"
  - Light blue square = "Your entire rental period"

---

### Test 2: Full Rental Period Highlighted
**Steps**:
1. Click Monday (Dec 9) as check-in
2. Calendar highlights Monday in dark blue
3. Click Friday (Dec 13) as check-out
4. Calendar should show entire Mon-Fri range highlighted

**Expected Result**: ✅
- Monday: Dark blue (#1e40af)
- Tuesday-Thursday: Light blue (#dbeafe)
- Friday: Dark blue (#1e40af)
- All 5 days appear as a continuous block (visually connected)
- Price shows 5 days × $50 = $250

---

### Test 3: Booked Dates Show Diagonal Lines
**Steps**:
1. Scroll through calendar to find dates with bookings (Dec 15-20, 25-28)
2. Look for visual markers on those dates

**Expected Result**: ✅
- Dec 15-20: Red diagonal line pattern (#ef4444)
- Dec 25-28: Red diagonal line pattern (#ef4444)
- Diagonal lines are clearly visible and distinct from regular cells
- Dates appear in proper grid position

---

### Test 4: Gray Out Non-Available Pickup Days
**Assumption**: Listing owner set availability to "Friday only"

**Steps**:
1. Look at calendar days
2. Find Friday dates vs other days

**Expected Result**: ✅
- All Mon-Thu dates: Gray background, gray text
- All Friday dates: White background, black text, clickable
- All Sat-Sun dates: Gray background, gray text
- Cannot click on gray dates (disabled)
- Can only START rentals on Fridays

---

### Test 5: Conflict Detection - Selection Includes Booked Dates
**Setup**: Existing booking Dec 15-20 exists

**Steps**:
1. Click Dec 10 (before booked period) as check-in
2. Calendar shows Dec 10 highlighted
3. Click Dec 25 (after booked period, but range includes booked dates)

**Expected Result**: ❌ (Correctly prevented)
- Booking does NOT complete
- Red warning box appears at bottom:
  ```
  ❌ Cannot book during this period. There are existing bookings 
     between 2025-12-10 and 2025-12-25. You can book until 2025-12-14.
     
     💡 [Book until 2025-12-14]
  ```
- Calendar shows Dec 15-20 with RED diagonal lines
- Dec 10-20 range shows light blue (selected) + red (booked) overlay
- "Book Now" button is hidden or disabled

---

### Test 6: Smart Suggestion Click
**Steps**:
1. From Test 5, user sees conflict message
2. Click the "Book until 2025-12-14" suggestion

**Expected Result**: ✅
- Check-out date auto-selects to Dec 14
- Calendar updates:
  - Dec 10: Dark blue
  - Dec 11-13: Light blue
  - Dec 14: Dark blue
  - Red diagonal lines still visible for Dec 15-20 but NOT in selected range
- Price updates to 5 days × $50 = $250
- Warning message disappears
- "Book Now" button appears and is clickable
- No date in selection has diagonal lines

---

### Test 7: Booking Without Conflicts (Valid Range)
**Steps**:
1. Click Dec 1 as check-in
2. Click Dec 13 as check-out
3. Verify no conflict message appears

**Expected Result**: ✅
- Dec 1: Dark blue
- Dec 2-12: Light blue
- Dec 13: Dark blue
- No red warning box
- No diagonal lines in selected range
- "Book Now" button is visible and enabled
- Can click "Book Now" to proceed

---

### Test 8: Booking After Booked Period (Valid)
**Steps**:
1. Click Dec 22 as check-in
2. Click Dec 28 as check-out
3. Should NOT conflict with Dec 15-20 booking

**Expected Result**: ✅
- Dec 22: Dark blue
- Dec 23-27: Light blue
- Dec 28: Dark blue
- No conflict warning
- Dates Dec 29 onwards have diagonal lines (that's the Dec 25-28 booking)
- "Book Now" button enabled
- Can proceed with booking

---

### Test 9: Reset After Conflict
**Steps**:
1. Trigger a conflict (Test 5)
2. Click anywhere on calendar to reset
3. Try new date range without conflicts

**Expected Result**: ✅
- Conflict message disappears
- Previously selected dates deselect
- New dates can be selected fresh
- Calendar resets cleanly

---

### Test 10: Owner Availability + Bookings Combined
**Assumption**: 
- Owner allows Fri/Sat pickups only
- Dec 15-20 is booked
- Dec 25-28 is booked

**Steps**:
1. Try to select Wed (should be grayed out)
2. Try to select Fri Dec 13 → Fri Dec 20 (includes booked Dec 15-20)
3. Try to select Fri Dec 13 → Fri Dec 22 (includes booked Dec 15-20 AND 25-28)
4. Try to select Fri Dec 6 → Sat Dec 7 (no conflicts, should work)

**Expected Results**:
- ❌ Wed: Gray, cannot click
- ❌ Dec 13-20: Conflict warning (Dec 15-20 booked)
- ❌ Dec 13-22: Conflict warning (multiple booked periods in range)
- ✅ Dec 6-7: Works, no warning, "Book Now" enabled

---

## Browser Compatibility Testing

### Browsers to Test
- [ ] Chrome/Edge (Chromium) - Latest
- [ ] Firefox - Latest
- [ ] Safari - Latest
- [ ] Mobile Safari (iOS)
- [ ] Chrome (Android)

### Visual Checks Per Browser
- [ ] Diagonal lines render properly (not stretched/distorted)
- [ ] Colors display correctly
- [ ] Calendar grid is aligned
- [ ] Legend displays properly
- [ ] Error messages are readable
- [ ] Hover effects work on clickable dates

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through dates
- [ ] Enter key selects dates
- [ ] Escape to cancel (if implemented)
- [ ] Arrow keys to navigate between dates (nice-to-have)

### Screen Reader
- [ ] Legend is announced
- [ ] Date cells are announced with status (available, booked, gray, etc.)
- [ ] Error messages are announced
- [ ] Color names are NOT the only way to identify states (we use patterns too)

### Color Blindness
- [ ] Diagonal lines visible even without color (protanopia)
- [ ] Not relying ONLY on color to convey meaning
- [ ] Sufficient contrast ratios (WCAG AA 4.5:1 for text)

---

## Edge Cases to Test

### Edge Case 1: Single Day Booking
**Steps**:
1. Select same date for check-in and check-out
   
**Expected Result**:
- Either: System doesn't allow (enforces minimum 1 day)
- Or: Allows with 1 day rental

### Edge Case 2: Booking Touches Booked Date
**Scenario**: Booked Dec 15-20, try Dec 10-15
**Expected Result**:
- Should either allow OR show conflict
- System should be clear about boundary (is Dec 15 included or not?)

### Edge Case 3: Multiple Bookings Close Together
**Scenario**: Booked Dec 5-10, Dec 12-18, Dec 20-25
**Expected Result**:
- Can book Dec 1-4 (before)
- Cannot book Dec 5-11 (conflict with first)
- Can book Dec 11 only (single day between)
- Cannot book Dec 12-19 (conflict with second)
- Cannot book Dec 20+ (conflict with third)

### Edge Case 4: Timezone Edge
**Scenario**: Booking at midnight boundary (Dec 15 00:00 vs 23:59)
**Expected Result**:
- System treats dates consistently
- Dates are YYYY-MM-DD (not datetime)
- No confusion between UTC/local time

---

## Performance Testing

### Calendar Rendering
- [ ] Calendar renders smoothly with 10+ booked periods
- [ ] No lag when clicking dates
- [ ] No lag when switching months
- [ ] No lag on mobile devices

### Large Date Ranges
- [ ] System handles checking 90-day range (next 3 months) smoothly
- [ ] Conflict detection doesn't hang with many bookings

---

## Regression Testing

Make sure previous functionality still works:

- [ ] Payment flow still works after booking selected
- [ ] Price calculation is correct (totalPrice = days × pricePerDay)
- [ ] Check-in/Check-out dates in summary are correct
- [ ] Booking confirmation page shows correct dates
- [ ] Owner profile still loads and displays

---

## Sign-Off Checklist

- [ ] All test scenarios pass
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Accessibility baseline met
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] Documentation updated
- [ ] Ready for production deployment
