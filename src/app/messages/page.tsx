'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserConversations } from '@/utils/database';
import type { Conversation } from '@/types';
import ConversationList from '@/components/ConversationList';

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Wait for auth to load before checking
    if (loading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUserConversations(user.id, 20, page * 20);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load conversations');
        }

        if (page === 0) {
          setConversations(response.data);
        } else {
          setConversations(prev => [...prev, ...response.data!]);
        }

        setHasMore(response.data.length === 20);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, page, router, loading]);

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600 mt-1">
              {conversations.length === 0 && !isLoading
                ? 'No conversations yet'
                : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 sm:p-6 bg-red-50 border-b border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Conversations List */}
          <div className="overflow-y-auto h-[calc(100%-120px)]">
            {isLoading && conversations.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-3"></div>
                  <p className="text-gray-600">Loading conversations...</p>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">No conversations yet</p>
                  <p className="text-sm text-gray-500">
                    Start messaging by viewing a listing and contacting the owner
                  </p>
                </div>
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                currentUserId={user.id}
                onSelectConversation={handleSelectConversation}
              />
            )}
          </div>

          {/* Load More */}
          {hasMore && conversations.length > 0 && !isLoading && (
            <div className="border-t border-gray-200 p-4 text-center">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="text-brand-primary hover:text-brand-tertiary text-sm font-medium"
              >
                Load more conversations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
