# Phase 4: Messaging System - Testing & Implementation Guide

## Overview
Phase 4 implementation is **95% complete**. All database infrastructure, backend functions, React components, and pages are fully built. This guide covers remaining testing and final polish.

## ✅ Completed Components

### 1. Database Schema (`DATABASE_SCHEMA.sql`)
- **conversations table**: Stores user-to-user conversation threads
  - `id, user1_id, user2_id, listing_id, created_at, updated_at, user1_last_read, user2_last_read`
  - RLS policies: Users can only see/create/update their own conversations
  - Indexes: `(user1_id, updated_at DESC)` and `(user2_id, updated_at DESC)` for fast inbox queries

- **messages table**: Individual messages within conversations
  - `id, conversation_id, sender_id, content, created_at, updated_at`
  - RLS policies: Users can only see/create messages in their conversations
  - Index: `(conversation_id, created_at DESC)` for efficient message history

### 2. Database Functions (`src/utils/database.ts`)
Six core messaging functions implemented:

1. **getOrCreateConversation(userId1, userId2, listingId?)**
   - Normalizes user IDs (order doesn't matter)
   - Returns existing conversation or creates new one
   - Result: `{ success, data: Conversation, error }`

2. **getUserConversations(userId, limit, offset)**
   - Fetches user's conversations sorted by most recent
   - Supports pagination (default 20 per page)
   - Result: `{ success, data: Conversation[], error }`

3. **getConversationWithMessages(conversationId, limit, offset)**
   - Fetches complete conversation with message history
   - Messages returned in chronological order (oldest first)
   - Result: `{ success, data: { conversation, messages }, error }`

4. **sendMessage(conversationId, senderId, content)**
   - Creates message and updates conversation's updated_at
   - Returns newly created message
   - Result: `{ success, data: Message, error }`

5. **markConversationAsRead(conversationId, userId)**
   - Updates user1_last_read or user2_last_read timestamp
   - Called automatically when conversation is opened
   - Result: `{ success, data: null, error }`

6. **getUnreadMessageCount(conversationId, userId)**
   - Counts messages created after user's last_read timestamp
   - Used for inbox unread badges
   - Result: `{ success, data: number, error }`

### 3. React Components

#### MessageInput (`src/components/MessageInput.tsx`)
- Auto-expanding textarea with maximum height
- Enter to send, Shift+Enter for newline
- Loading spinner while sending
- Auto-clear on success, error restoration
- Maintains focus after send

#### MessageList (`src/components/MessageList.tsx`)
- Auto-scroll to latest message
- Message grouping by sender
- Relative timestamps
- Avatar display with initials fallback
- Different styling for own vs other user messages
- Loading skeleton and empty states

#### ConversationItem (`src/components/ConversationItem.tsx`)
- User avatar and name
- Last message preview
- Relative timestamp (now, 5m ago, 2d ago, etc.)
- Unread count badge
- Listing context indicator ("Regarding a listing")
- Hover and selected states

#### ConversationList (`src/components/ConversationList.tsx`)
- Renders list of ConversationItem components
- Fetches other user profiles from API
- Handles conversation selection

### 4. Pages & Routing

#### `/messages` - Inbox Page (`src/app/messages/page.tsx`)
- Lists all user's conversations
- Pagination support (20 conversations per page)
- Loading state with spinner
- Empty state messaging
- Error handling with error display
- Responsive layout with mobile support
- "Load more" button for pagination

#### `/messages/[conversationId]` - Thread Page (`src/app/messages/[conversationId]/page.tsx`)
- Full conversation thread with message history
- Message input at bottom
- Back button to return to inbox
- Auto-marks conversation as read when opened
- Loading state for initial message fetch
- Error handling for message loading/sending
- Pagination for older messages ("Load earlier messages")
- Responsive mobile layout

### 5. Navigation Updates
- **Navbar (`src/components/Navbar.tsx`)**: 
  - Added "Messages" link in navigation
  - Added unread badge placeholder (styled, ready for count integration)
  - Badge shows red circle with white number
  - Shows "9+" for 10+ unread messages

## 🧪 Testing Checklist

### Setup Testing Environment
```
1. Push latest code to repository
2. Database schema is deployed to Supabase (conversations & messages tables created)
3. Local development server running: npm run dev
4. Navigate to http://localhost:3000
```

### Feature Testing

#### Test 1: Create Conversation
- [ ] Navigate to a listing detail page (e.g., `/listings/[id]`)
- [ ] Click "Contact Owner" or message button
- [ ] Should create/open conversation with listing owner
- [ ] Conversation appears in `/messages` inbox

#### Test 2: Send Message
- [ ] Go to `/messages/[conversationId]`
- [ ] Type message in input field
- [ ] Press Enter or click send
- [ ] Message appears in thread
- [ ] Input clears
- [ ] Conversation updated_at timestamp updates

#### Test 3: Load Message History
- [ ] Load conversation page with existing messages
- [ ] Messages display in correct order (oldest at top)
- [ ] Avatar shows once per message group from same sender
- [ ] Timestamps display correctly
- [ ] Click "Load earlier messages" to load pagination

#### Test 4: Mark as Read
- [ ] Unread conversation should show unread badge (if count tracking added)
- [ ] Open conversation (page loads)
- [ ] Background call marks conversation as read
- [ ] Navigate to different conversation
- [ ] Return to previous conversation
- [ ] No "unread" indicator

#### Test 5: Inbox Page
- [ ] Navigate to `/messages`
- [ ] All conversations display in list
- [ ] Sorted by most recent (updated_at DESC)
- [ ] Click conversation to open thread
- [ ] Back button returns to inbox
- [ ] Pagination works ("Load more conversations")

#### Test 6: Error Handling
- [ ] Simulate network error
- [ ] Try to send message while offline
- [ ] Error message displays
- [ ] Input value is preserved
- [ ] Can retry when connection restored

#### Test 7: Mobile Responsiveness
- [ ] View inbox on mobile (375px width)
- [ ] Headers and text resize appropriately
- [ ] Conversation items stack vertically
- [ ] Input field remains usable
- [ ] Back button clearly visible
- [ ] Message thread is readable

#### Test 8: Empty States
- [ ] First-time user: No conversations
- [ ] Navigate to `/messages` with no conversations
- [ ] Empty state message displays
- [ ] Conversation page: No messages yet
- [ ] Load conversation with no messages
- [ ] Displays "No messages yet. Start the conversation!"

### Performance Testing
- [ ] Load inbox with 100+ conversations (pagination efficient)
- [ ] Load conversation with 100+ messages (pagination efficient)
- [ ] Message sending completes in <2 seconds
- [ ] Conversation list loads in <3 seconds
- [ ] No layout shift when messages load

### Accessibility Testing
- [ ] Keyboard navigation (Tab through conversation list)
- [ ] Focus indicators visible
- [ ] Alt text for avatars
- [ ] Error messages announced to screen readers
- [ ] Loading states described

## 🔧 Known Limitations & TODOs

### Unread Count Tracking
- Navbar badge styled but count not yet connected
- `getUnreadMessageCount` function exists but needs integration
- To complete: Add effect in Navbar to call `getUnreadMessageCount` for each conversation
- Requires wrapping in server action or API route

### Listing Context Integration
- Conversations linked to listing_id in database
- Components support "Regarding a listing" indicator
- To complete: Fetch listing details and display in conversation header
- Pass listing data through conversation context

### Conversation Creation from Listing Detail
- Database function exists: `getOrCreateConversation`
- Page layout exists: `/messages/[conversationId]`
- To complete: Add "Message Owner" button on listing detail page
- Button should call `getOrCreateConversation` and navigate to thread

### User Typing Indicators
- Not yet implemented
- Would require WebSocket or polling
- Database schema supports (could add `last_typing_at` timestamp)
- Consider for Phase 5

### Message Attachments
- Messages table only supports text content
- Could extend with `attachment_urls TEXT[]`
- Consider for Phase 5

### Message Search
- No full-text search on messages
- Could add PostgreSQL tsvector for fast searching
- Consider for Phase 5

### Read Receipts
- Only implements "last read timestamp" for entire conversation
- Could extend with per-message read status
- Consider for Phase 5

## 🚀 Integration Points

### Connect Messaging to Listing Detail
**File**: `src/app/listings/[id]/page.tsx`

Add "Message Owner" button:
```typescript
import { getOrCreateConversation } from '@/utils/database';

const handleMessageOwner = async () => {
  const response = await getOrCreateConversation(
    currentUserId,
    listing.owner_id,
    listingId
  );
  if (response.success) {
    router.push(`/messages/${response.data.id}`);
  }
};

// In JSX:
<button onClick={handleMessageOwner}>Message Owner</button>
```

### Track Unread Counts in Navbar
**File**: `src/components/Navbar.tsx`

Add effect to load unread count:
```typescript
useEffect(() => {
  if (!user) return;
  
  const loadUnreadCount = async () => {
    const response = await getUserConversations(user.id, 100, 0);
    if (response.success && response.data) {
      let total = 0;
      for (const conv of response.data) {
        const unreadResponse = await getUnreadMessageCount(conv.id, user.id);
        if (unreadResponse.success) {
          total += unreadResponse.data || 0;
        }
      }
      setUnreadCount(total);
    }
  };
  
  loadUnreadCount();
  // Refresh every 10 seconds
  const interval = setInterval(loadUnreadCount, 10000);
  return () => clearInterval(interval);
}, [user]);
```

## 📊 Database State Verification

### Check Tables Created
```sql
-- In Supabase SQL Editor
SELECT * FROM information_schema.tables WHERE table_name IN ('conversations', 'messages');
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');
```

### Test RLS In Action
1. Create conversation as User A
2. Try to query as User B
3. Should NOT see User A's conversation (unless User B is participant)

### Check Indexes
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('conversations', 'messages');
```

## 🎨 Styling & Polish

All components use Tailwind CSS with:
- Responsive breakpoints (sm, md, lg)
- Consistent color scheme (blue-600 for brand)
- Proper spacing and alignment
- Hover and active states
- Loading and error states
- Mobile-first design

## 📈 Phase 4 Completion Status

- ✅ 4.1 Database setup (100%)
- ✅ 4.2 Database functions (100%)
- ✅ 4.3 Core components (100%)
- ✅ 4.4 Pages & routing (100%)
- ✅ 4.5 Unread tracking structure (95%) - Ready for Navbar integration
- ✅ 4.6 Polish & testing (In Progress)

## Next Steps

1. **Run Full Test Suite** - Use checklist above
2. **Deploy to Staging** - Test on live Supabase instance
3. **Integrate Listing Detail** - Add "Message Owner" flow
4. **Complete Unread Tracking** - Wire up Navbar badge
5. **Document Known Issues** - If any found during testing
6. **Mark Phase 4 Complete** - Update PHASE4_COMPLETE.md

---

**Last Updated**: December 6, 2025  
**Status**: Ready for Testing & Integration
