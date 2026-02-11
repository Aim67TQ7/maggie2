'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { Conversation, Message } from '@/types';

// --- Status Messages ---

const STATUS_MESSAGES = [
  'Thinking about that...',
  'Pulling up the details...',
  'Checking the records...',
  'Working on it...',
  'Almost there...',
  'Running the numbers...',
  'Digging through the data...',
];

export function getStatusMessage(index: number): string {
  return STATUS_MESSAGES[index % STATUS_MESSAGES.length];
}

// --- State ---

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  agentActivity: string[];
  statusMessage: string;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; conversations: Conversation[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; id: string | null }
  | { type: 'ADD_CONVERSATION'; conversation: Conversation }
  | { type: 'REMOVE_CONVERSATION'; id: string }
  | { type: 'SET_MESSAGES'; messages: Message[] }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'START_STREAMING' }
  | { type: 'UPDATE_STREAM'; content: string; agents?: string[] }
  | { type: 'UPDATE_STATUS'; statusMessage: string }
  | { type: 'END_STREAMING'; finalMessage: Message }
  | { type: 'STREAM_ERROR'; errorMessage: string; conversationId: string }
  | { type: 'SET_ERROR'; error: string | null };

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  agentActivity: [],
  statusMessage: '',
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.conversations };
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversationId: action.id, messages: [], error: null };
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
        activeConversationId: action.conversation.id,
      };
    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.id),
        activeConversationId:
          state.activeConversationId === action.id ? null : state.activeConversationId,
      };
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'START_STREAMING':
      return { ...state, isStreaming: true, streamingContent: '', agentActivity: [], statusMessage: 'Thinking about that...', error: null };
    case 'UPDATE_STREAM':
      return {
        ...state,
        streamingContent: action.content,
        agentActivity: action.agents || state.agentActivity,
        statusMessage: action.content ? 'Responding...' : state.statusMessage,
      };
    case 'UPDATE_STATUS':
      return { ...state, statusMessage: action.statusMessage };
    case 'END_STREAMING':
      return {
        ...state,
        isStreaming: false,
        streamingContent: '',
        agentActivity: [],
        statusMessage: '',
        messages: [...state.messages, action.finalMessage],
      };
    case 'STREAM_ERROR': {
      // Add error as an in-chat assistant message so nothing "disappears"
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        conversationId: action.conversationId,
        role: 'assistant',
        content: action.errorMessage,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        isStreaming: false,
        streamingContent: '',
        agentActivity: [],
        statusMessage: '',
        error: null,
        messages: [...state.messages, errorMsg],
      };
    }
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false, isStreaming: false, statusMessage: '' };
    default:
      return state;
  }
}

// --- Context ---

interface ChatContextValue extends ChatState {
  dispatch: React.Dispatch<ChatAction>;
  setActiveConversation: (id: string | null) => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const setActiveConversation = useCallback(
    (id: string | null) => dispatch({ type: 'SET_ACTIVE_CONVERSATION', id }),
    []
  );

  const clearError = useCallback(
    () => dispatch({ type: 'SET_ERROR', error: null }),
    []
  );

  return (
    <ChatContext.Provider value={{ ...state, dispatch, setActiveConversation, clearError }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
