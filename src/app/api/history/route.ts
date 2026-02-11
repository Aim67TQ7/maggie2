import { NextRequest } from 'next/server';
import { getProcessedEmails } from '@/lib/db';

export async function GET(req: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || undefined;

    const result = await getProcessedEmails(limit, offset, search);

    return Response.json({
      data: result,
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
