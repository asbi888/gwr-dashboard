'use client';

import { useState, useCallback } from 'react';
import PageShell from '@/components/PageShell';
import OdooExportTable from '@/components/OdooExportTable';
import {
  buildOdooExportRows,
  generateOdooCsv,
  getExportSummary,
} from '@/lib/odoo-export-processing';
import {
  formatCurrencyFull,
  formatTimeAgo,
  resolvePresetToRange,
  type DatePreset,
} from '@/lib/utils';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

export default function OdooExportPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoSelectDone, setAutoSelectDone] = useState(false);
  const [accountOverrides, setAccountOverrides] = useState<Record<string, string>>({});

  const hasActiveFilters = datePreset !== 'all_time';

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAccountChange = useCallback((expenseId: string, code: string) => {
    setAccountOverrides((prev) => ({ ...prev, [expenseId]: code }));
  }, []);

  return (
    <PageShell
      title="Odoo Export"
      subtitle="Generate vendor bill CSV for Odoo import"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        // Apply date filter
        const resolved = resolvePresetToRange(datePreset, dateRange);
        let filteredExpenses = data.expenses;

        if (resolved.from) {
          filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
        }
        if (resolved.to) {
          filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);
        }

        const rows = buildOdooExportRows(filteredExpenses);
        const summary = getExportSummary(rows);

        // Auto-select all rows on first render or filter change
        if (!autoSelectDone || selectedIds.size === 0) {
          const allIds = new Set(rows.map((r) => r.expense_id));
          if (allIds.size > 0 && selectedIds.size !== allIds.size) {
            // Use setTimeout to avoid setting state during render
            setTimeout(() => {
              setSelectedIds(allIds);
              setAutoSelectDone(true);
            }, 0);
          }
        }

        const handleToggleAll = () => {
          if (selectedIds.size === rows.length) {
            setSelectedIds(new Set());
          } else {
            setSelectedIds(new Set(rows.map((r) => r.expense_id)));
          }
        };

        const handleDownloadCsv = () => {
          const selectedRows = rows
            .filter((r) => selectedIds.has(r.expense_id))
            .map((r) => ({
              ...r,
              account: accountOverrides[r.expense_id] ?? r.account,
            }));
          if (selectedRows.length === 0) return;

          const csv = generateOdooCsv(selectedRows);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');

          // Generate filename with date range
          const dates = selectedRows.map((r) => r.date).sort();
          const fromDate = dates[0]?.replace(/-/g, '').slice(4); // MMDD
          const toDate = dates[dates.length - 1]?.replace(/-/g, '').slice(4);
          const filename = `odoo-vendor-bills-${fromDate}-${toDate}.csv`;

          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        return (
          <>
            {/* Period Filter Bar */}
            <div className="animate-fade-in-up opacity-0 delay-100 mb-6">
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Period Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Period</span>
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-0.5">
                      {DATE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setDatePreset(preset.value);
                            if (preset.value !== 'custom') setDateRange({ from: null, to: null });
                            setAutoSelectDone(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            datePreset === preset.value
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-gray-500 hover:text-primary hover:bg-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Inputs */}
                  {datePreset === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRange.from || ''}
                        onChange={(e) => {
                          setDateRange({ ...dateRange, from: e.target.value || null });
                          setAutoSelectDone(false);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="date"
                        value={dateRange.to || ''}
                        onChange={(e) => {
                          setDateRange({ ...dateRange, to: e.target.value || null });
                          setAutoSelectDone(false);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                      />
                    </div>
                  )}

                  {/* Export Button + Clear + Live status */}
                  <div className="flex items-center gap-3 lg:ml-auto">
                    <button
                      onClick={handleDownloadCsv}
                      disabled={selectedIds.size === 0}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        selectedIds.size > 0
                          ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export CSV ({selectedIds.size})
                    </button>

                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setDatePreset('all_time');
                          setDateRange({ from: null, to: null });
                          setAutoSelectDone(false);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-accent-red hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </button>
                    )}

                    {lastRefreshed && (
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        Updated {formatTimeAgo(lastRefreshed)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] text-gray-400">Live</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              {/* Total Rows */}
              <div className="animate-fade-in-up opacity-0 delay-200 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Rows</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{summary.totalRows}</p>
                <p className="text-[10px] text-gray-400 mt-1">{summary.supplierCount} suppliers</p>
              </div>

              {/* Total Amount */}
              <div className="animate-fade-in-up opacity-0 delay-300 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#4FD1C5] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.totalAmount > 0 ? formatCurrencyFull(Math.round(summary.totalAmount)) : '—'}
                </p>
                {summary.totalVat > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">VAT: {formatCurrencyFull(Math.round(summary.totalVat))}</p>
                )}
              </div>

              {/* Mapped */}
              <div className="animate-fade-in-up opacity-0 delay-400 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mapped</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{summary.mappedCount}</p>
                <p className="text-[10px] text-green-600 mt-1">Supplier → Account matched</p>
              </div>

              {/* Unmapped */}
              <div className="animate-fade-in-up opacity-0 delay-500 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                    summary.unmappedCount > 0 ? 'from-amber-400 to-amber-500' : 'from-gray-300 to-gray-400'
                  } flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Unmapped</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{summary.unmappedCount}</p>
                {summary.unmappedSuppliers.length > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 truncate" title={summary.unmappedSuppliers.join(', ')}>
                    {summary.unmappedSuppliers.slice(0, 3).join(', ')}
                    {summary.unmappedSuppliers.length > 3 && ` +${summary.unmappedSuppliers.length - 3} more`}
                  </p>
                )}
              </div>
            </div>

            {/* Export Table */}
            <div className="animate-fade-in-up opacity-0 delay-300">
              <OdooExportTable
                rows={rows}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
                accountOverrides={accountOverrides}
                onAccountChange={handleAccountChange}
              />
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
