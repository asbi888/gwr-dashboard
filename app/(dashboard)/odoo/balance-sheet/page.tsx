'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchGeneralLedger, type GeneralLedgerEntry } from '@/lib/supabase';
import {
  computeBalanceSheet,
  getGLDateRange,
  type BSSection,
} from '@/lib/balance-sheet-processing';
import KPICard, { KPICardSkeleton } from '@/components/KPICard';
import { formatCurrencyFull } from '@/lib/utils';

// ── Date preset helpers ──

function endOfLastMonth(): string {
  const d = new Date();
  d.setDate(0); // last day of previous month
  return d.toISOString().split('T')[0];
}

function yearEnd(year: number): string {
  return `${year}-12-31`;
}

const DATE_PRESETS = [
  { label: 'Today', value: () => new Date().toISOString().split('T')[0] },
  { label: 'End of Last Month', value: endOfLastMonth },
  { label: 'Year End 2025', value: () => yearEnd(2025) },
  { label: 'Year End 2024', value: () => yearEnd(2024) },
];

// ── Section component ──

function SectionCard({
  section,
  expanded,
  onToggle,
  delay = '',
}: {
  section: BSSection;
  expanded: boolean;
  onToggle: () => void;
  delay?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up opacity-0 ${delay} bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-bold text-navy">{section.title}</h3>
        </div>
        <span className="text-lg font-bold text-navy">
          {formatCurrencyFull(section.total)}
        </span>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div className="px-5 pb-5">
          {section.subcategories.map((sub) => (
            <div key={sub.name} className="mb-3 last:mb-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                {sub.name}
              </p>
              <table className="w-full">
                <tbody>
                  {sub.accounts.map((acct) => (
                    <tr
                      key={acct.accountId}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-1.5 text-xs text-gray-600">
                        {acct.name}
                      </td>
                      <td
                        className={`py-1.5 text-xs text-right font-medium ${
                          acct.balance < 0 ? 'text-accent-red' : 'text-navy'
                        }`}
                      >
                        {formatCurrencyFull(acct.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──

export default function BalanceSheetPage() {
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    currentAssets: true,
    nonCurrentAssets: true,
    currentLiabilities: true,
    equity: true,
  });

  useEffect(() => {
    fetchGeneralLedger()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const bs = useMemo(
    () => (entries.length > 0 ? computeBalanceSheet(entries, asOfDate) : null),
    [entries, asOfDate]
  );

  const dateRange = useMemo(() => getGLDateRange(entries), [entries]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {/* Header */}
      <div className="animate-fade-in-up opacity-0 flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)',
          }}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">Balance Sheet</h1>
          <p className="text-xs text-gray-400">
            Assets, Liabilities &amp; Equity as of selected date
          </p>
        </div>
      </div>

      {/* Date selector */}
      <div className="animate-fade-in-up opacity-0 delay-100 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-500">As of:</label>
          <input
            type="date"
            value={asOfDate}
            min={dateRange.min}
            max={dateRange.max}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setAsOfDate(preset.value())}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          {dateRange.min && (
            <span className="ml-auto text-[11px] text-gray-400">
              GL data: {dateRange.min} to {dateRange.max}
            </span>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-sm text-red-700">
          Failed to load general ledger data: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      )}

      {/* Balance Sheet content */}
      {bs && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <KPICard
              title="Total Assets"
              value={formatCurrencyFull(bs.totalAssets)}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
              delay="delay-200"
            />
            <KPICard
              title="Total Liabilities"
              value={formatCurrencyFull(bs.totalLiabilities)}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              }
              gradient="linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)"
              delay="delay-300"
            />
            <KPICard
              title="Total Equity"
              value={formatCurrencyFull(bs.totalEquity)}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              gradient="linear-gradient(135deg, #4FD1C5 0%, #68D5C8 100%)"
              delay="delay-400"
            />
            <KPICard
              title="Net Income"
              value={formatCurrencyFull(bs.netIncome)}
              subtitle={bs.netIncome >= 0 ? 'Profit' : 'Loss'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              gradient={
                bs.netIncome >= 0
                  ? 'linear-gradient(135deg, #48BB78 0%, #68D391 100%)'
                  : 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)'
              }
              delay="delay-500"
            />
          </div>

          {/* Balance Sheet sections — two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Left: Assets */}
            <div className="space-y-4">
              <SectionCard
                section={bs.currentAssets}
                expanded={expanded.currentAssets}
                onToggle={() => toggle('currentAssets')}
                delay="delay-300"
              />
              <SectionCard
                section={bs.nonCurrentAssets}
                expanded={expanded.nonCurrentAssets}
                onToggle={() => toggle('nonCurrentAssets')}
                delay="delay-400"
              />
              {/* Assets total */}
              <div className="animate-fade-in-up opacity-0 delay-500 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-navy">Total Assets</span>
                <span className="text-lg font-bold text-navy">
                  {formatCurrencyFull(bs.totalAssets)}
                </span>
              </div>
            </div>

            {/* Right: Liabilities + Equity */}
            <div className="space-y-4">
              <SectionCard
                section={bs.currentLiabilities}
                expanded={expanded.currentLiabilities}
                onToggle={() => toggle('currentLiabilities')}
                delay="delay-300"
              />
              <SectionCard
                section={bs.equity}
                expanded={expanded.equity}
                onToggle={() => toggle('equity')}
                delay="delay-400"
              />
              {/* Liabilities + Equity total */}
              <div className="animate-fade-in-up opacity-0 delay-500 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-navy">
                  Total Liabilities + Equity
                </span>
                <span className="text-lg font-bold text-navy">
                  {formatCurrencyFull(bs.totalLiabilities + bs.totalEquity)}
                </span>
              </div>
            </div>
          </div>

          {/* Accounting equation verification */}
          <div
            className={`animate-fade-in-up opacity-0 delay-700 rounded-2xl p-4 flex items-center justify-between ${
              bs.isBalanced
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {bs.isBalanced ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <span
                className={`text-sm font-semibold ${
                  bs.isBalanced ? 'text-green-700' : 'text-red-700'
                }`}
              >
                Assets = Liabilities + Equity
              </span>
            </div>
            <div className="text-right">
              <p
                className={`text-xs ${
                  bs.isBalanced ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrencyFull(bs.totalAssets)} ={' '}
                {formatCurrencyFull(bs.totalLiabilities)} +{' '}
                {formatCurrencyFull(bs.totalEquity)}
              </p>
              {!bs.isBalanced && (
                <p className="text-xs text-red-500 mt-0.5">
                  Difference: {formatCurrencyFull(bs.difference)}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-10 text-center">
          <p className="text-gray-400 text-sm">
            No general ledger data found. Run the import script first.
          </p>
          <p className="text-gray-300 text-xs mt-1">
            node scripts/import-general-ledger.mjs
          </p>
        </div>
      )}
    </>
  );
}
