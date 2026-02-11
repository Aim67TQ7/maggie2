import { NextRequest } from 'next/server';
import { getSystemConfig, updateSystemConfig, getConfigChanges } from '@/lib/db';

export async function GET() {
  const startedAt = new Date().toISOString();
  try {
    const config = await getSystemConfig();
    const changes = await getConfigChanges(20);

    return Response.json({
      data: { config, changes },
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    // TODO: Extract userId from MSAL session
    const userId = 'dev-user';
    const config = await updateSystemConfig(body, userId);

    return Response.json({ data: config });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
