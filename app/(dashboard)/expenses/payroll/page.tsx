'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import ExpenseDetailTable from '@/components/ExpenseDetailTable';
import AnomalyAlertStack from '@/components/ai/AnomalyAlertStack';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, resolvePresetToRange, type DatePreset } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';

export default function PayrollExpensesPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time');
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'all_time', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <PageShell
      title="Payroll Expenses"
      subtitle="Employee salary and payroll analysis"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const resolved = resolvePresetToRange(datePreset, dateRange);

        // Filter expenses by date AND category = "Payroll"
        let filteredExpenses = data.expenses.filter((e) => e.category === 'Payroll');
        if (resolved.from) filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
        if (resolved.to) filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);

        // KPIs
        const totalExpenses = filteredExpenses.reduce((s, e) => s + e.total_amount, 0);
        const transactionCount = filteredExpenses.length;
        const avgPerTransaction = transactionCount > 0 ? totalExpenses / transactionCount : 0;

        const hasActiveFilters = datePreset !== 'all_time';

        return (
          <>
            {/* AI Anomaly Detection — admin only */}
            {isAdmin && <AnomalyAlertStack data={data} />}

            {/* Custom Filter Bar for Payroll Page */}
            <div className="animate-fade-in-up opacity-0 delay-100 mb-6 relative z-20">
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Date Presets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Period</span>
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-0.5">
                      {DATE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setDatePreset(preset.value);
                            if (preset.value !== 'custom') setDateRange({ from: null, to: null });
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
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value || null })}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="date"
                        value={dateRange.to || ''}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value || null })}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                      />
                    </div>
                  )}

                  {/* Clear + Live */}
                  <div className="flex items-center gap-3 lg:ml-auto">
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setDatePreset('all_time');
                          setDateRange({ from: null, to: null });
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
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">Updated {formatTimeAgo(lastRefreshed)}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] text-gray-400">Live</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-200">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Payroll</p>
                <p className="text-2xl font-bold text-accent-red">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{transactionCount} payments</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-300">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg Payment</p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(avgPerTransaction)}</p>
                <p className="text-xs text-gray-400 mt-0.5">per transaction</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-400">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Payment Method</p>
                <p className="text-2xl font-bold text-navy">Bank Transfer</p>
                <p className="text-xs text-gray-400 mt-0.5">all payments</p>
              </div>
            </div>

            {/* Payroll Details Table */}
            <div className="animate-fade-in-up opacity-0 delay-400">
              {filteredExpenses.length > 0 ? (
                <ExpenseDetailTable expenses={filteredExpenses} suppliers={data.suppliers} />
              ) : (
                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-400 text-sm">No payroll expenses found in this period</p>
                </div>
              )}
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
