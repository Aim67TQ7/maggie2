import { NextRequest } from 'next/server';
import { getConversations, createConversation } from '@/lib/db';
import { generateConversationTitle } from '@/lib/format';

export async function GET() {
  const startedAt = new Date().toISOString();
  try {
    // TODO: Extract userId from MSAL session
    const userId = 'dev-user';
    const conversations = await getConversations(userId);

    return Response.json({
      data: conversations,
      timing: {
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - new Date(startedAt).getTime(),
      },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    const body = await req.json() as { title?: string };
    const userId = 'dev-user';
    const title = body.title ? generateConversationTitle(body.title) : 'New Conversation';
    const conversation = await createConversation(userId, title);

    return Response.json({
      data: conversation,
      timing: {
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - new Date(startedAt).getTime(),
      },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
