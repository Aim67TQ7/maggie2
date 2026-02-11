// ============================================================
// Maggie Web App — Type Definitions
// ============================================================

// --- Auth & Users ---

export type UserRole = 'admin' | 'management' | 'sales' | 'operations';

export interface MaggieUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

// --- Chat ---

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  orchestratorTaskId?: string;
  agentsUsed?: string[];
  tokensUsed?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
}

// --- Orchestrator ---

export interface OrchestratorTaskRequest {
  instruction: string;
  context?: Record<string, unknown>;
}

export interface OrchestratorTaskStatus {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  agents_used?: string[];
  tokens_used?: number;
  error?: string;
}

export interface OrchestratorHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  agents_available: number;
}

// --- Analytics ---

export type DateRange = 'today' | '7days' | '30days' | '90days' | 'custom';

export interface AnalyticsFilters {
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  customer?: string;
}

export interface VolumeMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  trend: TrendPoint[];
  previousPeriodTotal: number;
}

export interface ResponseTimeMetrics {
  average: number;
  p95: number;
  trend: TrendPoint[];
  previousAverage: number;
}

export interface AutomationMetrics {
  automatedPercent: number;
  escalatedPercent: number;
  escalationReasons: { reason: string; count: number }[];
  previousAutomatedPercent: number;
}

export interface UpsellMetrics {
  suggestionsPerEmail: number;
  attachRate: number;
  revenueAttributed: number;
  trend: TrendPoint[];
  previousAttachRate: number;
}

export interface TopCustomer {
  name: string;
  emailCount: number;
  avgOrderValue: number;
  trend: 'up' | 'down' | 'flat';
}

export interface SystemHealthMetrics {
  orchestratorStatus: 'healthy' | 'degraded' | 'down';
  uptime: number;
  epicorLatency: number;
  errorRate: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface AnalyticsDashboard {
  volume: VolumeMetrics;
  responseTime: ResponseTimeMetrics;
  automation: AutomationMetrics;
  upsell: UpsellMetrics;
  topCustomers: TopCustomer[];
  systemHealth: SystemHealthMetrics;
}

// --- Email History ---

export type AccuracyFeedback = 'correct' | 'incorrect' | 'partial' | null;

export interface ProcessedEmail {
  id: string;
  senderEmail: string;
  subject: string;
  receivedAt: string;
  processedAt: string;
  confidence: number;
  partsFound: string[];
  upsellSuggested: string[];
  accuracyFeedback: AccuracyFeedback;
  originalBody?: string;
  parsedData?: Record<string, unknown>;
  baqResults?: Record<string, unknown>;
  briefingSent?: string;
}

// --- Settings ---

export interface SystemConfig {
  pollInterval: number;
  confidenceThreshold: number;
  maxUpsellItems: number;
  insideSalesEmail: string;
  oversightMode: boolean;
  autoAcknowledge: boolean;
}

export interface ConfigChangeLog {
  id: string;
  parameter: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

// --- API Responses ---

export interface ApiResponse<T> {
  data: T;
  timing: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
