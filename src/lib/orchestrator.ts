import type { OrchestratorTaskRequest, OrchestratorTaskStatus, OrchestratorHealth } from '@/types';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:8000';

interface RequestOptions {
  signal?: AbortSignal;
}

async function orchestratorFetch<T>(
  path: string,
  options: RequestInit & RequestOptions = {}
): Promise<T> {
  const start = Date.now();
  const res = await fetch(`${ORCHESTRATOR_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'Unknown error');
    throw new Error(`Orchestrator error ${res.status}: ${body}`);
  }

  const data = await res.json() as T;
  const durationMs = Date.now() - start;

  // Attach timing metadata
  return { ...data, _timing: { durationMs } };
}

export async function executeTask(
  instruction: string,
  context?: Record<string, unknown>,
  options?: RequestOptions
): Promise<OrchestratorTaskStatus> {
  const body: OrchestratorTaskRequest = { instruction, context };
  return orchestratorFetch<OrchestratorTaskStatus>('/task/execute', {
    method: 'POST',
    body: JSON.stringify(body),
    signal: options?.signal,
  });
}

export async function getTaskStatus(
  taskId: string,
  options?: RequestOptions
): Promise<OrchestratorTaskStatus> {
  return orchestratorFetch<OrchestratorTaskStatus>(`/task/${taskId}/status`, {
    signal: options?.signal,
  });
}

export async function getTaskResult(
  taskId: string,
  options?: RequestOptions
): Promise<OrchestratorTaskStatus> {
  return orchestratorFetch<OrchestratorTaskStatus>(`/task/${taskId}/result`, {
    signal: options?.signal,
  });
}

export async function getHealth(
  options?: RequestOptions
): Promise<OrchestratorHealth> {
  return orchestratorFetch<OrchestratorHealth>('/health', {
    signal: options?.signal,
  });
}

export async function getAgents(
  options?: RequestOptions
): Promise<string[]> {
  return orchestratorFetch<string[]>('/agents', {
    signal: options?.signal,
  });
}

// Poll for task completion with SSE-style streaming callback
export async function pollTaskUntilComplete(
  taskId: string,
  onUpdate: (status: OrchestratorTaskStatus) => void,
  intervalMs = 1000,
  timeoutMs = 300000,
  signal?: AbortSignal
): Promise<OrchestratorTaskStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (signal?.aborted) throw new Error('Aborted');

    const status = await getTaskStatus(taskId, { signal });
    onUpdate(status);

    if (status.status === 'completed' || status.status === 'failed') {
      if (status.status === 'completed') {
        return getTaskResult(taskId, { signal });
      }
      throw new Error(status.error || 'Task failed');
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Task timed out after 5 minutes');
}
