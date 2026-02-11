'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatMessage, { StreamingMessage } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';

export default function ChatPage() {
  const {
    messages,
    isStreaming,
    streamingContent,
    agentActivity,
    statusMessage,
    error,
    activeConversationId,
    loadConversations,
    loadMessages,
    sendMessage,
    clearError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, statusMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming ? (
          <EmptyState onSuggestionClick={sendMessage} />
        ) : (
          <div className="max-w-4xl mx-auto py-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isStreaming && (
              <StreamingMessage
                content={streamingContent}
                agents={agentActivity}
                statusMessage={statusMessage}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600 ml-3">
            &times;
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        placeholder={
          isStreaming
            ? 'Maggie is working on it...'
            : 'Ask Maggie anything — job status, inventory, customer history...'
        }
      />
    </div>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (msg: string) => void }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-lg px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto">
          M
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          What can I help you with?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          I can look up job status, inventory levels, customer history, shipping info, and more — all from Epicor.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            "What's the status of job 12345?",
            'Show open orders for customer ABC',
            'Check inventory for part MAG-500',
            "What shipped today?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
