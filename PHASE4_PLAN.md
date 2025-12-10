# Phase 4: Messaging System - Planning & Requirements

**Estimated Scope**: 4-6 hours  
**Priority**: High - Core marketplace feature  
**Status**: 🔜 In Planning

---

## Overview

Phase 4 implements direct messaging between users, enabling renters and owners to communicate about listings, ask questions, negotiate, and coordinate rental details before booking.

---

## User Stories

### US-1: Start a Conversation
**As a** potential renter  
**I want to** send a message to a listing owner  
**So that** I can ask questions or express interest

**Acceptance Criteria**:
- Message button on listing detail page
- Modal/form to compose first message
- Creates a new conversation in database
- Owner receives notification
- Both users see conversation in message list

### US-2: Reply to Messages
**As a** user  
**I want to** respond to messages in a conversation  
**So that** I can have back-and-forth communication

**Acceptance Criteria**:
- Message thread display
- Input box to compose reply
- Messages show timestamps and sender
- Can see message history
- Auto-scroll to latest message

### US-3: View Conversations
**As a** user  
**I want to** see all my conversations in one place  
**So that** I can manage multiple discussions

**Acceptance Criteria**:
- Inbox page listing all conversations
- Shows other user's name and avatar
- Shows last message preview and timestamp
- Shows unread message count/badge
- Can sort by recent activity
- Can click to open conversation

### US-4: Mark Messages as Read
**As a** user  
**I want to** mark messages as read  
**So that** I know what I've already seen

**Acceptance Criteria**:
- Unread messages indicated visually
- Reading a message marks it as read
- Unread count updates
- Badge shows in navigation

### US-5: Search Messages (Future)
**As a** user  
**I want to** search through conversations  
**So that** I can find past discussions

---

## Technical Requirements

### Database Tables

**conversations**
```sql
id: uuid (primary key)
user1_id: uuid (foreign key → profiles)
user2_id: uuid (foreign key → profiles)
listing_id: uuid (foreign key → listings) [nullable]
created_at: timestamp
updated_at: timestamp
user1_last_read: timestamp
user2_last_read: timestamp
```

**messages**
```sql
id: uuid (primary key)
conversation_id: uuid (foreign key → conversations)
sender_id: uuid (foreign key → profiles)
content: text
created_at: timestamp
updated_at: timestamp
is_edited: boolean
```

**Key Indexes**:
- `conversations(user1_id, updated_at DESC)`
- `conversations(user2_id, updated_at DESC)`
- `messages(conversation_id, created_at DESC)`
- `messages(conversation_id, sender_id)`

### RLS Policies

**conversations** table:
- Users can view conversations they're part of
- Users can create conversations with another user
- Users can update last_read timestamp for themselves only

**messages** table:
- Users can view messages from conversations they're in
- Users can create messages in conversations they're in
- Users can only edit their own messages
- Users can only delete their own messages

---

## Database Functions to Add

```typescript
// Create or get conversation
getOrCreateConversation(userId1: string, userId2: string, listingId?: string)

// Get all conversations for a user
getUserConversations(userId: string, limit: number, offset: number)

// Get conversation with messages
getConversationWithMessages(conversationId: string, limit: number, offset: number)

// Send a message
sendMessage(conversationId: string, senderId: string, content: string)

// Mark conversation as read
markConversationAsRead(conversationId: string, userId: string)

// Delete message (soft delete)
deleteMessage(messageId: string, userId: string)

// Edit message
editMessage(messageId: string, newContent: string, userId: string)

// Get unread count
getUnreadCount(userId: string)
```

---

## Component Structure

```
pages/
  messages/
    page.tsx                    # Inbox - list of conversations
    [conversationId]/
      page.tsx                  # Conversation thread

components/
  MessageList.tsx               # Display messages in thread
  MessageInput.tsx              # Compose/reply input
  ConversationList.tsx          # Inbox with conversations
  ConversationItem.tsx          # Single conversation preview
  StartMessageModal.tsx         # Modal to start new message
```

---

## Page Flows

### 1. Inbox Page (`/messages`)

**Layout**:
```
┌─────────────────────────────────────┐
│ Messages                    [+] New │
├──────────────────────────────────┬──┤
│ Conversation List (left)        │  │
│ ✓ John Doe                      │  │
│   "When can I pick up?"  2 min  │  │
│ ✓ Sarah Smith                   │  │
│   "Interested in your laptop"   │  │
│ ✓ Mike Johnson (3 unread) 🔴   │  │
│   "Do you ship?"         1 hour │  │
│                                 │  │
│                                 │  │
│                                 │  │
├──────────────────────────────────┼──┤
│ Conversation Detail (right)     │  │
│ Showing: Mike Johnson           │  │
│ Listing: Canon Camera 16"       │  │
│ ──────────────────────────────  │  │
│ Messages...                     │  │
│ [Message input box]             │  │
└─────────────────────────────────┘  │
```

