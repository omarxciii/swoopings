# Phase 5.4 - Payment Testing Debug Guide

## Issue: 400 Bad Request on /api/payments/create-intent

Your console shows:
```
:3001/api/payments/create-intent:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
```

This means the amount being sent is invalid.

---

## Debugging Steps

### Step 1: Check the Amount Being Sent

The payment modal now validates the amount. If you're seeing the 400 error, the issue is likely:

**Reason 1: Zero Total Price**
- You may not have fully selected dates
- Make sure you select BOTH check-in AND check-out dates
- The price should show below the calendar (e.g., "$150.00 for 3 nights")

**Reason 2: Listing Price is Zero**
- The listing's `price_per_day` might be 0
- Check the listing detail page - does it show the price correctly?
- Example: "Price: $50 per day"

**Reason 3: Date Calculation Error**
- Make sure check-out date is AFTER check-in date
- Select at least 1 night

---

## How to Fix

### Check 1: Verify Price Display
1. Go to any listing
2. Look at the top of the listing - does it show "$XX per day"?
3. Open the date picker - does it calculate price correctly?

**If price shows as $0**:
→ The listing in the database has `price_per_day = 0`
→ Update the listing with a valid price

**If price shows correctly**:
→ Proceed to Check 2

### Check 2: Select Dates Properly
1. Click on a start date (check-in)
2. Click on an end date (check-out)
3. Below the calendar, you should see the total price
4. Example: "7 nights × $50/night = $350"

**If total price shows as $0**:
→ The price calculation failed
→ Try different dates

**If total price shows correctly**:
→ Proceed to Check 3

### Check 3: Look for Error Message
After clicking "Book Now":
- If error message says "Invalid booking amount" or "amount out of range"
→ The amount didn't pass validation
→ Try different dates that result in a higher price

---

## Server-Side Debugging

The API now logs errors. Check your terminal where you ran `npm run dev`:

```
Invalid amount provided: 0
Amount out of range: 50
Amount out of acceptable range ($1-$10,000). Received: $0.50
```

These logs will tell you exactly what amount is being sent.

---

## Manual Testing Checklist

- [ ] Navigate to a listing
- [ ] Verify price shows per day (e.g., "$50/day")
- [ ] Open date picker
- [ ] Select check-in date (click any future date)
- [ ] Select check-out date (click a date after check-in)
- [ ] Verify total price displays (e.g., "$150 for 3 nights")
- [ ] Click "Book Now"
- [ ] Payment modal opens
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Click "Pay $XX.XX"
- [ ] Should see confirmation or error message

---

## Still Getting 400 Error?

1. **Check browser console (F12)**
   - Look for any JavaScript errors
   - Check the Network tab
   - Click on the 400 request → Preview/Response → see exact error message

2. **Check server logs**
   - Look at terminal where `npm run dev` is running
   - Should show the amount that was rejected

3. **Verify listing has valid price**
   ```
   Navigate to /listings
   Click on a listing
   Should show "Price: $XX per day" at the top
   ```

4. **Verify date calculation works**
   ```
   Select 2 dates
   Price should update
   Should not be $0
   ```

---

## What We Fixed

✅ Added validation to prevent $0 amount submissions
✅ Added better error messages in API response
✅ Added logging for debugging

This means:
- If amount is 0 or < $1, you'll see "Invalid booking amount" error
- If amount is > $10,000, you'll see the range error
- API logs show exact amount that was rejected

---

## Next Steps

1. Try the checklist above
2. Select dates that add up to at least $1 (usually 1 night is enough)
3. Make sure listing has valid price_per_day
4. If still failing, share the exact error message from browser Network tab

---

**Last Updated**: December 7, 2025
