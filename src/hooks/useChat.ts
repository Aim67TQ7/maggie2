'use client';

import { useCallback, useRef } from 'react';
import { useChatContext, getStatusMessage } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Message, Conversation } from '@/types';

export function useChat() {
  const { dispatch, ...state } = useChatContext();
  const { user } = useAuth();
  const abortRef = useRef<AbortController | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStatusCycle = useCallback(() => {
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const startStatusCycle = useCallback(() => {
    stopStatusCycle();
    let idx = 1;
    statusTimerRef.current = setInterval(() => {
      dispatch({ type: 'UPDATE_STATUS', statusMessage: getStatusMessage(idx) });
      idx++;
    }, 3000);
  }, [dispatch, stopStatusCycle]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json() as { data: Conversation[] };
      dispatch({ type: 'SET_CONVERSATIONS', conversations: data.data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [user, dispatch]);

  const loadMessages = useCallback(async (conversationId: string) => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json() as { data: Message[] };
      dispatch({ type: 'SET_MESSAGES', messages: data.data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [dispatch]);

  const sendMessage = useCallback(async (content: string, conversationId?: string) => {
    if (!user) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Add user message immediately
    let convId = conversationId || state.activeConversationId;

    try {
      // Create conversation if needed
      if (!convId) {
        const res = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: content.substring(0, 50) }),
        });
        if (!res.ok) throw new Error('Failed to create conversation');
        const data = await res.json() as { data: Conversation };
        dispatch({ type: 'ADD_CONVERSATION', conversation: data.data });
        convId = data.data.id;
      }

      // Add user message locally
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: convId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', message: userMessage });
      dispatch({ type: 'START_STREAMING' });

      // Start cycling status messages
      startStatusCycle();

      // Send to API with SSE
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          message: content,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' })) as { message: string };
        throw new Error(err.message);
      }

      if (!res.body) throw new Error('No response body');

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let agents: string[] = [];
      let taskId: string | undefined;
      let tokensUsed: number | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data) as {
                type: string;
                content?: string;
                agents?: string[];
                task_id?: string;
                tokens_used?: number;
                error?: string;
              };

              if (parsed.type === 'content') {
                accumulated += parsed.content || '';
                stopStatusCycle();
                dispatch({ type: 'UPDATE_STREAM', content: accumulated, agents });
              } else if (parsed.type === 'agents') {
                agents = parsed.agents || [];
                dispatch({ type: 'UPDATE_STREAM', content: accumulated, agents });
              } else if (parsed.type === 'meta') {
                taskId = parsed.task_id;
                tokensUsed = parsed.tokens_used;
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error || 'Stream error');
              }
            } catch (e) {
              // Re-throw actual errors
              if (e instanceof Error && e.message !== 'Stream error') {
                const msg = (e as Error).message;
                if (msg && !msg.includes('JSON')) throw e;
              }
              // Non-JSON line, append as content
              if (data.trim()) {
                accumulated += data;
                dispatch({ type: 'UPDATE_STREAM', content: accumulated });
              }
            }
          }
        }
      }

      stopStatusCycle();

      // Finalize message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: convId,
        role: 'assistant',
        content: accumulated || 'No response received.',
        createdAt: new Date().toISOString(),
        orchestratorTaskId: taskId,
        agentsUsed: agents,
        tokensUsed,
      };
      dispatch({ type: 'END_STREAMING', finalMessage: assistantMessage });
    } catch (err) {
      stopStatusCycle();
      if ((err as Error).name === 'AbortError') return;

      // Show error as an in-chat message so nothing disappears
      dispatch({
        type: 'STREAM_ERROR',
        errorMessage: "Sorry, I couldn't connect to my data sources right now. This usually means the orchestrator service isn't reachable. Please try again in a moment.",
        conversationId: convId || 'unknown',
      });
    }
  }, [user, state.activeConversationId, dispatch, startStatusCycle, stopStatusCycle]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
      dispatch({ type: 'REMOVE_CONVERSATION', id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message });
    }
  }, [dispatch]);

  const cancelStream = useCallback(() => {
    stopStatusCycle();
    abortRef.current?.abort();
    dispatch({ type: 'SET_ERROR', error: null });
  }, [dispatch, stopStatusCycle]);

  return {
    ...state,
    loadConversations,
    loadMessages,
    sendMessage,
    deleteConversation,
    cancelStream,
  };
}
