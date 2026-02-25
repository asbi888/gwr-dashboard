'use client';

import { useState, useEffect } from 'react';
import {
  fetchBSSnapshotDates,
  fetchBSSnapshot,
  type BSSnapshotRow,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import KPICard, { KPICardSkeleton } from '@/components/KPICard';
import { formatCurrencyFull } from '@/lib/utils';

// ── Snapshot section renderer ──

function SnapshotSection({
  title,
  rows,
  sectionTotal,
  expanded,
  onToggle,
  delay = '',
}: {
  title: string;
  rows: BSSnapshotRow[];
  sectionTotal: number;
  expanded: boolean;
  onToggle: () => void;
  delay?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up opacity-0 ${delay} bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden`}
    >
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
          <h3 className="text-sm font-bold text-navy">{title}</h3>
        </div>
        <span className="text-lg font-bold text-navy">
          {formatCurrencyFull(sectionTotal)}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {rows.map((row) => {
            if (row.level === 'category' || row.level === 'subcategory') {
              return (
                <div key={row.row_order} className="mt-3 first:mt-0 mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {row.name}
                  </p>
                  {row.level === 'category' && row.balance !== 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-500">{row.name}</span>
                      <span className="text-xs font-medium text-navy">
                        {formatCurrencyFull(row.balance)}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            if (row.level === 'account') {
              return (
                <div
                  key={row.row_order}
                  className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-xs text-gray-600">
                    {row.code ? `${row.code} ` : ''}{row.name}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      row.balance < 0 ? 'text-accent-red' : 'text-navy'
                    }`}
                  >
                    {formatCurrencyFull(row.balance)}
                  </span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ──

export default function BalanceSheetPage() {
  const { profile, loading: authLoading } = useAuth();
  const [snapshotDates, setSnapshotDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [rows, setRows] = useState<BSSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    ASSETS: true,
    LIABILITIES: true,
    EQUITY: true,
  });

  // Load available snapshot dates (wait for auth to be fully ready)
  const profileId = profile?.id;
  useEffect(() => {
    if (authLoading || !profileId) return;
    fetchBSSnapshotDates()
      .then((dates) => {
        setSnapshotDates(dates);
        if (dates.length > 0) {
          setSelectedDate(dates[0]); // most recent
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading, profileId]);

  // Load snapshot data when date changes
  useEffect(() => {
    if (!selectedDate || authLoading || !profileId) return;
    setLoading(true);
    fetchBSSnapshot(selectedDate)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedDate, authLoading, profileId]);

  // Derive section data
  const sections = ['ASSETS', 'LIABILITIES', 'EQUITY'] as const;
  const sectionRows: Record<string, BSSnapshotRow[]> = {};
  const sectionTotals: Record<string, number> = {};

  for (const sec of sections) {
    const secRows = rows.filter(
      (r) => r.parent_section === sec && r.level !== 'section'
    );
    sectionRows[sec] = secRows;
    // Section total comes from the section-level row
    const sectionRow = rows.find(
      (r) => r.parent_section === sec && r.level === 'section'
    );
    sectionTotals[sec] = sectionRow?.balance ?? 0;
  }

  const totalAssets = sectionTotals['ASSETS'] ?? 0;
  const totalLiabilities = sectionTotals['LIABILITIES'] ?? 0;
  const totalEquity = sectionTotals['EQUITY'] ?? 0;
  const liabPlusEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - liabPlusEquity) < 0.01;

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // Format snapshot date for display
  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

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
            Odoo snapshot — Assets, Liabilities &amp; Equity
          </p>
        </div>
      </div>

      {/* Snapshot selector */}
      <div className="animate-fade-in-up opacity-0 delay-100 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Snapshot:</label>
          {snapshotDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {snapshotDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedDate === date
                      ? 'bg-navy text-white border-navy'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  As of {formatDate(date)}
                </button>
              ))}
            </div>
          ) : (
            !loading && (
              <span className="text-xs text-gray-400">No snapshots available</span>
            )
          )}
          {selectedDate && (
            <span className="ml-auto text-[11px] text-gray-400">
              Data sourced directly from Odoo
            </span>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-sm text-red-700">
          Failed to load balance sheet data: {error}
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
      {!loading && rows.length > 0 && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            <KPICard
              title="Total Assets"
              value={formatCurrencyFull(totalAssets)}
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
              value={formatCurrencyFull(totalLiabilities)}
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
              value={formatCurrencyFull(totalEquity)}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              gradient="linear-gradient(135deg, #4FD1C5 0%, #68D5C8 100%)"
              delay="delay-400"
            />
          </div>

          {/* Balance Sheet sections — two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Left: Assets */}
            <div className="space-y-4">
              <SnapshotSection
                title="ASSETS"
                rows={sectionRows['ASSETS'] || []}
                sectionTotal={totalAssets}
                expanded={expanded['ASSETS'] ?? true}
                onToggle={() => toggle('ASSETS')}
                delay="delay-300"
              />
              <div className="animate-fade-in-up opacity-0 delay-500 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-navy">Total Assets</span>
                <span className="text-lg font-bold text-navy">
                  {formatCurrencyFull(totalAssets)}
                </span>
              </div>
            </div>

            {/* Right: Liabilities + Equity */}
            <div className="space-y-4">
              <SnapshotSection
                title="LIABILITIES"
                rows={sectionRows['LIABILITIES'] || []}
                sectionTotal={totalLiabilities}
                expanded={expanded['LIABILITIES'] ?? true}
                onToggle={() => toggle('LIABILITIES')}
                delay="delay-300"
              />
              <SnapshotSection
                title="EQUITY"
                rows={sectionRows['EQUITY'] || []}
                sectionTotal={totalEquity}
                expanded={expanded['EQUITY'] ?? true}
                onToggle={() => toggle('EQUITY')}
                delay="delay-400"
              />
              <div className="animate-fade-in-up opacity-0 delay-500 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-navy">
                  Liabilities + Equity
                </span>
                <span className="text-lg font-bold text-navy">
                  {formatCurrencyFull(liabPlusEquity)}
                </span>
              </div>
            </div>
          </div>

          {/* Accounting equation verification */}
          <div
            className={`animate-fade-in-up opacity-0 delay-700 rounded-2xl p-4 flex items-center justify-between ${
              isBalanced
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
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
                  isBalanced ? 'text-green-700' : 'text-red-700'
                }`}
              >
                Assets = Liabilities + Equity
              </span>
            </div>
            <div className="text-right">
              <p
                className={`text-xs ${
                  isBalanced ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrencyFull(totalAssets)} ={' '}
                {formatCurrencyFull(totalLiabilities)} +{' '}
                {formatCurrencyFull(totalEquity)}
              </p>
              {!isBalanced && (
                <p className="text-xs text-red-500 mt-0.5">
                  Difference: {formatCurrencyFull(Math.abs(totalAssets - liabPlusEquity))}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-10 text-center">
          <p className="text-gray-400 text-sm">
            No balance sheet snapshots found.
          </p>
          <p className="text-gray-300 text-xs mt-2">
            Export a Balance Sheet from Odoo as XLSX, then run:
          </p>
          <p className="text-gray-400 text-xs mt-1 font-mono">
            python scripts/import_balance_sheet.py
          </p>
        </div>
      )}
    </>
  );
}