**Features**:
- List conversations with last message preview
- Show unread badge
- Click to open conversation on right
- Show associated listing (if any)
- Search/filter conversations
- "New Message" button

### 2. Conversation Page (`/messages/[conversationId]`)

**Layout** (could also be `/messages` with split view):
```
┌──────────────────────────────────┐
│ ← Back    John Doe    [⋮] Menu   │
├──────────────────────────────────┤
│ Listing: Canon Camera 16"        │
├──────────────────────────────────┤
│ Messages:                        │
│                                  │
│ Today 2:30 PM                    │
│ [You]: Are you still selling?    │
│                                  │
│ [John]: Yes! Just posted it!     │
│                                  │
│ [You]: Great, when can I see it? │
│                                  │
│ [John]: Weekends work best       │
│                                  │
├──────────────────────────────────┤
│ [Type your reply...]             │
│                          [Send ➜] │
└──────────────────────────────────┘
```

**Features**:
- Full message thread
- Timestamps for each message
- Sender avatar/name
- Scroll to bottom on new message
- Show typing indicator (optional)
- Edit/delete own messages (optional)
- Link to listing details

### 3. Start Message Modal

**Shown on listing detail page**:
```
┌──────────────────────────────────┐
│ Contact John Doe          [×]    │
├──────────────────────────────────┤
│                                  │
│ About: Canon Camera 16"          │
│                                  │
│ Message:                         │
│ [Textarea - type your message]  │
│                                  │
│ [Cancel]              [Send] ✓   │
└──────────────────────────────────┘
```

---

## Implementation Checklist

### Database Layer
- [ ] Create conversations table with RLS policies
- [ ] Create messages table with RLS policies
- [ ] Add indexes for performance
- [ ] Write database functions
- [ ] Test RLS policies

### Backend/API
- [ ] Implement getOrCreateConversation()
- [ ] Implement sendMessage()
- [ ] Implement getUserConversations()
- [ ] Implement getConversationWithMessages()
- [ ] Implement markConversationAsRead()
- [ ] Error handling for all functions

### Frontend Components
- [ ] ConversationList component
- [ ] ConversationItem component
- [ ] MessageList component
- [ ] MessageInput component
- [ ] StartMessageModal component

### Pages
- [ ] `/messages` - Inbox page
- [ ] `/messages/[conversationId]` - Conversation page
- [ ] Add "Contact Owner" button to listing detail

### Features
- [ ] Create new conversation from listing
- [ ] View all conversations
- [ ] Read conversation thread
- [ ] Send messages
- [ ] Mark as read
- [ ] Show unread count in nav
- [ ] Responsive design for mobile

### Testing
- [ ] RLS policies (can't see others' messages)
- [ ] Message creation and retrieval
- [ ] Conversation creation with listing context
- [ ] Unread tracking
- [ ] Mobile responsiveness

---

## Key Decisions

### Polling vs WebSockets
**Decision**: Polling (for now)  
**Reasoning**: 
- WebSockets add complexity
- Real-time not critical for MVP
- Polling works fine for typical user patterns
- Can upgrade to WebSockets later

**Implementation**: Revalidate conversation every 5 seconds when page is open

### Soft Delete vs Hard Delete
**Decision**: Soft delete (optional for MVP)  
**Reasoning**:
- Preserve conversation history
- Can allow "remove from inbox" without data loss
- Better for audit trails

### Message Editing/Deletion
**Decision**: Allow with (edited) indicator  
**Reasoning**:
- Better UX if users make typos
- Shows transparency (edited marker)
- Can skip for MVP, add later

---

## UI/UX Considerations

### Empty States
- "No conversations yet" with CTA to browse listings
- "No messages" with loading state

### Loading States
- Skeleton loaders for conversation list
- Loading spinner while fetching messages
- Disabled input while sending

### Error States
- Failed message send with retry
- Connection error with reconnect button
- Permiss ion denied (shouldn't happen with RLS)

### Mobile Considerations
- Inbox list on full width
- Conversation detail on full width
- Back button on conversation page
- Keyboard handling for inputs
- Prevent double-send

---

## Performance Notes

- Paginate conversation list (20 per page)
- Paginate messages in thread (50 per page, load more)
- Debounce typing indicator
- Lazy load older messages
- Cache conversation list briefly
- Index on (user_id, updated_at) for inbox queries

---

## Future Enhancements (Post-MVP)

- Real-time message updates (WebSockets)
- Typing indicators
- Read receipts
- Message reactions/emojis
- Image/file sharing
- Message search
- Block user
- Archive conversations
- Message encryption
- Bot messages for booking confirmations

---

## Success Criteria

✅ Users can send/receive messages  
✅ Conversations persist in database  
✅ Message history visible  
✅ Unread count tracked  
✅ Privacy enforced (RLS)  
✅ Mobile responsive  
✅ No console errors  

---

**Next**: Implement Phase 4 based on this spec
