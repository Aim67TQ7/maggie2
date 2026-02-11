'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnalyticsDashboard, AnalyticsFilters, DateRange } from '@/types';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({ dateRange: '30days' });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async (currentFilters: AnalyticsFilters) => {
    try {
      const params = new URLSearchParams();
      params.set('dateRange', currentFilters.dateRange);
      if (currentFilters.startDate) params.set('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.set('endDate', currentFilters.endDate);
      if (currentFilters.customer) params.set('customer', currentFilters.customer);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json() as { data: AnalyticsDashboard };
      setData(json.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchAnalytics(filters);

    intervalRef.current = setInterval(() => {
      fetchAnalytics(filters);
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filters, fetchAnalytics]);

  const setDateRange = useCallback((dateRange: DateRange) => {
    setIsLoading(true);
    setFilters((prev) => ({ ...prev, dateRange }));
  }, []);

  const setCustomRange = useCallback((startDate: string, endDate: string) => {
    setIsLoading(true);
    setFilters({ dateRange: 'custom', startDate, endDate });
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchAnalytics(filters);
  }, [filters, fetchAnalytics]);

  const exportCsv = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('dateRange', filters.dateRange);
    params.set('format', 'csv');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    const res = await fetch(`/api/analytics/export?${params.toString()}`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maggie-analytics-${filters.dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filters]);

  return {
    data,
    isLoading,
    error,
    filters,
    setDateRange,
    setCustomRange,
    refresh,
    exportCsv,
  };
}
