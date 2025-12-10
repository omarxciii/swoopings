# Calendar Legend and Visual Guide

## Color Legend

### 1. Gray Background - Unavailable for Pickup
**Visual**: Light gray background with gray text
**Meaning**: These dates are either:
- In the past
- Days when the owner doesn't allow rentals to START (e.g., if owner only allows Friday pickups, Mon-Thu are gray)

**User Action**: Cannot click these dates

---

### 2. Diagonal Lines Pattern - Already Booked
**Visual**: Red diagonal lines overlaid on calendar cell
**Color Intensity**: 
- Light red (#fca5a5) = Not selected in your range
- Bright red (#ef4444) = In the middle of your selected range (conflict!)

**Meaning**: Someone else has already booked this rental item during this time

**User Action**: Cannot book a range that includes these dates (will get conflict warning)

---

### 3. Dark Blue (#1e40af) - Check-in and Check-out Dates
**Visual**: Dark blue background with white text
**Meaning**: Your selected rental start date and end date

**User Action**: These are the endpoints of your rental

---

### 4. Light Blue (#dbeafe) - Rental Period
**Visual**: Light blue background with dark text
**Meaning**: All dates between your check-in and check-out (the days you're renting the item)

**User Action**: These are all the days your rental will span

---

### 5. White with Border - Available
**Visual**: White background with light gray border, text changes on hover
**Meaning**: This date is available for checkout OR pickup/checkout

**User Action**: Click to select as check-in or check-out date

---

## Interaction Patterns

### Pattern 1: Selecting Dates (No Conflicts)

```
1. User clicks Monday (Jan 6)
   → Calendar highlights Monday in dark blue
   → "Select check-out date" prompt appears

2. User clicks Friday (Jan 10)
   → Calendar shows:
     • Monday = dark blue (check-in)
     • Tuesday-Thursday = light blue (rental period)
     • Friday = dark blue (check-out)
   → Price calculation updates

3. User clicks "Book Now"
   → Booking proceeds without conflict warning
```

### Pattern 2: Owner Availability Restriction

```
Scenario: Owner only allows Friday pickups

Visual:
┌─────────────────────────────────┐
│        January 2025             │
├─────────────────────────────────┤
│ Sun│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat│
├────┼─────┼─────┼─────┼─────┼─────┼────┤
│ 4  │ 5   │ 6   │ 7   │ 8   │ 9   │ 10 │
│    │ 🔒  │ 🔒  │ 🔒  │ 🔒  │ ✓   │ 🔒  │ (gray = unavailable)
│    │ 11  │ 12  │ 13  │ 14  │ 15  │ 16 │
│    │ 🔒  │ 🔒  │ 🔒  │ 🔒  │ ✓   │ 🔒  │

Legend:
🔒 = Gray (cannot select for pickup)
✓  = White (can select for pickup)

User can only START rentals on Fridays (9, 15, 22, 29)
Can return item on ANY day
```

### Pattern 3: Booking Conflict Detection

```
Scenario: Existing booking Dec 15-20, user tries Dec 10-25

Step 1: User selects Dec 10
  → Highlighted in dark blue

Step 2: User selects Dec 25
  → System detects booked dates in range
  → Shows RED WARNING at bottom:
  
  "Cannot book during this period. There are existing 
   bookings between 2025-12-10 and 2025-12-25. 
   You can book until 2025-12-14.
   
   [Click to] Book until 2025-12-14"

Step 3: Calendar shows:
  ┌──────────────────────────────────┐
  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │...│ 25 │
  │ 🔵 │ 🔵 │ 🔵 │ 🔵 │ 🔵 │ ⚡│...│ ⚡ │
  └──────────────────────────────────┘
  
  🔵 = Light blue (your selected range)
  ⚡ = Red diagonal lines (booked dates)

Step 4: User clicks "Book until 2025-12-14"
  → Check-out date auto-selects to Dec 14
  → Warning disappears
  → Conflict resolved
  → "Book Now" button becomes active
```

### Pattern 4: Booked Dates Visualization

```
Calendar with multiple bookings:

      Jan 2025
─────────────────────────
 5  │ 6  │ 7  │ 8  │ 9
 ⚡ │ ⚡ │ 10 │ 11 │ 12
    (booked)

12  │ 13 │ 14 │ 15 │ 16
 13 │ 14 │ ⚡ │ ⚡ │ ⚡
    (booked)

19  │ 20 │ 21 │ 22 │ 23
 19 │ 20 │ 21 │ 22 │ 23
 ✓  │ ✓  │ ✓  │ ✓  │ ✓
(available)

Legend:
⚡ = Red diagonal lines (booked)
✓  = White (available)
```

## Error Messages

### Conflict Detected
```
❌ Cannot book during this period. There are existing bookings 
   between 2025-12-10 and 2025-12-25. You can book until 2025-12-14.

   💡 [Click to] Book until 2025-12-14
```

**What it means**: Your selected date range includes dates that are already booked by someone else.

**How to fix**: 
- Either click the suggestion to book until the last available date
- Or click different dates that don't overlap with booked periods
- Check the calendar for red diagonal lines to see what's booked

### Owner Availability Restriction
```
Date showing as grayed out = Owner doesn't allow pickups on this day

Example: Owner only allows Friday pickups
→ Mon-Thu are grayed out
→ Fri are clickable
→ Can only SELECT Fridays as check-in date
→ Can return item on any day
```

## UX Best Practices

### For Users (Renters)
1. **Check the legend** at the top of calendar for color meanings
2. **Look for gray dates** - you cannot start a rental on these days
3. **Look for diagonal lines** - someone else is already using the item
4. **Plan around conflicts** - if you see diagonal lines, try dates before or after
5. **Use smart suggestions** - if you get a conflict warning, use the "Book until [date]" suggestion

### For Owners
1. Set availability days wisely - gray dates = no pickups allowed on those days
2. Be aware that booked dates block ENTIRE RANGE - a booking from Dec 15-20 means those entire dates are unavailable
3. If you need specific days off, use the "Blackout Dates" feature (coming soon) to mark vacation/maintenance

## Accessibility Notes
- Calendar is keyboard navigable (Tab to move between dates, Enter to select)
- Color-blind friendly: Diagonal lines used for visual distinction, not just color
- Error messages are clear text, not relying on color alone
- Legend explains all visual indicators
