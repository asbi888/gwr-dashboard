'use client';

import { useState, useEffect } from 'react';
import {
  fetchARSnapshotDates,
  fetchARSnapshot,
  type ARSnapshotRow,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import KPICard, { KPICardSkeleton } from '@/components/KPICard';
import { formatCurrencyFull } from '@/lib/utils';

export default function AgedReceivablePage() {
  const { loading: authLoading } = useAuth();
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [rows, setRows] = useState<ARSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchARSnapshotDates()
      .then((d) => {
        setDates(d);
        if (d.length > 0) setSelectedDate(d[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading]);

  useEffect(() => {
    if (!selectedDate || authLoading) return;
    setLoading(true);
    fetchARSnapshot(selectedDate)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedDate, authLoading]);

  // Separate total row from partner rows
  const totalRow = rows.find((r) => r.is_total);
  const partnerRows = rows.filter((r) => !r.is_total);

  // KPI values
  const totalReceivable = totalRow?.total ?? 0;
  const currentAmount = totalRow?.at_date ?? 0;
  const overdueAmount = totalReceivable - currentAmount;

  // Count overdue partners (those with amounts in aging buckets)
  const overduePartners = partnerRows.filter(
    (r) => r.bucket_1_30 + r.bucket_31_60 + r.bucket_61_90 + r.bucket_91_120 + r.older > 0
  ).length;

  // Format date for display
  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  // Bucket labels
  const bucketLabels = [
    { key: 'at_date', label: 'Not Due' },
    { key: 'bucket_1_30', label: '1–30' },
    { key: 'bucket_31_60', label: '31–60' },
    { key: 'bucket_61_90', label: '61–90' },
    { key: 'bucket_91_120', label: '91–120' },
    { key: 'older', label: 'Older' },
    { key: 'total', label: 'Total' },
  ] as const;

  return (
    <>
      {/* Header */}
      <div className="animate-fade-in-up opacity-0 flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">Aged Receivable</h1>
          <p className="text-xs text-gray-400">Odoo snapshot — Outstanding balances by aging bucket</p>
        </div>
      </div>

      {/* Date selector */}
      <div className="animate-fade-in-up opacity-0 delay-100 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Snapshot:</label>
          {dates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedDate === d
                      ? 'bg-navy text-white border-navy'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  As of {formatDate(d)}
                </button>
              ))}
            </div>
          ) : !loading && <span className="text-xs text-gray-400">No snapshots</span>}
          <span className="ml-auto text-[11px] text-gray-400">Data sourced directly from Odoo</span>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="animate-fade-in-up opacity-0 delay-150 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.03 14A1 1 0 003.14 20h17.72a1 1 0 00.87-1.5l-8.03-14a1 1 0 00-1.72 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">Balances may appear higher than actual</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Some invoices in Odoo were never posted (confirmed), meaning payments received were not matched against them.
            As a result, outstanding receivable amounts shown here may be overstated.
            To resolve this, please confirm all draft invoices in Odoo so that payments can be properly reconciled.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-sm text-red-700">
          Failed to load aged receivable data: {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <KPICardSkeleton /><KPICardSkeleton /><KPICardSkeleton /><KPICardSkeleton />
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <KPICard
              title="Total Receivable"
              value={formatCurrencyFull(totalReceivable)}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
              delay="delay-200"
            />
            <KPICard
              title="Current (Not Due)"
              value={formatCurrencyFull(currentAmount)}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              gradient="linear-gradient(135deg, #48BB78 0%, #68D391 100%)"
              delay="delay-300"
            />
            <KPICard
              title="Overdue"
              value={formatCurrencyFull(overdueAmount)}
              subtitle={`${overduePartners} partner${overduePartners !== 1 ? 's' : ''} with overdue`}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              gradient={overdueAmount > 0
                ? 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)'
                : 'linear-gradient(135deg, #4FD1C5 0%, #68D5C8 100%)'}
              delay="delay-400"
            />
            <KPICard
              title="Partners"
              value={String(partnerRows.length)}
              subtitle="With outstanding balances"
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              gradient="linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)"
              delay="delay-500"
            />
          </div>

          {/* Aging table */}
          <div className="animate-fade-in-up opacity-0 delay-300 bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
            <div className="p-5 overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 pb-3">Partner</th>
                    {bucketLabels.map((b) => (
                      <th key={b.key} className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 pb-3 pl-3">
                        {b.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Total row at top */}
                  {totalRow && (
                    <tr className="border-b-2 border-navy bg-gradient-to-r from-purple-50 to-teal-50">
                      <td className="py-3 text-sm font-bold text-navy">Total</td>
                      {bucketLabels.map((b) => (
                        <td key={b.key} className="py-3 text-right text-sm font-bold text-navy pl-3">
                          {formatCurrencyFull(totalRow[b.key])}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Partner rows */}
                  {partnerRows.map((row) => (
                    <tr key={row.row_order} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 text-xs text-gray-700 font-medium">
                        {row.partner_name}
                      </td>
                      {bucketLabels.map((b) => {
                        const val = row[b.key];
                        const isOverdue = b.key !== 'at_date' && b.key !== 'total' && val > 0;
                        return (
                          <td
                            key={b.key}
                            className={`py-2.5 text-right text-xs pl-3 ${
                              b.key === 'total'
                                ? 'font-semibold text-navy'
                                : isOverdue
                                ? 'font-medium text-accent-red'
                                : val !== 0
                                ? 'font-medium text-navy'
                                : 'text-gray-300'
                            }`}
                          >
                            {val !== 0 ? formatCurrencyFull(val) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aging distribution bar */}
          {totalRow && totalReceivable > 0 && (
            <div className="animate-fade-in-up opacity-0 delay-500 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-5 mt-6">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-3 font-semibold">Aging Distribution</p>
              <div className="flex rounded-lg overflow-hidden h-6 mb-3">
                {[
                  { key: 'at_date' as const, color: '#48BB78', label: 'Not Due' },
                  { key: 'bucket_1_30' as const, color: '#F6AD55', label: '1–30' },
                  { key: 'bucket_31_60' as const, color: '#ED8936', label: '31–60' },
                  { key: 'bucket_61_90' as const, color: '#E53E3E', label: '61–90' },
                  { key: 'bucket_91_120' as const, color: '#C53030', label: '91–120' },
                  { key: 'older' as const, color: '#9B2C2C', label: 'Older' },
                ].map((bucket) => {
                  const val = totalRow[bucket.key];
                  const pct = totalReceivable > 0 ? (val / totalReceivable) * 100 : 0;
                  if (pct < 0.5) return null;
                  return (
                    <div
                      key={bucket.key}
                      className="flex items-center justify-center text-white text-[10px] font-semibold"
                      style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                      title={`${bucket.label}: ${formatCurrencyFull(val)} (${pct.toFixed(1)}%)`}
                    >
                      {pct > 8 ? `${pct.toFixed(0)}%` : ''}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { key: 'at_date' as const, color: '#48BB78', label: 'Not Due' },
                  { key: 'bucket_1_30' as const, color: '#F6AD55', label: '1–30 days' },
                  { key: 'bucket_31_60' as const, color: '#ED8936', label: '31–60 days' },
                  { key: 'bucket_61_90' as const, color: '#E53E3E', label: '61–90 days' },
                  { key: 'bucket_91_120' as const, color: '#C53030', label: '91–120 days' },
                  { key: 'older' as const, color: '#9B2C2C', label: 'Older' },
                ].map((bucket) => {
                  const val = totalRow[bucket.key];
                  if (val === 0) return null;
                  return (
                    <div key={bucket.key} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: bucket.color }} />
                      <span className="text-[11px] text-gray-600">
                        {bucket.label}: <span className="font-semibold text-navy">{formatCurrencyFull(val)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-10 text-center">
          <p className="text-gray-400 text-sm">No aged receivable snapshots found.</p>
          <p className="text-gray-300 text-xs mt-2">Export an Aged Receivable report from Odoo as XLSX, then run:</p>
          <p className="text-gray-400 text-xs mt-1 font-mono">python scripts/import_aged_receivable.py</p>
        </div>
      )}
    </>
  );
}
