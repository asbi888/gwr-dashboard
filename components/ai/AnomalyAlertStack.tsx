'use client';

import { useState, useMemo } from 'react';
import type { DashboardData } from '@/lib/data-context';
import { detectAnomalies, type AnomalyAlert } from '@/lib/ai-insights';
import AIBadge from './AIBadge';

const SEVERITY_STYLES: Record<string, { border: string; icon: string; bg: string }> = {
  red: { border: '#FF6B6B', icon: '#FF6B6B', bg: '#FFF5F5' },
  yellow: { border: '#FFB547', icon: '#FFB547', bg: '#FFFFF0' },
  blue: { border: '#7B61FF', icon: '#7B61FF', bg: '#F5F3FF' },
};

export default function AnomalyAlertStack({ data }: { data: DashboardData }) {
  const alerts = useMemo(() => detectAnomalies(data), [data]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(true);

  if (alerts.length === 0) return null;

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  const hiddenCount = dismissed.size;

  if (!showAll && visible.length === 0 && hiddenCount > 0) {
    return (
      <div className="animate-fade-in-up opacity-0 mb-6">
        <button
          onClick={() => { setDismissed(new Set()); setShowAll(true); }}
          className="text-xs text-primary font-medium hover:text-primary-dark transition-colors flex items-center gap-1.5"
        >
          <AIBadge />
          <span>{hiddenCount} AI alert{hiddenCount !== 1 ? 's' : ''} hidden — Show</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {visible.map((alert, i) => {
        const styles = SEVERITY_STYLES[alert.severity];
        return (
          <div
            key={alert.id}
            className="animate-fade-in-up opacity-0 bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden"
            style={{
              animationDelay: `${i * 0.1}s`,
              borderLeft: `4px solid ${styles.border}`,
            }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: styles.icon }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {alert.severity === 'red' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.03 14A1 1 0 003.14 20h17.72a1 1 0 00.87-1.5l-8.03-14a1 1 0 00-1.72 0z" />
                    ) : alert.severity === 'yellow' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    )}
                  </svg>
                  <span className="text-xs font-bold text-navy">{alert.title}</span>
                  <AIBadge label="AI Detected" />
                </div>
                <button
                  onClick={() => {
                    setDismissed((prev) => new Set([...prev, alert.id]));
                  }}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <p className="text-xs text-gray-600 leading-relaxed mb-2 pl-6">{alert.description}</p>

              {alert.impact && (
                <p className="text-[11px] font-semibold text-navy pl-6 mb-2">{alert.impact}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
