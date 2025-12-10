'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  getConversationWithMessages, 
  sendMessage, 
  markConversationAsRead,
  getPublicProfile
} from '@/utils/database';
import type { Conversation, Message, Profile } from '@/types';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';

export default function ConversationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (loading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getConversationWithMessages(
          conversationId,
          20,
          page * 20
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load conversation');
        }

        const { conversation: conv, messages: msgs } = response.data;
        setConversation(conv);

        if (page === 0) {
          setMessages(msgs);
        } else {
          setMessages(prev => [...prev, ...msgs]);
        }

        setHasMore(msgs.length === 20);

        // Determine other user and fetch their profile
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        try {
          const profileResponse = await getPublicProfile(otherUserId);
          if (profileResponse.success && profileResponse.data) {
            setOtherUser(profileResponse.data);
            // Also add to senderProfiles for MessageList
            setSenderProfiles(prev => ({
              ...prev,
              [otherUserId]: profileResponse.data!,
              [user.id]: { id: user.id, username: user.email?.split('@')[0] || 'User' } as Profile
            }));
          }
        } catch (profileErr) {
          console.error('Failed to fetch other user profile:', profileErr);
        }

        // Mark as read
        const readResponse = await markConversationAsRead(conversationId, user.id);
        if (!readResponse.success) {
          console.error('Failed to mark conversation as read');
        }
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [user, conversationId, page, router, loading]);

  const handleSendMessage = async (content: string) => {
    if (!user || !conversation || !content.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      const response = await sendMessage(conversationId, user.id, content);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to send message');
      }

      setMessages(prev => [...prev, response.data!]);
      
      // Update conversation updated_at
      setConversation(prev => 
        prev ? { ...prev, updated_at: new Date().toISOString() } : null
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleGoBack = () => {
    router.push('/messages');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-2xl mx-auto bg-white shadow-sm flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 sm:p-6 flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-900 text-xl"
              aria-label="Go back to conversations"
            >
              ←
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {otherUser?.full_name || otherUser?.username || 'User'}
              </h1>
              {conversation?.listing_id && (
                <p className="text-sm text-gray-600">Regarding a listing</p>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-gray-600">Loading conversation...</p>
                </div>
              </div>
            ) : (
              <>
                {hasMore && messages.length > 0 && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => setPage(prev => prev + 1)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Load earlier messages
                    </button>
                  </div>
                )}
                <MessageList
                  messages={messages}
                  currentUserId={user.id}
                  senderProfiles={senderProfiles}
                  isLoading={false}
                />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 sm:p-6">
            <MessageInput
              onSend={handleSendMessage}
              isLoading={isSending}
              disabled={isLoading || isSending}
              placeholder="Type a message..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
}
