// ============================================================
// Database Layer — PostgreSQL conversation + analytics storage
// In-memory mock for development, swap to pg driver for production
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Conversation,
  Message,
  ProcessedEmail,
  SystemConfig,
  ConfigChangeLog,
  AccuracyFeedback,
} from '@/types';

// --- In-Memory Storage (replace with PostgreSQL in production) ---

const conversations: Map<string, Conversation> = new Map();
const messages: Map<string, Message[]> = new Map();
const emails: ProcessedEmail[] = [];
const configChanges: ConfigChangeLog[] = [];

let systemConfig: SystemConfig = {
  pollInterval: 60,
  confidenceThreshold: 0.7,
  maxUpsellItems: 3,
  insideSalesEmail: 'rclausing@bfrgroup.com',
  oversightMode: true,
  autoAcknowledge: false,
};

// --- Conversations ---

export async function getConversations(userId: string): Promise<Conversation[]> {
  return Array.from(conversations.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return conversations.get(id) || null;
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: uuidv4(),
    userId,
    title,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };
  conversations.set(conv.id, conv);
  messages.set(conv.id, []);
  return conv;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const conv = conversations.get(id);
  if (conv) {
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
  }
}

export async function deleteConversation(id: string): Promise<void> {
  conversations.delete(id);
  messages.delete(id);
}

// --- Messages ---

export async function getMessages(conversationId: string): Promise<Message[]> {
  return messages.get(conversationId) || [];
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  meta?: {
    orchestratorTaskId?: string;
    agentsUsed?: string[];
    tokensUsed?: number;
  }
): Promise<Message> {
  const msg: Message = {
    id: uuidv4(),
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...meta,
  };

  const convMessages = messages.get(conversationId) || [];
  convMessages.push(msg);
  messages.set(conversationId, convMessages);

  // Update conversation metadata
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.messageCount = convMessages.length;
    conv.updatedAt = msg.createdAt;
    conv.preview = content.substring(0, 100);
  }

  return msg;
}

// --- Email History ---

export async function getProcessedEmails(
  limit = 50,
  offset = 0,
  search?: string
): Promise<{ emails: ProcessedEmail[]; total: number }> {
  let filtered = emails;
  if (search) {
    const q = search.toLowerCase();
    filtered = emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.senderEmail.toLowerCase().includes(q) ||
        e.partsFound.some((p) => p.toLowerCase().includes(q))
    );
  }
  return {
    emails: filtered
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(offset, offset + limit),
    total: filtered.length,
  };
}

export async function getProcessedEmail(id: string): Promise<ProcessedEmail | null> {
  return emails.find((e) => e.id === id) || null;
}

export async function updateEmailFeedback(
  id: string,
  feedback: AccuracyFeedback
): Promise<void> {
  const email = emails.find((e) => e.id === id);
  if (email) {
    email.accuracyFeedback = feedback;
  }
}

// --- System Config ---

export async function getSystemConfig(): Promise<SystemConfig> {
  return { ...systemConfig };
}

export async function updateSystemConfig(
  updates: Partial<SystemConfig>,
  changedBy: string
): Promise<SystemConfig> {
  for (const [key, newValue] of Object.entries(updates)) {
    const oldValue = String(systemConfig[key as keyof SystemConfig]);
    configChanges.push({
      id: uuidv4(),
      parameter: key,
      oldValue,
      newValue: String(newValue),
      changedBy,
      changedAt: new Date().toISOString(),
    });
  }
  systemConfig = { ...systemConfig, ...updates };
  return { ...systemConfig };
}

export async function getConfigChanges(limit = 50): Promise<ConfigChangeLog[]> {
  return configChanges
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .slice(0, limit);
}

// --- Seed demo data for development ---

export function seedDemoData(): void {
  if (emails.length > 0) return;

  const now = Date.now();
  const hour = 3600000;

  for (let i = 0; i < 25; i++) {
    const receivedAt = new Date(now - i * hour * 2).toISOString();
    const processedAt = new Date(now - i * hour * 2 + 45000).toISOString();
    emails.push({
      id: uuidv4(),
      senderEmail: ['john.smith@customer.com', 'jane.doe@bigcorp.com', 'mike@acme.com', 'sarah@widgets.co'][i % 4],
      subject: [
        'Need spare parts for Model 500',
        'Quote request for magnetic separator',
        'Job 12345 status update needed',
        'Replacement roller for conveyor line 3',
      ][i % 4],
      receivedAt,
      processedAt,
      confidence: 0.65 + Math.random() * 0.35,
      partsFound: [['MAG-500-ROLLER', 'MAG-500-BEARING'], ['SEP-200-MAGNET'], ['CONV-300-BELT', 'CONV-300-MOTOR'], []][i % 4],
      upsellSuggested: i % 3 === 0 ? ['MAG-500-PREMIUM-KIT'] : [],
      accuracyFeedback: i % 5 === 0 ? 'correct' : i % 7 === 0 ? 'partial' : null,
    });
  }
}

// Auto-seed on import in development
if (process.env.NODE_ENV === 'development') {
  seedDemoData();
}
