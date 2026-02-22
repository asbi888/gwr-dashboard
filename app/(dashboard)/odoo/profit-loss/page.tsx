'use client';

import { useState, useEffect } from 'react';
import {
  fetchPLSnapshotYears,
  fetchPLSnapshot,
  type PLSnapshotRow,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import KPICard, { KPICardSkeleton } from '@/components/KPICard';
import { formatCurrencyFull } from '@/lib/utils';

export default function ProfitLossPage() {
  const { loading: authLoading } = useAuth();
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [rows, setRows] = useState<PLSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchPLSnapshotYears()
      .then((yrs) => {
        setYears(yrs);
        if (yrs.length > 0) setSelectedYear(yrs[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading]);

  useEffect(() => {
    if (!selectedYear || authLoading) return;
    setLoading(true);
    fetchPLSnapshot(selectedYear)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedYear, authLoading]);

  // Extract key figures
  const revenue = rows.find((r) => r.name === 'Revenue')?.balance ?? 0;
  const grossProfit = rows.find((r) => r.name === 'Gross Profit')?.balance ?? 0;
  const operatingIncome = rows.find((r) => r.name === 'Operating Income (or Loss)')?.balance ?? 0;
  const netProfit = rows.find((r) => r.name === 'Net Profit')?.balance ?? 0;

  return (
    <>
      {/* Header */}
      <div className="animate-fade-in-up opacity-0 flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">Profit &amp; Loss</h1>
          <p className="text-xs text-gray-400">Odoo snapshot — Revenue, Costs &amp; Net Profit</p>
        </div>
      </div>

      {/* Year selector */}
      <div className="animate-fade-in-up opacity-0 delay-100 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Year:</label>
          {years.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {years.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedYear === yr
                      ? 'bg-navy text-white border-navy'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : !loading && <span className="text-xs text-gray-400">No snapshots</span>}
          <span className="ml-auto text-[11px] text-gray-400">Data sourced directly from Odoo</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-sm text-red-700">
          Failed to load P&amp;L data: {error}
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
              title="Revenue"
              value={formatCurrencyFull(revenue)}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
              delay="delay-200"
            />
            <KPICard
              title="Gross Profit"
              value={formatCurrencyFull(grossProfit)}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" /></svg>}
              gradient="linear-gradient(135deg, #4FD1C5 0%, #68D5C8 100%)"
              delay="delay-300"
            />
            <KPICard
              title="Operating Income"
              value={formatCurrencyFull(operatingIncome)}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              gradient="linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)"
              delay="delay-400"
            />
            <KPICard
              title="Net Profit"
              value={formatCurrencyFull(netProfit)}
              subtitle={netProfit >= 0 ? 'Profit' : 'Loss'}
              icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              gradient={netProfit >= 0
                ? 'linear-gradient(135deg, #48BB78 0%, #68D391 100%)'
                : 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)'}
              delay="delay-500"
            />
          </div>

          {/* P&L table */}
          <div className="animate-fade-in-up opacity-0 delay-300 bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
            <div className="p-5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 pb-3">Account</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 pb-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isTotal = row.level === 'total';
                    const isSubtotal = row.level === 'subtotal';
                    const isHeader = row.level === 'header';
                    const isAccount = row.level === 'account';

                    return (
                      <tr
                        key={row.row_order}
                        className={`${
                          isTotal ? 'border-t-2 border-navy bg-gradient-to-r from-purple-50 to-teal-50' :
                          isSubtotal ? 'border-t border-gray-200 bg-gray-50/50' :
                          'border-b border-gray-50'
                        }`}
                      >
                        <td className={`py-2.5 text-xs ${
                          isTotal ? 'font-bold text-navy text-sm' :
                          isSubtotal ? 'font-semibold text-navy' :
                          isHeader ? 'font-semibold text-gray-700 pt-4' :
                          'text-gray-600 pl-6'
                        }`}>
                          {isAccount && row.code && (
                            <span className="text-gray-400 mr-2">{row.code}</span>
                          )}
                          {row.name}
                        </td>
                        <td className={`py-2.5 text-right text-xs ${
                          isTotal ? 'font-bold text-navy text-sm' :
                          isSubtotal ? 'font-semibold text-navy' :
                          isHeader && row.balance !== 0 ? 'font-medium text-navy' :
                          isHeader ? 'text-gray-400' :
                          row.balance < 0 ? 'font-medium text-accent-red' :
                          'font-medium text-navy'
                        }`}>
                          {row.balance !== 0 || isTotal || isSubtotal
                            ? formatCurrencyFull(row.balance)
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-10 text-center">
          <p className="text-gray-400 text-sm">No P&amp;L snapshots found.</p>
          <p className="text-gray-400 text-xs mt-1 font-mono">python scripts/import_profit_loss.py</p>
        </div>
      )}
    </>
  );
}
