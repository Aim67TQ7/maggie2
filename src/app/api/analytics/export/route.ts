import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateRange = searchParams.get('dateRange') || '30days';

  // Generate CSV content
  const headers = ['Date', 'Emails Processed', 'Avg Response Time (s)', 'Automation Rate (%)', 'Upsell Attach Rate (%)', 'Revenue Attributed ($)'];
  const rows: string[][] = [];

  const days = dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : dateRange === '90days' ? 90 : 30;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    rows.push([
      date.toISOString().split('T')[0],
      String(Math.floor(8 + Math.random() * 15)),
      String(Math.floor(25 + Math.random() * 20)),
      String(Math.floor(70 + Math.random() * 20)),
      String(Math.floor(15 + Math.random() * 15)),
      String(Math.floor(400 + Math.random() * 600)),
    ]);
  }

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="maggie-analytics-${dateRange}.csv"`,
    },
  });
}
