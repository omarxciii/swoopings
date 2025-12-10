# Development Workflow for YeahRent

## For Developers Returning After a Long Break

**Welcome back!** Here's how to get back up to speed:

### 5-Minute Orientation

1. **Read these files first (in order)**:
   - `SESSION_SUMMARY.md` - High-level overview of what's been done
   - `PROJECT_NOTES.md` - Current status and architecture decisions
   - `QUICKSTART.md` - How to run the app locally

2. **Understand the structure**:
   - `/src` - All application code
   - `/src/types` - TypeScript interfaces (the "contract" of the app)
   - `/src/lib` - External integrations (Supabase client)
   - `/src/utils` - Helper functions and database queries
   - `/src/hooks` - React hooks for state management

3. **Look at a few files**:
   - Every file has a header explaining its purpose
   - Inline comments explain "why" for important logic
   - If stuck, check the file header

### Getting Set Up

```bash
# Install dependencies
npm install

# Copy and edit env vars (ask for values)
cp .env.local.example .env.local
# Edit .env.local with actual Supabase/Stripe keys

# Start development
npm run dev

# Open http://localhost:3000
```

### Code Quality Standards

Everything follows these rules:
- ✅ **TypeScript strict mode** - All types are explicit
- ✅ **File headers** - Every file explains its purpose
- ✅ **Inline comments** - Explain "why" not "what"
- ✅ **No silent failures** - All errors handled with user feedback
- ✅ **Small functions** - Easy to understand and test
- ✅ **Consistent naming** - Clear variable and function names

### When Making Changes

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make one logical change at a time
# 3. Update file headers with "History" section
# 4. Add comments for complex logic
# 5. Test locally: npm run dev
# 6. Check types compile: npm run lint

# 7. Commit with clear message
git add .
git commit -m "feat: brief description of what changed"

# 8. Update PROJECT_NOTES.md with your progress
# 9. Push to GitHub
git push -u origin feature/your-feature-name

# 10. Create Pull Request
```

### Where to Find Things

| I need... | Location | File |
|-----------|----------|------|
| Type definitions | `src/types/` | `index.ts` |
| Database queries | `src/utils/` | `database.ts` |
| Helper functions | `src/utils/` | `helpers.ts` |
| Auth logic | `src/hooks/` | `useAuth.ts` |
| Data fetching | `src/hooks/` | `useFetch.ts` |
| App configuration | Root | `next.config.js`, `tailwind.config.ts` |
| Database schema | Root | `DATABASE_SCHEMA.sql` |
| What to build next | Root | `PROJECT_NOTES.md` |

### Common Tasks

**I want to add a new database query:**
1. Determine which table (see `DATABASE_SCHEMA.sql`)
2. Add function to `src/utils/database.ts`
3. Export from that file
4. Update types in `src/types/index.ts` if needed
5. Use in components with the `useFetch` hook

**I want to add a new page:**
1. Create file in `src/app/your-page/page.tsx`
2. Import components and hooks
3. Use `useAuth` to check login status
4. Use `useFetch` or database functions to load data
5. Add error states and loading states

**I want to add a new component:**
1. Create file in `src/components/YourComponent.tsx`
2. Add file header explaining purpose
3. Write clean, focused component
4. Add comments for non-obvious logic
5. Export and use in pages

**I want to change styling:**
1. All styles are in `src/styles/globals.css`
2. Use Tailwind utility classes in JSX
3. Add new component classes with `@layer components`
4. Test with `npm run dev`

### Testing Your Changes

```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run build

# Visual test
npm run dev
# Open http://localhost:3000
```

### If Something Breaks

1. **Check the error message** - It usually says what's wrong
2. **Read the file header** - It explains assumptions
3. **Check git history** - What changed recently?
4. **Look for TODOs** - They might be related
5. **Ask on Discord** - Or check previous notes

### Communication Checklist

When you finish a task, update these files:

- [x] Update file headers (add to History section)
- [x] Update `PROJECT_NOTES.md` (what was done, what's next)
- [x] Commit with clear message
- [x] Create pull request (if working on a branch)
- [x] Update `.env.local.example` if adding new vars

### Git Workflow

```bash
# Always start fresh
git pull origin main

# Create a feature branch
git checkout -b feature/descriptive-name

# Make changes, commit often
git add .
git commit -m "feat: what changed and why"

# Before pushing, check everything works
npm run lint
npm run build

# Push your changes
git push -u origin feature/descriptive-name

# Create pull request on GitHub
# After review, merge to main
```

### Common Gotchas

⚠️ **Never commit `.env.local`** - It has secret keys!
⚠️ **Always use TypeScript strict mode** - No `any` types
⚠️ **Always handle errors** - No silent failures
⚠️ **Test locally first** - Before pushing
⚠️ **Update docs** - Always document your changes

### File Header Template

Every file should have this at the top:

```typescript
/**
 * File Name
 * 
 * File Purpose:
 * - What does this file do?
 * - What problem does it solve?
 * 
 * Dependencies:
 * - @supabase/supabase-js
 * - React
 * 
 * High-Level Logic:
 * - How does it work?
 * - What's the main flow?
 * 
 * Assumptions:
 * - Database tables exist
 * - User is authenticated
 * 
 * Areas Needing Work:
 * - Future improvements
 * - Known limitations
 * 
 * History:
 * - 2025-12-06: Initial creation
 * - 2025-12-07: Added caching
 */
```

### Performance Tips

- Use SWR for data fetching (automatic caching)
- Memoize components that re-render frequently
- Lazy load images from Supabase storage
- Use database indexes (already in schema)
- Avoid N+1 queries (use joins in Supabase)

### Security Reminders

🔐 **Never expose secrets**:
- Service role key → server-side only
- Stripe secret → server-side only
- API keys → check they're NEXT_PUBLIC prefix on client

🔐 **Always use RLS**:
- All data queries filtered by user ID
- Database policies enforce access control
- Never bypass RLS with service role on client

🔐 **Validate input**:
- Check email format
- Validate password strength
- Sanitize file uploads
- Validate date ranges

### Need Help?

- **Code question**: Check file headers and inline comments
- **Architecture question**: Read `PROJECT_NOTES.md`
- **Setup issue**: Check `QUICKSTART.md`
- **Deployment**: Read `DEPLOYMENT.md`
- **Git workflow**: See "Git Workflow" section above

---

**Remember: Code is read much more often than it's written.**  
**Write for clarity, not cleverness.**

Last updated: 2025-12-06
