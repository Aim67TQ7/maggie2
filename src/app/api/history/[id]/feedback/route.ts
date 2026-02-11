import { NextRequest } from 'next/server';
import { updateEmailFeedback } from '@/lib/db';
import type { AccuracyFeedback } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as { feedback: AccuracyFeedback };
    const valid: AccuracyFeedback[] = ['correct', 'incorrect', 'partial', null];
    if (!valid.includes(body.feedback)) {
      return Response.json({ error: 'Invalid feedback value' }, { status: 400 });
    }

    await updateEmailFeedback(params.id, body.feedback);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
