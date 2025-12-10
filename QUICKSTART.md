# YeahRent - Quick Start Guide

## 🎯 Get the App Running in 5 Minutes

### Step 1: Install Dependencies (1 min)

```bash
cd yeahrent
npm install
```

### Step 2: Set Up Supabase (1 min)

1. Create a free account at https://supabase.com
2. Create a new project
3. Copy your project URL and anon key
4. Create `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
   STRIPE_SECRET_KEY=sk_test_placeholder
   STRIPE_WEBHOOK_SECRET=whsec_placeholder
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Step 3: Initialize Database (1 min)

1. Go to your Supabase dashboard
2. Click "SQL Editor"
3. Create new query
4. Copy the entire contents of `DATABASE_SCHEMA.sql`
5. Paste into the query editor
6. Click "Run"

### Step 4: Start Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Explore (1 min)

- You'll see the landing page
- All the navigation is set up (but pages aren't built yet)
- Check `PROJECT_NOTES.md` for what comes next

---

## 📁 What's Already Built

✅ **Project Infrastructure**
- Next.js 14 with TypeScript
- Tailwind CSS with custom theme
- All config files (tsconfig, next.config, etc.)

✅ **Type Definitions**
- `src/types/index.ts` - All interfaces (Profile, Listing, Booking, Message, Payment)

✅ **Database Setup**
- `DATABASE_SCHEMA.sql` - Tables with RLS policies

✅ **Supabase Client**
- `src/lib/supabase.ts` - Client initialization

✅ **Utilities**
- `src/utils/helpers.ts` - Helper functions (price formatting, date handling, validation)
- `src/utils/database.ts` - Database query wrapper functions

✅ **Hooks**
- `src/hooks/useAuth.ts` - Authentication state management
- `src/hooks/useFetch.ts` - Data fetching with SWR

✅ **Documentation**
- `README.md` - Project overview
- `PROJECT_NOTES.md` - Current status and next steps
- `DEPLOYMENT.md` - Deployment guide
- `DATABASE_SCHEMA.sql` - With migration instructions
- File headers on every file - Explain purpose, logic, assumptions

---

## 🚀 What to Build Next

Open `PROJECT_NOTES.md` to see the full roadmap. Next priorities:

1. **Authentication** - Sign up, login, profile creation
2. **Listings** - Create, browse, view details
3. **Search** - Filter by location, price
4. **Bookings** - Date selection and payments
5. **Messaging** - User communication
6. **Dashboard** - My listings, bookings, messages

---

## 🔑 Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client |
| `src/types/index.ts` | TypeScript types |
| `src/utils/database.ts` | Database queries |
| `src/hooks/useAuth.ts` | Auth state |
| `DATABASE_SCHEMA.sql` | Database migrations |
| `PROJECT_NOTES.md` | Development roadmap |
| `.env.local` | Environment variables (not in git) |

---

## ✨ Code Quality Standards

All code follows:
- ✅ TypeScript strict mode
- ✅ File headers with purpose & assumptions
- ✅ Inline comments for complex logic
- ✅ Small, focused functions
- ✅ No silent failures
- ✅ User-friendly error messages

---

## 🆘 Troubleshooting

### "Cannot find module" errors
→ Run `npm install` again

### Supabase connection errors
→ Check `.env.local` has correct URL and keys

### Database tables not created
→ Make sure you ran the SQL script in Supabase SQL Editor

### Port 3000 already in use
→ Run `npm run dev -- -p 3001` to use a different port

---

## 💡 Tips

- **Stay on main branch** - Don't create feature branches yet
- **One feature at a time** - Build components incrementally
- **Test locally** - Always test before deploying
- **Update documentation** - Update `PROJECT_NOTES.md` after each session
- **Keep it simple** - Avoid over-engineering

---

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs) - Framework
- [Supabase Docs](https://supabase.com/docs) - Backend
- [Stripe Docs](https://stripe.com/docs) - Payments
- [Tailwind Docs](https://tailwindcss.com/docs) - Styling

---

**Happy coding! 🚀**

Need help? Check `PROJECT_NOTES.md` for decisions made and context.
