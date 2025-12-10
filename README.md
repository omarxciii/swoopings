# YeahRent - Peer-to-Peer Rental Marketplace MVP

A clean, maintainable web application for peer-to-peer rental transactions. Users can create listings, search and filter items, and communicate directly with renters/owners.

## 🎯 Current Status

### ✅ Phase 1-4 Complete
- ✅ User authentication (signup, login, profile creation)
- ✅ Listing management (create, upload images, browse)
- ✅ Search and filtering (text search, price range, location, sorting)
- ✅ Messaging system (conversations, message threads, read tracking)

### 🔜 Phase 5+ In Development
- 🔜 Conversation integration with listing detail pages
- 🔜 Unread message badge in navigation
- 🔜 Message attachments
- 🔜 Typing indicators
- 🔜 Message search
- 🔜 Booking system with date selection
- 🔜 Payments via Stripe
- 🔜 Reviews and ratings
- 🔜 Personal dashboard

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | Get up and running in 5 minutes |
| [INDEX.md](./INDEX.md) | Project overview and navigation |
| [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) | What's been built so far |
| [PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md) | Messaging system details |
| [PHASE4_MESSAGING_GUIDE.md](./PHASE4_MESSAGING_GUIDE.md) | Testing & integration guide |
| [PHASE3_COMPLETE.md](./PHASE3_COMPLETE.md) | Search & filtering details |
| [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md) | Listing management details |
| [PROJECT_NOTES.md](./PROJECT_NOTES.md) | Development roadmap |

## 🎯 Features Implemented

### Authentication & Profiles
- Sign up with email validation
- Login with persistent sessions
- Profile creation and customization
- Password reset
- Protected routes

### Listing Management
- Create listings with multiple images
- Image upload to Supabase Storage
- Browse listings in responsive grid
- Detailed listing pages with owner info
- Dashboard view of user's listings

### Search & Filtering
- Text search with word-start matching (not substring)
- Price range filtering (min/max)
- City/location filtering
- Sort by newest, cheapest, or most expensive
- Filter persistence in URL for sharing
- Clear all or individual filters
- Active filter badges

### Messaging System
- Conversation-based threading between user pairs
- Real-time message sending
- Message history with pagination
- Per-user read tracking (auto-mark-as-read)
- Unread count calculation
- Responsive inbox and thread pages
- Error handling and loading states

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe (planned Phase 5)
- **Data Fetching**: Built-in browser Fetch API
- **Hosting**: Netlify
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Stripe account (free tier works, for Phase 5)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd yeahrent
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local and add your keys:
# - Supabase URL and keys from your project settings
# - Stripe publishable and secret keys (for Phase 5)
```

### 3. Initialize Database

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy the contents of `DATABASE_SCHEMA.sql`
4. Paste and execute to create tables and policies

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── hooks/            # Custom React hooks
├── lib/              # External library initializations (Supabase client)
├── types/            # TypeScript interface definitions
├── utils/            # Helper functions and utilities
└── styles/           # Global CSS and Tailwind directives

public/              # Static assets (images, icons)
DATABASE_SCHEMA.sql  # Supabase migration script
netlify.toml         # Netlify deployment configuration
```

## 🔐 Security & Database

### Row-Level Security (RLS)

All database tables have RLS policies configured:
- **Profiles**: Viewable by everyone, editable only by user
- **Listings**: Public listings visible to all, private queries filtered by owner
- **Bookings**: Users see only their own bookings (as renter or owner)
- **Messages**: Users see only messages they sent or received
- **Payments**: Users see payment history for their bookings

### API Security

- Use Supabase anon key for client-side operations
- Use service role key only on server (never expose to client)
- All database queries filtered by `auth.uid()` or protected by RLS
- Stripe webhooks validated with webhook secret

## 💳 Stripe Integration

### Payment Flow

1. User selects dates and clicks "Book"
2. Frontend calls `/api/payments/create-intent`
3. Server creates Stripe PaymentIntent
4. Frontend shows Stripe payment form
5. User completes payment
6. Webhook updates booking status to "confirmed"

### Payout Flow (Future)

- Stripe Connect transfers funds to listing owner
- Webhooks track transfer status
- Dashboard shows earnings and payouts

## 📝 Database Schema

### Core Tables

- **profiles** - User information and ratings
- **listings** - Rental items with images and pricing
- **bookings** - Reservations with dates and payment status
- **messages** - Private messages between users
- **payments** - Stripe payment metadata

See `DATABASE_SCHEMA.sql` for complete schema with indexes.

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment

### Deploy to Netlify

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Connect to Netlify
netlify deploy --prod

# Or push to GitHub and connect repository to Netlify
```

See `DEPLOYMENT.md` for detailed instructions.

## 📖 Documentation

- `PROJECT_NOTES.md` - Current status, what's done, what's next
- `DATABASE_SCHEMA.sql` - Database tables and RLS policies with migration instructions
- `DEPLOYMENT.md` - Deployment guide and environment setup
- File headers in code - Purpose, dependencies, logic, assumptions for each file

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make changes following the code standards (see PROJECT_NOTES.md)
3. Ensure TypeScript compiles without errors
4. Update file headers and PROJECT_NOTES.md with your changes
5. Submit pull request with clear description

## 📋 Code Standards

- **TypeScript**: Strict mode, full type coverage
- **Components**: Small, focused, well-documented
- **Comments**: File headers required, inline comments for complex logic
- **Error Handling**: No silent failures, user-friendly error messages
- **Naming**: Clear, descriptive names (prefer `getUserListings` over `get_ul`)

## 📞 Support

- Supabase Issues: https://github.com/supabase/supabase/issues
- Next.js Issues: https://github.com/vercel/next.js/discussions
- Stripe Support: https://support.stripe.com

## 📄 License

MIT License - see LICENSE file for details

## 🎓 Learning Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Guide](https://supabase.com/docs)
- [Stripe Payments](https://stripe.com/docs/payments)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ for peer-to-peer sharing**

Last updated: 2025-12-06
