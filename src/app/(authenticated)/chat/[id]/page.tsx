'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useChatContext } from '@/contexts/ChatContext';

// This page just sets the active conversation and renders the same chat UI
// The parent chat layout handles the actual rendering
export default function ConversationPage() {
  const params = useParams();
  const { setActiveConversation } = useChatContext();

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      setActiveConversation(params.id);
    }
  }, [params.id, setActiveConversation]);

  // Re-export parent chat page — Next.js will use the parent layout
  // The actual chat UI is in the parent page
  return null;
}
