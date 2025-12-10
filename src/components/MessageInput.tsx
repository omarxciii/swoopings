/**
 * Message Input Component
 * 
 * File Purpose:
 * - Text input for composing messages in conversations
 * - Handles sending messages with Enter key or Send button
 * - Shows loading state while sending
 * - Clears input after successful send
 * 
 * Props:
 * - onSend: Callback function when message is sent
 * - isLoading: Whether message is being sent
 * - disabled: Whether input is disabled
 * 
 * Features:
 * - Text area with auto-expand on input
 * - Send button (icon or text)
 * - Enter to send (Shift+Enter for new line)
 * - Character count (optional)
 * - Loading/disabled states
 * - Placeholder text
 * 
 * Dependencies:
 * - React hooks (useState, useCallback, useRef, useEffect)
 * - Tailwind CSS
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function MessageInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Type a message...',
  autoFocus = true,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || sending || isLoading || disabled) return;

    const contentToSend = message.trim();
    setMessage('');
    setSending(true);

    try {
      await onSend(contentToSend);
    } catch (error) {
      // If error, restore the message
      setMessage(contentToSend);
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [message, sending, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (unless Shift is held for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading || sending || !message.trim();

  return (
    <div className="flex gap-3 p-4 border-t border-gray-200 bg-white">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none
          focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none
          disabled:bg-gray-100 disabled:cursor-not-allowed
          max-h-[120px] overflow-y-auto text-sm"
        rows={1}
      />

      <button
        onClick={handleSend}
        disabled={isDisabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 transition-colors flex items-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
          h-fit"
        title="Send message (Ctrl+Enter)"
      >
        {sending || isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="hidden sm:inline">Send</span>
          </>
        )}
      </button>
    </div>
  );
}
