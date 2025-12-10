'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { getUnreadMessageCount } from '@/utils/database';
import ConversationItem from './ConversationItem';
import type { Conversation, Profile, Message } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  conversations,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [otherUsers, setOtherUsers] = useState<Record<string, Profile>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message | null>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { data: profileData = {} } = useFetch(`/api/profiles`) as { 
    data: Record<string, Profile> 
  };

  useEffect(() => {
    if (profileData) {
      setOtherUsers(profileData as Record<string, Profile>);
    }
  }, [profileData]);

  // Fetch last message for each conversation
  useEffect(() => {
    const fetchLastMessages = async () => {
      const messages: Record<string, Message | null> = {};
      
      for (const conversation of conversations) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (!error && data) {
            messages[conversation.id] = data as Message;
          } else {
            messages[conversation.id] = null;
          }
        } catch (err) {
          console.error(`Error fetching last message for conversation ${conversation.id}:`, err);
          messages[conversation.id] = null;
        }
      }
      
      setLastMessages(messages);
    };

    if (conversations.length > 0) {
      fetchLastMessages();
    }
  }, [conversations]);

  // Fetch unread count for each conversation
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const conversation of conversations) {
        try {
          const response = await getUnreadMessageCount(conversation.id, currentUserId);
          if (response.success && response.data) {
            counts[conversation.id] = response.data;
          } else {
            counts[conversation.id] = 0;
          }
        } catch (err) {
          console.error(`Error fetching unread count for conversation ${conversation.id}:`, err);
          counts[conversation.id] = 0;
        }
      }
      
      setUnreadCounts(counts);
    };

    if (conversations.length > 0) {
      fetchUnreadCounts();
    }
  }, [conversations, currentUserId]);

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const otherUserId = 
          conversation.user1_id === currentUserId 
            ? conversation.user2_id 
            : conversation.user1_id;
        const otherUser = otherUsers[otherUserId];
        const lastMessage = lastMessages[conversation.id];
        const unreadCount = unreadCounts[conversation.id] || 0;

        return (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            otherUser={otherUser}
            lastMessage={lastMessage}
            unreadCount={unreadCount}
            isSelected={selectedConversationId === conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
          />
        );
      })}
    </div>
  );
}
