/**
 * Message List Component
 * 
 * File Purpose:
 * - Display messages in a conversation thread
 * - Shows message content, sender, and timestamp
 * - Auto-scrolls to latest message
 * - Groups consecutive messages from same sender
 * 
 * Props:
 * - messages: Array of messages to display
 * - currentUserId: ID of logged-in user
 * - senderProfiles: Map of user IDs to profiles for displaying sender info
 * - isLoading: Whether messages are loading
 * 
 * Features:
 * - Message bubbles with sender info
 * - Timestamps for each message
 * - Different styling for own vs other user messages
 * - Auto-scroll to bottom
 * - Loading skeleton when fetching
 * - Empty state messaging
 * 
 * Dependencies:
 * - React hooks (useEffect, useRef)
 * - Tailwind CSS
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Message, Profile } from '@/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  senderProfiles: Record<string, Profile>;
  isLoading?: boolean;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessageList({
  messages,
  currentUserId,
  senderProfiles,
  isLoading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.sender_id === currentUserId;
        const sender = senderProfiles[message.sender_id];
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const sameSenderAsPrev = prevMessage?.sender_id === message.sender_id;

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar (only show if not same sender as previous) */}
            {!sameSenderAsPrev ? (
              <div className="flex-shrink-0">
                {sender?.avatar_url ? (
                  <img
                    src={sender.avatar_url}
                    alt={sender.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                    {sender?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 flex-shrink-0" />
            )}

            {/* Message Bubble */}
            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
              {/* Sender name and time (only if not same sender as previous) */}
              {!sameSenderAsPrev && (
                <div className={`text-xs text-gray-500 mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  {!isOwnMessage && <span className="font-semibold">{sender?.username}</span>}
                  <span className={!isOwnMessage ? 'ml-2' : ''}>
                    {formatTime(message.created_at)}
                  </span>
                </div>
              )}

              {/* Message content */}
              <div
                className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md xl:max-w-lg break-words
                  ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                  }
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>

              {/* Time for grouped messages */}
              {sameSenderAsPrev && (
                <div className="text-xs text-gray-400 mt-1">
                  {formatTime(message.created_at)}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Auto-scroll target */}
      <div ref={messagesEndRef} />
    </div>
  );
}
