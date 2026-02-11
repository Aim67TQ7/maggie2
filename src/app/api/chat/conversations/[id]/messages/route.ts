import { NextRequest } from 'next/server';
import { getMessages } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const startedAt = new Date().toISOString();
  try {
    const messages = await getMessages(params.id);
    return Response.json({
      data: messages,
      timing: {
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - new Date(startedAt).getTime(),
      },
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
