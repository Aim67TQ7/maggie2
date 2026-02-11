import { NextRequest } from 'next/server';
import type { AnalyticsDashboard, DateRange, TrendPoint } from '@/types';

// Generate demo analytics data
function generateAnalytics(dateRange: DateRange): AnalyticsDashboard {
  const days = dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : dateRange === '90days' ? 90 : 30;

  const trend: TrendPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trend.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(8 + Math.random() * 15),
    });
  }

  const totalEmails = trend.reduce((sum, t) => sum + t.value, 0);

  return {
    volume: {
      total: totalEmails,
      today: Math.floor(8 + Math.random() * 12),
      thisWeek: Math.floor(60 + Math.random() * 40),
      thisMonth: totalEmails,
      trend,
      previousPeriodTotal: Math.floor(totalEmails * (0.85 + Math.random() * 0.3)),
    },
    responseTime: {
      average: Math.floor(25 + Math.random() * 20),
      p95: Math.floor(60 + Math.random() * 30),
      trend: trend.map((t) => ({
        ...t,
        value: Math.floor(20 + Math.random() * 25),
      })),
      previousAverage: Math.floor(30 + Math.random() * 15),
    },
    automation: {
      automatedPercent: 0.72 + Math.random() * 0.15,
      escalatedPercent: 0.13 + Math.random() * 0.1,
      escalationReasons: [
        { reason: 'Low confidence match', count: Math.floor(5 + Math.random() * 10) },
        { reason: 'No part found in catalog', count: Math.floor(3 + Math.random() * 8) },
        { reason: 'Custom request', count: Math.floor(2 + Math.random() * 5) },
      ],
      previousAutomatedPercent: 0.68 + Math.random() * 0.1,
    },
    upsell: {
      suggestionsPerEmail: 1.2 + Math.random() * 0.8,
      attachRate: 0.15 + Math.random() * 0.15,
      revenueAttributed: Math.floor(12000 + Math.random() * 18000),
      trend: trend.map((t) => ({
        ...t,
        value: Math.floor(500 + Math.random() * 1500),
      })),
      previousAttachRate: 0.12 + Math.random() * 0.1,
    },
    topCustomers: [
      { name: 'ABC Manufacturing', emailCount: 15, avgOrderValue: 4200, trend: 'up' },
      { name: 'XYZ Industrial', emailCount: 12, avgOrderValue: 3800, trend: 'up' },
      { name: 'Acme Corp', emailCount: 10, avgOrderValue: 5100, trend: 'flat' },
      { name: 'Global Metals', emailCount: 8, avgOrderValue: 2900, trend: 'down' },
      { name: 'Precision Parts Inc', emailCount: 7, avgOrderValue: 6200, trend: 'up' },
    ],
    systemHealth: {
      orchestratorStatus: 'healthy',
      uptime: 99.7 + Math.random() * 0.3,
      epicorLatency: Math.floor(150 + Math.random() * 100),
      errorRate: Math.random() * 0.02,
    },
  };
}

export async function GET(req: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get('dateRange') || '30days') as DateRange;

    const data = generateAnalytics(dateRange);

    return Response.json({
      data,
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
