# Pre-Deployment Checklist

## Code Quality
- [ ] No critical TypeScript errors in main components
- [ ] DateRangePicker compiles without errors
- [ ] No console.error in browser (check dev tools)
- [ ] All required environment variables defined

## Feature Testing (Local)
- [ ] User can sign up
- [ ] User can log in
- [ ] User can create a listing
- [ ] User can view their listing
- [ ] Calendar shows availability (days greyed out correctly)
- [ ] Calendar shows booked dates (diagonal lines visible)
- [ ] User can select dates for booking
- [ ] Conflict detection works (prevents booking overlapping dates)
- [ ] Price calculation correct
- [ ] Payment flow completes
- [ ] Booking confirmation page displays

## Database
- [ ] Supabase tables created:
  - [ ] `listings`
  - [ ] `bookings`
  - [ ] `messages`
  - [ ] `listing_availability`
  - [ ] `listing_blackout_dates`
- [ ] RLS policies enabled on all tables
- [ ] Can create test data successfully

## Environment Variables (Local .env.local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - set
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - set
- [ ] `STRIPE_SECRET_KEY` - set
- [ ] All keys are valid (not placeholder text)

## Git Repository
- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] No sensitive data in code (env vars are in .env.local, not committed)
- [ ] .gitignore includes .env.local

## Netlify Account
- [ ] GitHub account connected
- [ ] Netlify account created
- [ ] Ready to authorize Netlify access to GitHub

---

## Pre-Deployment Commands (Run These Locally)

```bash
# 1. Check for TypeScript errors
npm run build

# 2. Verify environment variables are set
cat .env.local

# 3. Make sure all changes are committed
git status

# 4. Commit if needed
git add .
git commit -m "Pre-deployment: Calendar UX with brand colors"

# 5. Push to GitHub
git push origin main
```

---

## After Deployment - Verification Steps

1. **Site loads**: Visit the Netlify URL
2. **Sign in works**: Create account and log in
3. **Listings load**: Browse some listings
4. **Calendar displays**: View a listing detail page
5. **Availability visible**: Check that dates are greyed out
6. **Booking works**: Try booking flow (use test Stripe card)
7. **Mobile responsive**: Test on phone or use browser dev tools

---

## Quick Test Script (On Live Site)

1. Sign up as user A
2. Create listing with Friday availability
3. Sign out
4. Sign up as user B
5. Go to listing from step 2
6. Try to book Monday → should be greyed out
7. Try to book Friday → should work
8. Complete booking to Friday
9. Sign out
10. Sign in as user A (owner)
11. View your listing → should show user B's booking as booked dates
12. Sign out and sign in as user B
13. Try to book Friday on same listing → should show conflict warning

---

## Expected Behavior After Deployment

- ✅ Same as running locally with `npm run dev`
- ✅ Slightly slower first page load (cold start)
- ✅ All database operations work
- ✅ Stripe test payments work
- ✅ Authentication works
- ✅ Messaging works
- ✅ Can deploy new changes by pushing to main

---

## Rollback Plan (If Deployment Has Issues)

1. Don't panic - easy to fix!
2. Check Netlify build logs for errors
3. Most common issue: missing environment variable
4. Solution:
   - Add missing env var to Netlify
   - Trigger redeploy
   - Or rollback to previous deploy
5. If broken code:
   - Fix locally
   - Push to main
   - Netlify auto-rebuilds and redeploys

---

## Success Criteria

Deployment is successful when:
- [ ] Site loads without 500 errors
- [ ] Sign in/sign up works
- [ ] Can view listings
- [ ] Calendar displays with correct styling
- [ ] Can complete a test booking
- [ ] No TypeScript errors in console
- [ ] Mobile responsive on small screens

Once all above pass → **Deployment complete!** 🎉
