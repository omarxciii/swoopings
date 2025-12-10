/**
 * Conversation Item Component
 * 
 * File Purpose:
 * - Display a single conversation in the inbox list
 * - Shows the other user, last message preview, and timestamp
 * - Shows unread badge if conversation has unread messages
 * - Linked to open the conversation
 * 
 * Props:
 * - conversation: Conversation object
 * - otherUser: Profile of the other user
 * - lastMessage: Most recent message (optional)
 * - unreadCount: Number of unread messages (optional)
 * - isSelected: Whether this conversation is currently selected
 * - onClick: Callback when clicked
 * 
 * Features:
 * - User avatar and name
 * - Last message preview text
 * - Timestamp of last message
 * - Unread badge
 * - Hover effects
 * - Optional listing context display
 * 
 * Dependencies:
 * - React
 * - Tailwind CSS
 */

'use client';

import type { Conversation, Profile, Message } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  otherUser: Profile | null;
  lastMessage?: Message | null;
  unreadCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'now';
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Less than 1 week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  // Show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ConversationItem({
  conversation,
  otherUser,
  lastMessage,
  unreadCount = 0,
  isSelected = false,
  onClick,
}: ConversationItemProps) {
  // Only show badge if there are actual unread messages
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors
        ${isSelected ? 'bg-brand-secondary' : ''}
        ${hasUnread ? 'bg-brand-secondary' : ''}
      `}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
              {otherUser?.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name and Time */}
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-medium text-gray-900 truncate ${hasUnread ? 'font-semibold' : ''}`}>
              {otherUser?.username || 'Unknown User'}
            </h3>
            <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? 'font-semibold text-brand-primary' : 'text-gray-500'}`}>
              {lastMessage ? formatTime(lastMessage.created_at) : 'now'}
            </span>
          </div>

          {/* Message Preview */}
          <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
            {lastMessage ? lastMessage.content : 'No messages yet'}
          </p>

          {/* Listing context (if exists) */}
          {conversation.listing_id && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              Regarding a listing
            </p>
          )}
        </div>

        {/* Unread Badge */}
        {hasUnread && (
          <div className="flex-shrink-0 flex items-center">
            <div className="bg-brand-accent text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
