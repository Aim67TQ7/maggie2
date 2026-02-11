'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ChartPanel from '@/components/ChartPanel';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  formatNumber,
  formatDuration,
  formatPercent,
  formatCurrency,
} from '@/lib/format';
import type { DateRange } from '@/types';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: '90days', label: '90 Days' },
];

export default function AnalyticsPage() {
  const { data, isLoading, filters, setDateRange, refresh, exportCsv } = useAnalytics();

  return (
    <ProtectedRoute allowedRoles={['admin', 'management']}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">
                Email processing performance and automation metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`px-3 py-1.5 text-sm ${
                      filters.dateRange === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={refresh}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshIcon className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={exportCsv}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {isLoading || !data ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Top Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ChartPanel
                  title="Emails Processed"
                  value={formatNumber(data.volume.total)}
                  subtitle={`${data.volume.today} today`}
                  change={
                    ((data.volume.total - data.volume.previousPeriodTotal) /
                      (data.volume.previousPeriodTotal || 1)) *
                    100
                  }
                  trend={data.volume.trend}
                />
                <ChartPanel
                  title="Avg Response Time"
                  value={formatDuration(data.responseTime.average * 1000)}
                  subtitle={`p95: ${formatDuration(data.responseTime.p95 * 1000)}`}
                  change={
                    -((data.responseTime.average - data.responseTime.previousAverage) /
                      (data.responseTime.previousAverage || 1)) *
                    100
                  }
                  trend={data.responseTime.trend}
                />
                <ChartPanel
                  title="Automation Rate"
                  value={formatPercent(data.automation.automatedPercent)}
                  subtitle={`${formatPercent(data.automation.escalatedPercent)} escalated`}
                  change={
                    ((data.automation.automatedPercent -
                      data.automation.previousAutomatedPercent) /
                      (data.automation.previousAutomatedPercent || 1)) *
                    100
                  }
                />
                <ChartPanel
                  title="Upsell Attach Rate"
                  value={formatPercent(data.upsell.attachRate)}
                  subtitle={formatCurrency(data.upsell.revenueAttributed) + ' revenue'}
                  change={
                    ((data.upsell.attachRate - data.upsell.previousAttachRate) /
                      (data.upsell.previousAttachRate || 1)) *
                    100
                  }
                  trend={data.upsell.trend}
                />
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Customers */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Top Customers</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-wider">
                        <th className="text-left pb-3">Customer</th>
                        <th className="text-right pb-3">Emails</th>
                        <th className="text-right pb-3">Avg Order</th>
                        <th className="text-right pb-3">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCustomers.map((customer) => (
                        <tr key={customer.name} className="border-t border-gray-50">
                          <td className="py-2.5 text-sm font-medium text-gray-900">
                            {customer.name}
                          </td>
                          <td className="py-2.5 text-sm text-gray-600 text-right">
                            {customer.emailCount}
                          </td>
                          <td className="py-2.5 text-sm text-gray-600 text-right">
                            {formatCurrency(customer.avgOrderValue)}
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`text-sm ${
                                customer.trend === 'up'
                                  ? 'text-green-600'
                                  : customer.trend === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {customer.trend === 'up'
                                ? '\u2191'
                                : customer.trend === 'down'
                                ? '\u2193'
                                : '\u2192'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* System Health */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">System Health</h3>
                  <div className="space-y-4">
                    <HealthRow
                      label="Orchestrator"
                      value={data.systemHealth.orchestratorStatus}
                      isStatus
                    />
                    <HealthRow
                      label="Uptime"
                      value={`${data.systemHealth.uptime.toFixed(1)}%`}
                    />
                    <HealthRow
                      label="Epicor Latency"
                      value={`${data.systemHealth.epicorLatency}ms`}
                    />
                    <HealthRow
                      label="Error Rate"
                      value={formatPercent(data.systemHealth.errorRate)}
                    />

                    {/* Escalation Reasons */}
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Escalation Reasons
                      </h4>
                      {data.automation.escalationReasons.map((reason) => (
                        <div
                          key={reason.reason}
                          className="flex justify-between items-center py-1.5"
                        >
                          <span className="text-xs text-gray-600">{reason.reason}</span>
                          <span className="text-xs font-medium text-gray-900">
                            {reason.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function HealthRow({
  label,
  value,
  isStatus,
}: {
  label: string;
  value: string;
  isStatus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {isStatus ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              value === 'healthy'
                ? 'bg-green-500'
                : value === 'degraded'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium capitalize">{value}</span>
        </span>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      )}
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
    </svg>
  );
}
