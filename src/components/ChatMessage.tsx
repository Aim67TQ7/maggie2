'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';
import { formatDateTime } from '@/lib/format';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Maggie Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          M
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
          {isUser ? (
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => (
                  <div className="relative group">
                    <pre className="bg-gray-800 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs">
                      {children}
                    </pre>
                    <button
                      onClick={() => {
                        const code = (children as React.ReactElement)?.props?.children;
                        if (typeof code === 'string') navigator.clipboard.writeText(code);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs transition-opacity"
                    >
                      Copy
                    </button>
                  </div>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">{children}</table>
                  </div>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Metadata */}
        <div
          className={`flex items-center gap-2 mt-2 text-xs ${
            isUser ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          <span>{formatDateTime(message.createdAt)}</span>
          {message.agentsUsed && message.agentsUsed.length > 0 && (
            <>
              <span>&middot;</span>
              <span>{message.agentsUsed.join(', ')}</span>
            </>
          )}
          {message.tokensUsed !== undefined && message.tokensUsed > 0 && (
            <>
              <span>&middot;</span>
              <span>{message.tokensUsed} tokens</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Streaming Message (partial content with animation)
export function StreamingMessage({
  content,
  agents,
}: {
  content: string;
  agents: string[];
}) {
  return (
    <div className="flex gap-3 px-4 py-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
        M
      </div>
      <div className="max-w-[75%]">
        <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3">
          <div className="prose prose-sm max-w-none">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}
          </div>
        </div>
        {/* Agent Activity Badges */}
        {agents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {agents.map((agent) => (
              <span
                key={agent}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {agent}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
