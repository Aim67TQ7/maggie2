'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatDateTime } from '@/lib/format';
import type { SystemConfig, ConfigChangeLog } from '@/types';

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [changes, setChanges] = useState<ConfigChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json() as {
        data: { config: SystemConfig; changes: ConfigChangeLog[] };
      };
      setConfig(json.data.config);
      setChanges(json.data.changes);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaveMessage('Settings saved successfully.');
      fetchSettings(); // Refresh change log
    } catch {
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (isLoading || !config) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure Maggie&apos;s behavior and system parameters
            </p>
          </div>

          {/* Config Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="space-y-6">
              {/* Email Processing */}
              <Section title="Email Processing">
                <NumberField
                  label="Poll Interval (seconds)"
                  value={config.pollInterval}
                  onChange={(v) => setConfig({ ...config, pollInterval: v })}
                  min={10}
                  max={300}
                />
                <NumberField
                  label="Confidence Threshold"
                  value={config.confidenceThreshold}
                  onChange={(v) => setConfig({ ...config, confidenceThreshold: v })}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <NumberField
                  label="Max Upsell Items"
                  value={config.maxUpsellItems}
                  onChange={(v) => setConfig({ ...config, maxUpsellItems: v })}
                  min={0}
                  max={10}
                />
              </Section>

              {/* Recipients */}
              <Section title="Recipients">
                <TextField
                  label="Inside Sales Email"
                  value={config.insideSalesEmail}
                  onChange={(v) => setConfig({ ...config, insideSalesEmail: v })}
                />
              </Section>

              {/* Behavior */}
              <Section title="Behavior">
                <ToggleField
                  label="Oversight Mode"
                  description="Queue briefings for approval before sending"
                  value={config.oversightMode}
                  onChange={(v) => setConfig({ ...config, oversightMode: v })}
                />
                <ToggleField
                  label="Auto-Acknowledge"
                  description="Send customer receipt confirmation automatically"
                  value={config.autoAcknowledge}
                  onChange={(v) => setConfig({ ...config, autoAcknowledge: v })}
                />
              </Section>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMessage && (
                <span
                  className={`text-sm ${
                    saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {saveMessage}
                </span>
              )}
            </div>
          </div>

          {/* Change Log */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Log</h2>
            {changes.length === 0 ? (
              <p className="text-sm text-gray-400">No changes recorded.</p>
            ) : (
              <div className="space-y-3">
                {changes.map((change) => (
                  <div
                    key={change.id}
                    className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{change.parameter}</span>
                      <span className="text-gray-400"> changed from </span>
                      <code className="text-xs bg-red-50 text-red-700 px-1 py-0.5 rounded">
                        {change.oldValue}
                      </code>
                      <span className="text-gray-400"> to </span>
                      <code className="text-xs bg-green-50 text-green-700 px-1 py-0.5 rounded">
                        {change.newValue}
                      </code>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(change.changedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// --- Form Components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-600 shrink-0">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

function ToggleField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-700">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
