'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable from '@/components/DataTable';
import { formatDateTime, formatPercent } from '@/lib/format';
import type { ProcessedEmail, AccuracyFeedback } from '@/types';

export default function HistoryPage() {
  const [emails, setEmails] = useState<ProcessedEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 20;

  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/history?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json() as {
        data: { emails: ProcessedEmail[]; total: number };
      };
      setEmails(json.data.emails);
      setTotal(json.data.total);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleFeedback = async (emailId: string, feedback: AccuracyFeedback) => {
    await fetch(`/api/history/${emailId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, accuracyFeedback: feedback } : e))
    );
  };

  const columns = [
    {
      key: 'receivedAt',
      label: 'Date',
      sortable: true,
      render: (row: ProcessedEmail) => (
        <span className="text-gray-600">{formatDateTime(row.receivedAt)}</span>
      ),
    },
    {
      key: 'senderEmail',
      label: 'From',
      sortable: true,
      render: (row: ProcessedEmail) => (
        <span className="font-medium text-gray-900">{row.senderEmail}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row: ProcessedEmail) => (
        <span className="text-gray-700 truncate max-w-xs inline-block">{row.subject}</span>
      ),
    },
    {
      key: 'confidence',
      label: 'Confidence',
      sortable: true,
      render: (row: ProcessedEmail) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            row.confidence >= 0.85
              ? 'bg-green-50 text-green-700'
              : row.confidence >= 0.7
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {formatPercent(row.confidence)}
        </span>
      ),
    },
    {
      key: 'accuracyFeedback',
      label: 'Feedback',
      render: (row: ProcessedEmail) => (
        <span
          className={`text-xs ${
            row.accuracyFeedback === 'correct'
              ? 'text-green-600'
              : row.accuracyFeedback === 'incorrect'
              ? 'text-red-600'
              : row.accuracyFeedback === 'partial'
              ? 'text-yellow-600'
              : 'text-gray-400'
          }`}
        >
          {row.accuracyFeedback || '—'}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin', 'management', 'sales']}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Email History</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review processed emails and provide accuracy feedback
            </p>
          </div>

          <DataTable<ProcessedEmail & Record<string, unknown>>
            columns={columns as Array<{
              key: string;
              label: string;
              sortable?: boolean;
              className?: string;
              render?: (row: ProcessedEmail & Record<string, unknown>) => React.ReactNode;
            }>}
            data={emails as Array<ProcessedEmail & Record<string, unknown>>}
            keyField="id"
            searchable
            searchPlaceholder="Search by sender, subject, or part number..."
            onSearch={(q) => {
              setSearch(q);
              setPage(1);
            }}
            isLoading={isLoading}
            emptyMessage="No processed emails found."
            onRowClick={(row) =>
              setExpandedId(expandedId === row.id ? null : row.id)
            }
            expandedRow={expandedId}
            renderExpanded={(row) => (
              <EmailDetail
                email={row as unknown as ProcessedEmail}
                onFeedback={(fb) => handleFeedback(row.id as string, fb)}
              />
            )}
            pagination={{
              total,
              page,
              pageSize,
              onPageChange: setPage,
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function EmailDetail({
  email,
  onFeedback,
}: {
  email: ProcessedEmail;
  onFeedback: (fb: AccuracyFeedback) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Email Details
        </h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">From:</span>{' '}
            <span className="text-gray-900">{email.senderEmail}</span>
          </div>
          <div>
            <span className="text-gray-500">Subject:</span>{' '}
            <span className="text-gray-900">{email.subject}</span>
          </div>
          <div>
            <span className="text-gray-500">Received:</span>{' '}
            <span className="text-gray-900">{formatDateTime(email.receivedAt)}</span>
          </div>
          <div>
            <span className="text-gray-500">Processed:</span>{' '}
            <span className="text-gray-900">{formatDateTime(email.processedAt)}</span>
          </div>
          <div>
            <span className="text-gray-500">Processing Time:</span>{' '}
            <span className="text-gray-900">
              {Math.round(
                (new Date(email.processedAt).getTime() - new Date(email.receivedAt).getTime()) /
                  1000
              )}
              s
            </span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Results
        </h4>
        <div className="space-y-3">
          {email.partsFound.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Parts Found:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {email.partsFound.map((part) => (
                  <span
                    key={part}
                    className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}
          {email.upsellSuggested.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Upsell Suggested:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {email.upsellSuggested.map((item) => (
                  <span
                    key={item}
                    className="inline-flex px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-mono"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Buttons */}
          <div className="pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 block mb-2">Accuracy Feedback:</span>
            <div className="flex gap-2">
              {(['correct', 'partial', 'incorrect'] as const).map((fb) => (
                <button
                  key={fb}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFeedback(fb);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    email.accuracyFeedback === fb
                      ? fb === 'correct'
                        ? 'bg-green-600 text-white'
                        : fb === 'partial'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {fb === 'correct' ? 'Correct' : fb === 'partial' ? 'Partial' : 'Incorrect'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
