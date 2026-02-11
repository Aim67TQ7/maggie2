'use client';

import type { TrendPoint } from '@/types';

interface ChartPanelProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // percentage change vs previous period
  trend?: TrendPoint[];
  className?: string;
}

export default function ChartPanel({
  title,
  value,
  subtitle,
  change,
  trend,
  className = '',
}: ChartPanelProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {change !== undefined && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isPositive
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {isPositive ? '\u2191' : '\u2193'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Mini Sparkline */}
      {trend && trend.length > 1 && (
        <div className="mt-4 h-12">
          <Sparkline data={trend} positive={isPositive} />
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, positive }: { data: TrendPoint[]; positive?: boolean }) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 200;
  const height = 48;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const color = positive !== false ? '#3b82f6' : '#ef4444';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
