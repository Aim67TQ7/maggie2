import { NextRequest } from 'next/server';
import { executeTask, pollTaskUntilComplete } from '@/lib/orchestrator';
import { addMessage, getMessages } from '@/lib/db';

// Rate limiting: in-memory store (replace with Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 3600000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const startedAt = new Date().toISOString();

  try {
    const body = await req.json() as {
      conversationId: string;
      message: string;
    };

    const { conversationId, message } = body;
    if (!conversationId || !message) {
      return Response.json(
        { error: 'Missing conversationId or message' },
        { status: 400 }
      );
    }

    // TODO: Extract userId from MSAL session token
    const userId = 'dev-user';

    if (!checkRateLimit(userId)) {
      return Response.json(
        { error: 'Rate limit exceeded', message: "You've reached the message limit. Please wait a few minutes." },
        { status: 429 }
      );
    }

    // Save user message
    await addMessage(conversationId, 'user', message);

    // Build context from conversation history
    const history = await getMessages(conversationId);
    const contextMessages = history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Execute task on orchestrator
          const taskResult = await executeTask(message, {
            conversation_history: contextMessages,
          });

          if (taskResult.status === 'completed' && taskResult.result) {
            // Stream the result in chunks to simulate SSE
            const result = taskResult.result;
            const chunkSize = 50;
            for (let i = 0; i < result.length; i += chunkSize) {
              send({ type: 'content', content: result.slice(i, i + chunkSize) });
              await new Promise((r) => setTimeout(r, 20));
            }

            send({
              type: 'meta',
              task_id: taskResult.task_id,
              agents_used: taskResult.agents_used,
              tokens_used: taskResult.tokens_used,
            });
          } else if (taskResult.task_id) {
            // Poll for completion
            send({ type: 'agents', agents: ['Processing...'] });

            const finalResult = await pollTaskUntilComplete(
              taskResult.task_id,
              (status) => {
                if (status.agents_used) {
                  send({ type: 'agents', agents: status.agents_used });
                }
              }
            );

            if (finalResult.result) {
              const result = finalResult.result;
              const chunkSize = 50;
              for (let i = 0; i < result.length; i += chunkSize) {
                send({ type: 'content', content: result.slice(i, i + chunkSize) });
                await new Promise((r) => setTimeout(r, 20));
              }
            }

            send({
              type: 'meta',
              task_id: finalResult.task_id,
              agents_used: finalResult.agents_used,
              tokens_used: finalResult.tokens_used,
            });
          }

          // Save assistant message
          const fullContent = taskResult.result || 'No response received.';
          await addMessage(conversationId, 'assistant', fullContent, {
            orchestratorTaskId: taskResult.task_id,
            agentsUsed: taskResult.agents_used,
            tokensUsed: taskResult.tokens_used,
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          const errorMsg = (err as Error).message || 'Internal error';
          send({ type: 'error', error: errorMsg });

          // Save error as assistant message
          await addMessage(
            conversationId,
            'assistant',
            "I'm having trouble connecting to my data sources right now. Please try again in a moment."
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Request-Started-At': startedAt,
        'X-Request-Completed-At': new Date().toISOString(),
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: 'Internal server error',
        message: (err as Error).message,
        timing: {
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - new Date(startedAt).getTime(),
        },
      },
      { status: 500 }
    );
  }
}
